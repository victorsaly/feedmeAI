import { useState, useEffect } from 'react'
import { ChefHat, Image as ImageIcon, Heart, Sparkle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { imageCache } from '@/lib/image-cache'
import type { Recipe } from '@/lib/openai-analyzer'

interface RecipeImageProps {
  recipe: Recipe
  isGeneratingImage?: boolean
  onGenerateImage?: () => void
  onToggleFavorite?: () => void
  isFavorited?: boolean
}

export function RecipeImage({ 
  recipe, 
  isGeneratingImage, 
  onGenerateImage, 
  onToggleFavorite, 
  isFavorited 
}: RecipeImageProps) {
  const [imageError, setImageError] = useState(false)
  const [cachedImage, setCachedImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)

  // Load cached image on mount
  useEffect(() => {
    const loadCachedImage = async () => {
      const cacheKey = `recipe-${recipe.id || recipe.title}`
      const cached = await imageCache.get(cacheKey)
      
      if (cached) {
        setCachedImage(cached)
        setImageLoading(false)
      } else if (recipe.generatedImageUrl) {
        // Cache the existing image
        await imageCache.set(cacheKey, recipe.generatedImageUrl)
        setCachedImage(recipe.generatedImageUrl)
        setImageLoading(false)
      } else {
        setImageLoading(false)
      }
    }
    
    loadCachedImage()
  }, [recipe.id, recipe.title, recipe.generatedImageUrl])

  const displayImageUrl = cachedImage || recipe.generatedImageUrl

  // Don't show any image if we don't have a generated one - just show cooking icon
  if (!displayImageUrl || imageLoading) {
    return (
      <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center space-y-3 min-h-[120px]">
          {/* Cooking icon instead of misleading placeholder */}
          <div className="p-3 bg-orange-100 rounded-full">
            <ChefHat size={28} className="text-orange-600" />
          </div>
          
          {imageLoading && (
            <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
          )}
          
          {/* Optional generate image button */}
          {onGenerateImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateImage}
              disabled={isGeneratingImage}
              className="flex items-center gap-2 text-xs bg-white/80 backdrop-blur-sm"
            >
              {isGeneratingImage ? (
                <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
              ) : (
                <Sparkle size={12} />
              )}
              <span>
                {isGeneratingImage ? 'Creating...' : 'Generate Image'}
              </span>
            </Button>
          )}
        </div>

        {/* Favorite button */}
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm"
            onClick={onToggleFavorite}
          >
            <Heart 
              size={16} 
              className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"}
            />
          </Button>
        )}
      </div>
    )
  }

  // Show generated image with proper error handling
  return (
    <div className="relative">
      {!imageError ? (
        <img
          src={displayImageUrl}
          alt={`${recipe.title} recipe`}
          className="w-full h-32 object-cover rounded-lg transition-opacity duration-300"
          onError={() => setImageError(true)}
          loading="lazy"
          style={{
            filter: imageLoading ? 'blur(5px)' : 'none',
            transition: 'filter 0.3s ease-in-out'
          }}
        />
      ) : (
        // Fallback when image fails to load
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col items-center justify-center space-y-3 min-h-[120px]">
            <div className="p-3 bg-gray-200 rounded-full">
              <ImageIcon size={28} className="text-gray-500" />
            </div>
            <p className="text-xs text-gray-500 text-center">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Favorite button overlay */}
      {onToggleFavorite && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm"
          onClick={onToggleFavorite}
        >
          <Heart 
            size={16} 
            className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"}
          />
        </Button>
      )}
    </div>
  )
}