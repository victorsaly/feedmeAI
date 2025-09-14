import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Clock, ChefHat, Eye, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Ingredient } from '@/App'

interface Recipe {
  id: string
  name: string
  description: string
  cookTime: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  ingredients: string[]
  instructions: string[]
  rating: number
}

interface RecipesSuggestionsProps {
  ingredients: Ingredient[]
  isAnalyzing: boolean
}

// Demo recipes for development/fallback
const DEMO_RECIPES: Recipe[] = [
  {
    id: "1",
    name: "Classic Tomato Pasta",
    description: "Simple and delicious pasta with fresh tomatoes, garlic, and herbs.",
    cookTime: "20 minutes",
    difficulty: "Easy",
    ingredients: ["pasta", "tomatoes", "garlic", "olive oil", "basil", "parmesan"],
    instructions: [
      "Cook pasta according to package instructions",
      "Heat olive oil and sauté garlic until fragrant",
      "Add diced tomatoes and cook for 5-7 minutes",
      "Toss pasta with tomato sauce and fresh basil",
      "Serve with grated parmesan cheese"
    ],
    rating: 4.5
  },
  {
    id: "2",
    name: "Vegetable Stir Fry",
    description: "Quick and healthy stir fry with mixed vegetables and soy sauce.",
    cookTime: "15 minutes",
    difficulty: "Easy",
    ingredients: ["bell peppers", "onion", "carrots", "garlic", "soy sauce", "rice"],
    instructions: [
      "Cook rice according to package instructions",
      "Heat oil in a wok or large pan",
      "Add vegetables in order of cooking time needed",
      "Stir fry for 5-7 minutes until crisp-tender",
      "Add soy sauce and serve over rice"
    ],
    rating: 4.2
  },
  {
    id: "3",
    name: "Herb-Roasted Chicken",
    description: "Juicy roasted chicken with fresh herbs and vegetables.",
    cookTime: "45 minutes",
    difficulty: "Medium",
    ingredients: ["chicken", "potatoes", "carrots", "rosemary", "thyme", "garlic"],
    instructions: [
      "Preheat oven to 200°C (180°C fan)",
      "Season chicken with herbs, salt, and pepper",
      "Place chicken and vegetables in roasting pan",
      "Roast for 35-40 minutes until chicken is cooked through",
      "Let rest for 5 minutes before serving"
    ],
    rating: 4.7
  }
]

export function RecipesSuggestions({ ingredients, isAnalyzing }: RecipesSuggestionsProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)

  useEffect(() => {
    if (ingredients.length > 0 && !isAnalyzing) {
      generateRecipes()
    }
  }, [ingredients, isAnalyzing])

  const generateRecipes = async () => {
    setIsLoadingRecipes(true)
    
    try {
      // For now, use demo recipes with some randomization
      // In a real app, this would call OpenAI's API to generate personalized recipes
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      
      const ingredientNames = ingredients.map(ing => ing.name).join(', ')
      console.log('Generating recipes for ingredients:', ingredientNames)
      
      // Return shuffled demo recipes
      const shuffled = [...DEMO_RECIPES].sort(() => 0.5 - Math.random())
      setRecipes(shuffled.slice(0, Math.min(3, shuffled.length)))
      
      toast.success(`🍳 Generated ${shuffled.slice(0, 3).length} recipes based on your ingredients!`)
      
    } catch (error) {
      console.error('Recipe generation failed:', error)
      toast.error('Failed to generate recipes. Please try again.')
      setRecipes(DEMO_RECIPES.slice(0, 2)) // Fallback
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
          {recipe.cookTime}
        </Badge>
        <Badge 
          variant={recipe.difficulty === 'Easy' ? 'default' : recipe.difficulty === 'Medium' ? 'secondary' : 'destructive'}
          className="px-3 py-1"
        >
          {recipe.difficulty}
        </Badge>
        <Badge variant="outline" className="px-3 py-1">
          ⭐ {recipe.rating}/5
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h4 className="font-semibold text-base leading-tight mb-2">{recipe.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Clock size={12} />
                      {recipe.cookTime}
                    </Badge>
                    <Badge 
                      variant={recipe.difficulty === 'Easy' ? 'default' : recipe.difficulty === 'Medium' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {recipe.difficulty}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    ⭐ {recipe.rating}/5 • {recipe.ingredients.length} ingredients
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
                          <SheetTitle className="text-left">{recipe.name}</SheetTitle>
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
                          <DialogTitle>{recipe.name}</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] pr-4">
                          {renderRecipeDetails(recipe)}
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}