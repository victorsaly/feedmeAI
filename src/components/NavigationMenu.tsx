import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { 
  Camera, 
  Heart, 
  Lightbulb, 
  Image as ImageIcon,
  ChefHat,
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
    color: 'text-green-800',
    bgColor: 'bg-green-600',
    borderColor: 'border-green-500'
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
    <div className="w-full bg-primary border-b border-green-700/20 sticky top-0 z-40 shadow-lg">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Logo */}
        <div className="flex items-center justify-between py-4 border-b border-green-400/20">
          <div className="flex items-center gap-3">
            <Logo size={40} className="drop-shadow-lg" />
            <div>
              <h1 className="text-xl font-bold text-white">FeedMe AI</h1>
              <p className="text-sm text-green-100">Smart Recipe Generator</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          {(favoritesCount > 0 || hasIngredients) && (
            <div className="flex items-center gap-2">
              {hasIngredients && (
                <Badge variant="secondary" className="text-xs bg-green-200 text-green-800 border-green-300">
                  <Camera className="w-3 h-3 mr-1" />
                  Ingredients Ready
                </Badge>
              )}
              {favoritesCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-200 text-amber-800 border-amber-300">
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
                      ? 'bg-white text-green-700 border border-green-200 shadow-sm' 
                      : 'text-green-50 hover:bg-green-400/20 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon 
                      size={20} 
                      className={isActive ? item.color : 'text-white'} 
                    />
                    <span className={`font-medium text-sm ${isActive ? item.color : 'text-white'}`}>
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
                  
                  <span className={`text-xs text-center ${isActive ? item.color : 'text-green-100'}`}>
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
    <div className="w-full bg-primary border-b border-green-700/20 sticky top-0 z-40 shadow-lg sm:hidden">
      <div className="px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-3">
          <Logo size={32} className="drop-shadow-lg" />
          <div>
            <h1 className="text-lg font-bold text-white">FeedMe AI</h1>
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
                  ${isActive 
                    ? 'bg-white text-green-700 border-green-200' 
                    : 'text-green-50 border-green-400/30 hover:bg-green-400/20 hover:border-green-200 hover:text-white'
                  }
                `}
              >
                <Icon size={16} />
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
                
                {/* Mobile badges */}
                {item.id === 'favorites' && favoritesCount > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1 bg-amber-200 text-amber-800">
                    {favoritesCount}
                  </Badge>
                )}
                
                {item.id === 'ideas' && hasIngredients && (
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                )}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}