import React from 'react'
import { Heart, Clock, ChefHat, Calendar, Trash } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer'
import { FavoritesStorage } from '../lib/favorites-storage'
import type { Recipe } from '../lib/openai-analyzer'
import { useIsMobile } from '../hooks/use-mobile'

interface FavoritesViewProps {
  onClose?: () => void
}

export function FavoritesView({ onClose }: FavoritesViewProps) {
  const [favorites, setFavorites] = React.useState<Recipe[]>([])
  const isMobile = useIsMobile()

  React.useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = () => {
    const stored = FavoritesStorage.getFavoritesByDate()
    setFavorites(stored)
  }

  const handleRemoveFavorite = (recipeId: string) => {
    FavoritesStorage.removeFavorite(recipeId)
    loadFavorites()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
    const RecipeDialog = ({ children }: { children: React.ReactNode }) => {
      if (isMobile) {
        return (
          <Drawer>
            <DrawerTrigger asChild>
              {children}
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh] overflow-y-auto">
              <DrawerHeader>
                <DrawerTitle className="text-left">{recipe.title}</DrawerTitle>
                <DrawerDescription className="text-left">
                  {recipe.description}
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                <RecipeDetails recipe={recipe} />
              </div>
            </DrawerContent>
          </Drawer>
        )
      }

      return (
        <Dialog>
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{recipe.title}</DialogTitle>
              <DialogDescription>
                {recipe.description}
              </DialogDescription>
            </DialogHeader>
            <RecipeDetails recipe={recipe} />
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <RecipeDialog>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">{recipe.title}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">
                  {recipe.description}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 ml-2 text-red-500 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveFavorite(recipe.id)
                }}
              >
                <Trash size={16} />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock size={14} />
                <span>{recipe.cookingTime}</span>
              </div>
              <Badge 
                variant="secondary" 
                className={getDifficultyColor(recipe.difficulty)}
              >
                {recipe.difficulty}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                <Calendar size={14} />
                <span>{formatDate(recipe.createdAt)}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {recipe.generatedImageUrl && (
              <img
                src={recipe.generatedImageUrl}
                alt={recipe.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="fill-red-500 text-red-500" size={14} />
              <span>Saved Recipe</span>
            </div>
          </CardContent>
        </RecipeDialog>
      </Card>
    )
  }

  const RecipeDetails = ({ recipe }: { recipe: Recipe }) => (
    <div className="space-y-4">
      {recipe.generatedImageUrl && (
        <img
          src={recipe.generatedImageUrl}
          alt={recipe.title}
          className="w-full h-64 object-cover rounded-lg"
        />
      )}
      
      {recipe.originalImageBase64 && (
        <div>
          <h4 className="font-medium mb-2">Original Ingredients Photo</h4>
          <img
            src={recipe.originalImageBase64}
            alt="Original ingredients"
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <span className="text-sm">{recipe.cookingTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <ChefHat size={16} className="text-muted-foreground" />
          <Badge className={getDifficultyColor(recipe.difficulty)}>
            {recipe.difficulty}
          </Badge>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Ingredients</h4>
        <ul className="text-sm space-y-1">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              {ingredient}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-medium mb-2">Instructions</h4>
        <ol className="text-sm space-y-2">
          {recipe.instructions.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="text-xs text-muted-foreground pt-2 border-t">
        Saved on {formatDate(recipe.createdAt)}
      </div>
    </div>
  )

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
        <p className="text-muted-foreground">
          Save recipes you love to see them here!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Favorite Recipes</h2>
        <Badge variant="secondary">
          {favorites.length} saved
        </Badge>
      </div>
      
      <div className="grid gap-4">
        {favorites.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  )
}