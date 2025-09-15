import { imageCache } from './image-cache'
import { OpenAIAnalyzer } from './openai-analyzer'

interface ImagePreloadOptions {
  priority: 'high' | 'medium' | 'low'
  progressive?: boolean
  placeholder?: string
}

interface ProgressiveImage {
  blurred: string  // Low-res blurred version
  full: string     // High-res final version
  loaded: boolean
}

/**
 * Advanced Image Preloader with Progressive Loading
 */
export class ImagePreloader {
  private preloadQueue: Map<string, ImagePreloadOptions> = new Map()
  private loadingStates: Map<string, 'pending' | 'loading' | 'loaded' | 'error'> = new Map()
  private progressiveImages: Map<string, ProgressiveImage> = new Map()
  private analyzer: OpenAIAnalyzer | null = null

  constructor() {
    // Initialize OpenAI analyzer if available
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.analyzer = new OpenAIAnalyzer(import.meta.env.VITE_OPENAI_API_KEY)
    }
  }

  /**
   * Add images to preload queue
   */
  preload(imageKey: string, prompt: string, options: ImagePreloadOptions = { priority: 'medium' }): void {
    this.preloadQueue.set(imageKey, options)
    this.loadingStates.set(imageKey, 'pending')

    // Start loading based on priority
    if (options.priority === 'high') {
      this.loadImage(imageKey, prompt, options)
    } else {
      // Queue for batch processing
      this.scheduleQueueProcessing()
    }
  }

  /**
   * Get image with progressive loading support
   */
  async getImage(imageKey: string): Promise<ProgressiveImage | string | null> {
    // Check cache first
    const cached = await imageCache.get(imageKey)
    if (cached) {
      return cached
    }

    // Check if progressive version available
    const progressive = this.progressiveImages.get(imageKey)
    if (progressive) {
      return progressive
    }

    return null
  }

  /**
   * Create blurred placeholder for progressive loading
   */
  private async createBlurredPlaceholder(originalUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(originalUrl)
          return
        }

        // Create very small version for blur
        const smallSize = 20
        canvas.width = smallSize
        canvas.height = smallSize
        
        ctx.drawImage(img, 0, 0, smallSize, smallSize)
        
        // Apply blur effect via CSS filter when used
        const blurredUrl = canvas.toDataURL('image/jpeg', 0.3)
        resolve(blurredUrl)
      }
      img.onerror = () => resolve(originalUrl)
      img.src = originalUrl
    })
  }

  /**
   * Load individual image with progressive enhancement
   */
  private async loadImage(imageKey: string, prompt: string, options: ImagePreloadOptions): Promise<void> {
    if (this.loadingStates.get(imageKey) === 'loading') return
    
    this.loadingStates.set(imageKey, 'loading')

    try {
      if (!this.analyzer) {
        throw new Error('OpenAI analyzer not available')
      }

      // Generate image
      const result = await this.analyzer.generateRecipeImage(prompt, [prompt])
      
      if (options.progressive && result.imageUrl.startsWith('data:image/')) {
        // Create blurred placeholder first
        const blurred = await this.createBlurredPlaceholder(result.imageUrl)
        
        // Store progressive version
        this.progressiveImages.set(imageKey, {
          blurred,
          full: result.imageUrl,
          loaded: true
        })
      }

      // Cache the final image
      await imageCache.set(imageKey, result.imageUrl)
      this.loadingStates.set(imageKey, 'loaded')
      
    } catch (error) {
      console.warn(`Failed to preload image for ${imageKey}:`, error)
      this.loadingStates.set(imageKey, 'error')
    }
  }

  /**
   * Process preload queue in batches
   */
  private scheduleQueueProcessing(): void {
    // Debounce to avoid too frequent processing
    if (this.processingTimeout) return
    
    this.processingTimeout = setTimeout(() => {
      this.processQueue()
      this.processingTimeout = null
    }, 500)
  }

  private processingTimeout: NodeJS.Timeout | null = null

  private async processQueue(): Promise<void> {
    const pending = Array.from(this.preloadQueue.entries())
      .filter(([key]) => this.loadingStates.get(key) === 'pending')
      .sort(([, a], [, b]) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

    // Process in smaller batches to avoid overwhelming
    const batchSize = 2
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize)
      
      const promises = batch.map(([key, options]) => {
        // Use key as prompt for now - could be enhanced
        return this.loadImage(key, key, options)
      })

      await Promise.allSettled(promises)
      
      // Small delay between batches
      if (i + batchSize < pending.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }

  /**
   * Preload cooking steps for a recipe
   */
  async preloadRecipeSteps(
    recipeTitle: string, 
    steps: Array<{ instruction: string; imagePrompt: string }>,
    currentStep = 0
  ): Promise<void> {
    steps.forEach((step, index) => {
      const imageKey = `${recipeTitle}-step-${index}-${step.instruction.slice(0, 50)}`
      
      let priority: 'high' | 'medium' | 'low' = 'low'
      
      // Higher priority for current and next steps
      if (index <= currentStep + 1) priority = 'high'
      else if (index <= currentStep + 3) priority = 'medium'
      
      this.preload(imageKey, step.imagePrompt, { 
        priority, 
        progressive: priority === 'high' 
      })
    })
  }

  /**
   * Preload popular recipe images
   */
  async preloadPopularRecipes(recipes: Array<{ title: string; id: string }>): Promise<void> {
    recipes.slice(0, 5).forEach((recipe) => {
      const imageKey = `recipe-${recipe.id}`
      this.preload(imageKey, `Delicious ${recipe.title} recipe`, { 
        priority: 'low',
        progressive: false 
      })
    })
  }

  /**
   * Get loading state for debugging
   */
  getLoadingState(imageKey: string): string {
    return this.loadingStates.get(imageKey) || 'not-queued'
  }

  /**
   * Clear preload queue
   */
  clearQueue(): void {
    this.preloadQueue.clear()
    this.loadingStates.clear()
    this.progressiveImages.clear()
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const states = Array.from(this.loadingStates.values())
    return {
      total: states.length,
      pending: states.filter(s => s === 'pending').length,
      loading: states.filter(s => s === 'loading').length,
      loaded: states.filter(s => s === 'loaded').length,
      error: states.filter(s => s === 'error').length
    }
  }
}

// Export singleton instance
export const imagePreloader = new ImagePreloader()