import { useState } from 'react'
import { ChefHat, Image as ImageIcon, Clock } from '@phosphor-icons/react'

interface CookingStepImageProps {
  stepImage?: string
  imagePrompt: string
  isLoading?: boolean
  stepNumber: number
  instruction: string
}

export function CookingStepImage({ 
  stepImage, 
  imagePrompt, 
  isLoading, 
  stepNumber, 
  instruction 
}: CookingStepImageProps) {
  const [imageError, setImageError] = useState(false)

  // Show loading state with cooking icon
  if (isLoading) {
    return (
      <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-lg p-8">
        <div className="flex flex-col items-center justify-center space-y-4 min-h-[200px]">
          <div className="animate-pulse w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center">
            <ChefHat size={32} className="text-orange-600" />
          </div>
          <div className="space-y-2 text-center">
            <div className="h-3 bg-orange-200 rounded w-32 animate-pulse"></div>
            <p className="text-sm text-orange-600 font-medium">Preparing step visual...</p>
            <p className="text-xs text-orange-500">Step {stepNumber}</p>
          </div>
        </div>
      </div>
    )
  }

  // Show generated image if available
  if (stepImage && !imageError) {
    return (
      <div className="relative">
        <img
          src={stepImage}
          alt={`Step ${stepNumber}: ${instruction}`}
          className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-md"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          Step {stepNumber}
        </div>
      </div>
    )
  }

  // Fallback with cooking icon (no misleading generic images)
  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-8">
      <div className="flex flex-col items-center justify-center space-y-4 min-h-[200px]">
        <div className="p-4 bg-gray-200 rounded-full">
          <ChefHat size={32} className="text-gray-500" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 font-medium">Step {stepNumber}</p>
          <p className="text-xs text-gray-500 max-w-sm">
            Follow the instructions below - visual coming soon!
          </p>
        </div>
      </div>
    </div>
  )
}