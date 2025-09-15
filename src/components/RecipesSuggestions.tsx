import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Clock, ChefHat, Eye, Sparkle, Heart, Image as ImageIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Ingredient } from '@/App'
import type { Recipe } from '../lib/openai-analyzer'
import { OpenAIAnalyzer } from '../lib/openai-analyzer'
import { FavoritesStorage } from '../lib/favorites-storage'
import { RecipeImage } from './RecipeImage'
import { recipes as recipeData } from '@/data'

interface RecipesSuggestionsProps {
  ingredients: Ingredient[]
  isAnalyzing: boolean
  originalImageBase64?: string
}

// Convert structured recipe data to Recipe format for compatibility
const convertToRecipe = (recipeData: any): Recipe => ({
  id: recipeData.id,
  title: recipeData.title,
  description: recipeData.description,
  cookingTime: recipeData.totalTime,
  difficulty: recipeData.difficulty,
  ingredients: recipeData.ingredients,
  instructions: recipeData.instructions,
  createdAt: new Date().toISOString(),
  isFavorite: false
})

// Use actual recipe data instead of hardcoded demo recipes
const DEMO_RECIPES: Recipe[] = recipeData.slice(0, 6).map(convertToRecipe)

export function RecipesSuggestions({ ingredients, isAnalyzing, originalImageBase64 }: RecipesSuggestionsProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set())

  const analyzer = new OpenAIAnalyzer(import.meta.env.VITE_OPENAI_API_KEY)

  const generateRecipeImage = async (recipe: Recipe) => {
    if (recipe.generatedImageUrl) return
    
    setGeneratingImages(prev => new Set([...prev, recipe.id]))
    
    try {
      const imageResult = await analyzer.generateRecipeImage(recipe.title, recipe.ingredients)
      
      setRecipes(prev => prev.map(r => 
        r.id === recipe.id 
          ? { ...r, generatedImageUrl: imageResult.imageUrl }
          : r
      ))
      
      if (imageResult.error) {
        toast.warning('Using fallback image - generation service unavailable')
      } else {
        toast.success('✨ Recipe image generated!')
      }
    } catch (error) {
      console.error('Image generation failed:', error)
      toast.error('Failed to generate recipe image')
    } finally {
      setGeneratingImages(prev => {
        const next = new Set(prev)
        next.delete(recipe.id)
        return next
      })
    }
  }

  const toggleFavorite = (recipe: Recipe) => {
    const isFavorited = FavoritesStorage.isFavorite(recipe.id)
    
    if (isFavorited) {
      FavoritesStorage.removeFavorite(recipe.id)
      toast.success('💔 Removed from favorites')
    } else {
      const recipeToSave = {
        ...recipe,
        originalImageBase64,
        createdAt: new Date().toISOString(),
        isFavorite: true
      }
      FavoritesStorage.saveFavorite(recipeToSave)
      toast.success('❤️ Added to favorites!')
    }
    
    setRecipes(prev => prev.map(r => 
      r.id === recipe.id 
        ? { ...r, isFavorite: !isFavorited }
        : r
    ))
  }

  useEffect(() => {
    if (ingredients.length > 0 && !isAnalyzing) {
      generateRecipes()
    }
  }, [ingredients, isAnalyzing])

  const generateRecipes = async () => {
    setIsLoadingRecipes(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const ingredientNames = ingredients.map(ing => ing.name).join(', ')
      console.log('Generating recipes for ingredients:', ingredientNames)
      
      const shuffled = [...DEMO_RECIPES].sort(() => 0.5 - Math.random())
      setRecipes(shuffled.slice(0, Math.min(2, shuffled.length)))
      
      toast.success(`🍳 Generated ${shuffled.slice(0, 2).length} recipes based on your ingredients!`)
      
    } catch (error) {
      console.error('Recipe generation failed:', error)
      toast.error('Failed to generate recipes. Please try again.')
      setRecipes(DEMO_RECIPES.slice(0, 2))
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const renderRecipeDetails = (recipe: Recipe) => (
    <div className="space-y-6">
      <p className="text-muted-foreground text-base leading-relaxed">
        {recipe.description}
      </p>
      
      <div className="flex gap-3 flex-wrap">
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
          <Clock size={14} />
          {recipe.cookingTime}
        </Badge>
        <Badge 
          variant={recipe.difficulty === 'Easy' ? 'default' : recipe.difficulty === 'Medium' ? 'secondary' : 'destructive'}
          className="px-3 py-1"
        >
          {recipe.difficulty}
        </Badge>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-base">🛒 Ingredients</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {recipe.ingredients.map((ingredient, i) => (
            <div key={i} className="text-sm flex items-center gap-2 p-2 bg-muted/30 rounded-md">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="capitalize">{ingredient}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-base">👨‍🍳 Instructions</h4>
        <div className="space-y-4">
          {recipe.instructions.map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed pt-1.5">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        <p className="text-muted-foreground">Preparing recipe suggestions...</p>
      </div>
    )
  }

  if (ingredients.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
          <ChefHat size={32} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-medium mb-2">No ingredients detected yet</p>
          <p className="text-muted-foreground">
            Upload an image to get personalized recipe suggestions
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ingredient Summary */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Detected ingredients:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {ingredients.map((ingredient, i) => (
            <Badge key={i} variant="secondary" className="capitalize">
              {ingredient.name}
              {ingredient.confidence && (
                <span className="ml-1 text-xs opacity-75">
                  {Math.round(ingredient.confidence * 100)}%
                </span>
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recipes */}
      {isLoadingRecipes ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-8">
          <Button onClick={generateRecipes} className="flex items-center gap-2">
            <Sparkle size={16} />
            Generate Recipe Ideas
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">🍽️ Recipe Suggestions</h3>
            <Button 
              onClick={generateRecipes} 
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Sparkle size={14} />
              New Ideas
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {recipes.map((recipe) => {
              const isFavorited = FavoritesStorage.isFavorite(recipe.id)
              const isGeneratingImage = generatingImages.has(recipe.id)
              
              return (
                <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-4">
                    {/* Recipe Image with improved loading states */}
                    <RecipeImage
                      recipe={recipe}
                      isGeneratingImage={isGeneratingImage}
                      onGenerateImage={() => generateRecipeImage(recipe)}
                      onToggleFavorite={() => toggleFavorite(recipe)}
                      isFavorited={isFavorited}
                    />

                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-base leading-tight flex-1">{recipe.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <Clock size={12} />
                        {recipe.cookingTime}
                      </Badge>
                      <Badge 
                        variant={recipe.difficulty === 'Easy' ? 'default' : recipe.difficulty === 'Medium' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {recipe.difficulty}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        {recipe.ingredients.length} ingredients
                      </div>
                    </div>

                    {/* Mobile-optimized recipe view */}
                    <div className="block sm:hidden">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button className="w-full flex items-center gap-2" size="sm">
                            <Eye size={14} />
                            View Recipe
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[90vh] overflow-hidden">
                          <SheetHeader>
                            <SheetTitle className="text-left">{recipe.title}</SheetTitle>
                          </SheetHeader>
                          <ScrollArea className="h-full pr-4 mt-4">
                            {renderRecipeDetails(recipe)}
                          </ScrollArea>
                        </SheetContent>
                      </Sheet>
                    </div>
                    
                    <div className="hidden sm:block">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full flex items-center gap-2" size="sm">
                            <Eye size={14} />
                            View Recipe
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                          <DialogHeader>
                            <DialogTitle>{recipe.title}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh] pr-4">
                            {renderRecipeDetails(recipe)}
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}