import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ChefHat, Users, Star, Image as ImageIcon } from '@phosphor-icons/react'
import quickRecipesData from '@/data/quick-recipes.json'

interface QuickIdeasProps {
  onSelectRecipe: (recipe: any) => void
}

interface QuickRecipe {
  id: string
  title: string
  description: string
  prepTime: string
  cookTime: string
  totalTime: string
  servings: number
  difficulty: string
  category: string
  tags: string[]
  heroImage: string
  ingredients: string[]
  instructions: string[]
  tips: string[]
  nutrition: {
    calories: number
    protein: string
    carbs: string
    fat: string
  }
}

export function QuickIdeas({ onSelectRecipe }: QuickIdeasProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTime, setSelectedTime] = useState<string>('all')
  
  const { quickRecipes, categories } = quickRecipesData
  
  // Image component with fallback
  const RecipeImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
    const [imageError, setImageError] = useState(false)
    
    if (imageError) {
      return (
        <div className={`${className} bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center`}>
          <ImageIcon size={48} className="text-orange-400" />
        </div>
      )
    }
    
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setImageError(true)}
      />
    )
  }
  
  const timeFilters = [
    { id: 'all', name: 'All Times', color: '#6b7280' },
    { id: 'under-15', name: 'Under 15 min', color: '#10b981' },
    { id: 'under-25', name: 'Under 25 min', color: '#f59e0b' },
  ]

  const filteredRecipes = quickRecipes.filter((recipe: QuickRecipe) => {
    const categoryMatch = selectedCategory === 'all' || recipe.category.toLowerCase() === selectedCategory
    
    let timeMatch = true
    if (selectedTime === 'under-15') {
      timeMatch = parseInt(recipe.totalTime) <= 15
    } else if (selectedTime === 'under-25') {
      timeMatch = parseInt(recipe.totalTime) <= 25
    }
    
    return categoryMatch && timeMatch
  })

  const handleRecipeSelect = (recipe: QuickRecipe) => {
    // Transform the recipe to match the expected Recipe interface
    const transformedRecipe = {
      title: recipe.title,
      description: recipe.description,
      cookTime: recipe.totalTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tips: recipe.tips,
      nutritionalInfo: `${recipe.nutrition.calories} calories per serving`,
      imageUrl: recipe.heroImage,
      category: recipe.category,
      prepTime: recipe.prepTime,
      tags: recipe.tags
    }
    onSelectRecipe(transformedRecipe)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <ChefHat className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-gray-900">Quick Recipe Ideas</h2>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Ready-to-cook recipes that are perfect when you need something delicious fast. 
          All recipes are designed for maximum flavor with minimal time.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Time Filters */}
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="text-sm font-medium text-gray-700 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Time:
          </span>
          {timeFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedTime === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTime(filter.id)}
              className="h-8"
            >
              {filter.name}
            </Button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="text-sm font-medium text-gray-700">Cuisine:</span>
          <Button
            variant={selectedCategory === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="h-8"
          >
            All Cuisines
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="h-8"
              style={selectedCategory === category.id ? { backgroundColor: category.color } : {}}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe: QuickRecipe) => (
          <Card key={recipe.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="relative">
              <RecipeImage
                src={recipe.heroImage}
                alt={recipe.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-800">
                  <Clock className="w-3 h-3 mr-1" />
                  {recipe.totalTime}
                </Badge>
              </div>
              <div className="absolute top-3 right-3">
                <Badge 
                  className="text-white"
                  style={{ backgroundColor: categories.find(c => c.id === recipe.category.toLowerCase())?.color || '#6b7280' }}
                >
                  {recipe.category}
                </Badge>
              </div>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg leading-tight">{recipe.title}</CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Recipe Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>{recipe.difficulty}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {recipe.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                    {tag}
                  </Badge>
                ))}
                {recipe.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{recipe.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Nutrition Info */}
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                <strong>{recipe.nutrition.calories} cal</strong> • {recipe.nutrition.protein} protein • {recipe.nutrition.carbs} carbs
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => handleRecipeSelect(recipe)}
                className="w-full mt-4"
                size="sm"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                Start Cooking
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No recipes found</h3>
          <p className="text-gray-500">Try adjusting your filters to see more options.</p>
        </div>
      )}
    </div>
  )
}