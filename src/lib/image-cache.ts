/**
 * Enhanced Image Cache System with Persistent Storage
 * Provides fast, persistent caching for AI-generated recipe images
 */

interface CachedImage {
  url: string
  timestamp: number
  size: number
  format: string
  compressed?: string // WebP compressed version
}

interface CacheStats {
  totalImages: number
  totalSize: number
  hitRate: number
  lastCleanup: number
}

export class ImageCache {
  private static readonly STORAGE_KEY = 'feedme-image-cache'
  private static readonly STATS_KEY = 'feedme-cache-stats'
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
  private static readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days
  private static readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

  private memoryCache = new Map<string, string>()
  private stats: CacheStats = {
    totalImages: 0,
    totalSize: 0,
    hitRate: 0,
    lastCleanup: Date.now()
  }

  constructor() {
    this.loadStats()
    this.scheduleCleanup()
  }

  /**
   * Get cached image with fallback to storage
   */
  async get(key: string): Promise<string | null> {
    // Check memory cache first (fastest)
    const memoryHit = this.memoryCache.get(key)
    if (memoryHit) {
      this.updateStats(true)
      return memoryHit
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`${ImageCache.STORAGE_KEY}-${key}`)
      if (stored) {
        const cached: CachedImage = JSON.parse(stored)
        
        // Check if expired
        if (Date.now() - cached.timestamp > ImageCache.MAX_CACHE_AGE) {
          this.delete(key)
          this.updateStats(false)
          return null
        }

        // Add to memory cache for faster future access
        this.memoryCache.set(key, cached.compressed || cached.url)
        this.updateStats(true)
        return cached.compressed || cached.url
      }
    } catch (error) {
      console.warn('Failed to retrieve cached image:', error)
    }

    this.updateStats(false)
    return null
  }

  /**
   * Store image with optional compression
   */
  async set(key: string, url: string, compress = true): Promise<void> {
    try {
      let compressedUrl = url
      let size = url.length

      // Optional: Compress image if it's a data URL
      if (compress && url.startsWith('data:image/')) {
        compressedUrl = await this.compressImage(url)
        size = compressedUrl.length
      }

      const cached: CachedImage = {
        url,
        timestamp: Date.now(),
        size,
        format: url.startsWith('data:image/') ? 'base64' : 'url',
        compressed: compress ? compressedUrl : undefined
      }

      // Store in localStorage
      localStorage.setItem(`${ImageCache.STORAGE_KEY}-${key}`, JSON.stringify(cached))
      
      // Add to memory cache
      this.memoryCache.set(key, compressedUrl)
      
      // Update stats
      this.stats.totalImages++
      this.stats.totalSize += size
      this.saveStats()

      // Check if cleanup needed
      if (this.stats.totalSize > ImageCache.MAX_CACHE_SIZE) {
        await this.cleanup()
      }

    } catch (error) {
      console.warn('Failed to cache image:', error)
    }
  }

  /**
   * Delete cached image
   */
  delete(key: string): void {
    try {
      localStorage.removeItem(`${ImageCache.STORAGE_KEY}-${key}`)
      this.memoryCache.delete(key)
      this.stats.totalImages = Math.max(0, this.stats.totalImages - 1)
    } catch (error) {
      console.warn('Failed to delete cached image:', error)
    }
  }

  /**
   * Preload images for better performance
   */
  async preload(keys: string[], generator: (key: string) => Promise<string>): Promise<void> {
    const preloadPromises = keys.map(async (key) => {
      // Skip if already cached
      if (await this.get(key)) return

      try {
        const url = await generator(key)
        await this.set(key, url)
      } catch (error) {
        console.warn(`Failed to preload image for key ${key}:`, error)
      }
    })

    // Load in batches to avoid overwhelming the system
    const batchSize = 3
    for (let i = 0; i < preloadPromises.length; i += batchSize) {
      const batch = preloadPromises.slice(i, i + batchSize)
      await Promise.all(batch)
      
      // Small delay between batches
      if (i + batchSize < preloadPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  /**
   * Compress image to WebP format if supported
   */
  private async compressImage(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(dataUrl)
          return
        }

        // Reduce size for faster loading
        const maxWidth = 800
        const maxHeight = 600
        
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Try WebP first, fallback to JPEG
        const webpUrl = canvas.toDataURL('image/webp', 0.8)
        if (webpUrl.startsWith('data:image/webp')) {
          resolve(webpUrl)
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })
  }

  /**
   * Clean up old/large cached items
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up image cache...')
    
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(ImageCache.STORAGE_KEY)) {
          keys.push(key)
        }
      }

      // Sort by timestamp (oldest first)
      const itemsWithAge = keys.map(key => {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const cached: CachedImage = JSON.parse(stored)
            return { key, age: Date.now() - cached.timestamp, size: cached.size }
          }
        } catch (error) {
          return { key, age: Date.now(), size: 0 }
        }
        return null
      }).filter(Boolean) as Array<{ key: string; age: number; size: number }>

      itemsWithAge.sort((a, b) => b.age - a.age)

      // Remove old items until under size limit
      let currentSize = this.stats.totalSize
      let removed = 0
      
      for (const item of itemsWithAge) {
        if (currentSize <= ImageCache.MAX_CACHE_SIZE * 0.8) break
        
        localStorage.removeItem(item.key)
        const cacheKey = item.key.replace(`${ImageCache.STORAGE_KEY}-`, '')
        this.memoryCache.delete(cacheKey)
        
        currentSize -= item.size
        removed++
      }

      this.stats.totalSize = currentSize
      this.stats.totalImages -= removed
      this.stats.lastCleanup = Date.now()
      this.saveStats()

      console.log(`✅ Cleaned up ${removed} cached images`)
    } catch (error) {
      console.error('Failed to cleanup cache:', error)
    }
  }

  /**
   * Schedule automatic cleanup
   */
  private scheduleCleanup(): void {
    const timeSinceLastCleanup = Date.now() - this.stats.lastCleanup
    const timeUntilNextCleanup = Math.max(0, ImageCache.CLEANUP_INTERVAL - timeSinceLastCleanup)
    
    setTimeout(async () => {
      await this.cleanup()
      this.scheduleCleanup() // Reschedule
    }, timeUntilNextCleanup)
  }

  /**
   * Update cache statistics
   */
  private updateStats(hit: boolean): void {
    const totalRequests = (this.stats.hitRate * this.stats.totalImages) + 1
    this.stats.hitRate = hit ? 
      (this.stats.hitRate * (this.stats.totalImages) + 1) / totalRequests :
      (this.stats.hitRate * (this.stats.totalImages)) / totalRequests
  }

  /**
   * Load cache statistics
   */
  private loadStats(): void {
    try {
      const stored = localStorage.getItem(ImageCache.STATS_KEY)
      if (stored) {
        this.stats = { ...this.stats, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Failed to load cache stats:', error)
    }
  }

  /**
   * Save cache statistics
   */
  private saveStats(): void {
    try {
      localStorage.setItem(ImageCache.STATS_KEY, JSON.stringify(this.stats))
    } catch (error) {
      console.warn('Failed to save cache stats:', error)
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key?.startsWith(ImageCache.STORAGE_KEY)) {
          localStorage.removeItem(key)
        }
      }
      localStorage.removeItem(ImageCache.STATS_KEY)
      this.memoryCache.clear()
      this.stats = {
        totalImages: 0,
        totalSize: 0,
        hitRate: 0,
        lastCleanup: Date.now()
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache()