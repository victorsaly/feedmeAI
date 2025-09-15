import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Heart, 
  Lightbulb, 
  Image as ImageIcon,
  ChefHat,
  Sparkle,
  Upload as UploadIcon
} from '@phosphor-icons/react'

export type MenuSection = 'upload' | 'ideas' | 'favorites' | 'examples'

interface NavigationMenuProps {
  currentSection: MenuSection
  onSectionChange: (section: MenuSection) => void
  favoritesCount?: number
  hasIngredients?: boolean
}

const menuItems = [
  {
    id: 'upload' as MenuSection,
    label: 'Upload',
    icon: Camera,
    description: 'Add ingredients photo',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'ideas' as MenuSection,
    label: 'Recipe Ideas',
    icon: ChefHat,
    description: 'AI recipe suggestions',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 'favorites' as MenuSection,
    label: 'Favorites',
    icon: Heart,
    description: 'Saved recipes',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    id: 'examples' as MenuSection,
    label: 'Examples',
    icon: ImageIcon,
    description: 'Photo tips & guides',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
]

export function NavigationMenu({ 
  currentSection, 
  onSectionChange, 
  favoritesCount = 0,
  hasIngredients = false 
}: NavigationMenuProps) {
  return (
    <div className="w-full bg-white border-b sticky top-0 z-40 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Logo */}
        <div className="flex items-center justify-between py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FeedMe AI</h1>
              <p className="text-sm text-gray-500">Smart Recipe Generator</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          {(favoritesCount > 0 || hasIngredients) && (
            <div className="flex items-center gap-2">
              {hasIngredients && (
                <Badge variant="secondary" className="text-xs">
                  <Camera className="w-3 h-3 mr-1" />
                  Ingredients Ready
                </Badge>
              )}
              {favoritesCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Heart className="w-3 h-3 mr-1" />
                  {favoritesCount} Saved
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto py-2 -mx-2">
          <div className="flex gap-2 px-2 min-w-full">
            {menuItems.map((item) => {
              const isActive = currentSection === item.id
              const Icon = item.icon
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onSectionChange(item.id)}
                  className={`
                    flex-1 min-w-[120px] h-auto p-3 flex flex-col items-center gap-2
                    ${isActive 
                      ? `${item.bgColor} ${item.borderColor} ${item.color} border` 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon 
                      size={20} 
                      className={isActive ? item.color : 'text-gray-600'} 
                    />
                    <span className={`font-medium text-sm ${isActive ? item.color : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                    
                    {/* Special badges */}
                    {item.id === 'favorites' && favoritesCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs min-w-5 h-5 rounded-full p-0 flex items-center justify-center"
                      >
                        {favoritesCount > 99 ? '99+' : favoritesCount}
                      </Badge>
                    )}
                    
                    {item.id === 'ideas' && hasIngredients && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  <span className={`text-xs text-center ${isActive ? item.color : 'text-gray-500'}`}>
                    {item.description}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Mobile-optimized horizontal scroll menu */
export function MobileNavigationMenu({ 
  currentSection, 
  onSectionChange, 
  favoritesCount = 0,
  hasIngredients = false 
}: NavigationMenuProps) {
  return (
    <div className="w-full bg-white border-b sticky top-0 z-40 shadow-sm sm:hidden">
      <div className="px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Sparkle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">FeedMe AI</h1>
          </div>
        </div>

        {/* Horizontal scroll menu */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1">
          {menuItems.map((item) => {
            const isActive = currentSection === item.id
            const Icon = item.icon
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => onSectionChange(item.id)}
                className={`
                  flex-shrink-0 px-4 py-2 flex items-center gap-2
                  ${isActive ? `${item.bgColor} ${item.color} border-current` : ''}
                `}
              >
                <Icon size={16} />
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
                
                {/* Mobile badges */}
                {item.id === 'favorites' && favoritesCount > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {favoritesCount}
                  </Badge>
                )}
                
                {item.id === 'ideas' && hasIngredients && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                )}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}