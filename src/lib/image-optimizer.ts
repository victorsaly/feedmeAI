/**
 * Image optimization utilities for reducing file size and processing time
 * before sending images to AI analysis services
 */

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp'
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.8,
  format: 'jpeg'
}

/**
 * Optimizes an image by resizing and compressing it
 * @param file Original image file
 * @param options Optimization options
 * @returns Optimized image as base64 data URL
 */
export async function optimizeImage(
  file: File, 
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    if (!ctx) {
      reject(new Error('Could not create canvas context'))
      return
    }
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateOptimalSize(
          img.width,
          img.height,
          opts.maxWidth,
          opts.maxHeight
        )
        
        // Set canvas size
        canvas.width = newWidth
        canvas.height = newHeight
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        // Convert to optimized format
        const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/jpeg'
        const optimizedDataUrl = canvas.toDataURL(mimeType, opts.quality)
        
        resolve(optimizedDataUrl)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate optimal image dimensions while maintaining aspect ratio
 */
function calculateOptimalSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight
  
  // If image is smaller than max dimensions, keep original size
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }
  
  // Calculate scaling factor to fit within max dimensions
  const widthRatio = maxWidth / width
  const heightRatio = maxHeight / height
  const scale = Math.min(widthRatio, heightRatio)
  
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  }
}

/**
 * Get file size information for logging and debugging
 */
export function getImageSizeInfo(dataUrl: string): {
  sizeInBytes: number
  sizeInKB: number
  sizeInMB: number
} {
  // Remove data URL prefix to get just the base64 data
  const base64Data = dataUrl.split(',')[1] || ''
  const sizeInBytes = Math.round((base64Data.length * 3) / 4)
  
  return {
    sizeInBytes,
    sizeInKB: Math.round(sizeInBytes / 1024),
    sizeInMB: Math.round(sizeInBytes / (1024 * 1024) * 100) / 100
  }
}

/**
 * Optimizes image specifically for OpenAI Vision API
 * Uses recommended settings for best cost/performance ratio
 */
export async function optimizeForOpenAI(file: File): Promise<string> {
  return optimizeImage(file, {
    maxWidth: 768,    // OpenAI recommends 768px for good detail/cost ratio
    maxHeight: 768,
    quality: 0.85,    // Good quality while reducing size
    format: 'jpeg'    // Better compression than PNG for photos
  })
}
