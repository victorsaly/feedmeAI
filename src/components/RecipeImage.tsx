import { useState } from 'react'
import { ChefHat, Image as ImageIcon, Heart, Sparkle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
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

  // Don't show any image if we don't have a generated one - just show cooking icon
  if (!recipe.generatedImageUrl) {
    return (
      <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center space-y-3 min-h-[120px]">
          {/* Cooking icon instead of misleading placeholder */}
          <div className="p-3 bg-orange-100 rounded-full">
            <ChefHat size={28} className="text-orange-600" />
          </div>
          
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
          src={recipe.generatedImageUrl}
          alt={`${recipe.title} recipe`}
          className="w-full h-32 object-cover rounded-lg"
          onError={() => setImageError(true)}
          loading="lazy"
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