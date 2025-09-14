import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, ChefHat, ShoppingCart, Eye } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Ingredient, Recipe } from '@/App'

interface RecipesSuggestionsProps {
  availableIngredients: Ingredient[]
  allIngredients: Ingredient[]
}

export function RecipesSuggestions({ availableIngredients, allIngredients }: RecipesSuggestionsProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    if (availableIngredients.length > 0) {
      generateRecipes()
    }
  }, [availableIngredients])

  const generateRecipes = async () => {
    setIsLoading(true)
    
    try {
      const ingredientNames = availableIngredients.map(ing => ing.name).join(', ')
      
      const promptText = `Based on these available ingredients: ${ingredientNames}
      
      Generate 4-6 recipe suggestions that can be made with these ingredients. For each recipe, identify which ingredients are available and which are missing (if any).
      
      Return a JSON object with a "recipes" property containing an array of recipe objects with:
      - id: unique identifier
      - name: recipe name
      - description: brief description (1-2 sentences)
      - cookTime: cooking time estimate
      - difficulty: "Easy", "Medium", or "Hard"
      - availableIngredients: array of ingredient names that are available
      - missingIngredients: array of ingredient names that are missing but needed
      - instructions: array of cooking steps (3-6 steps)
      - canMake: boolean (true if 80%+ of ingredients are available)
      
      Prioritize recipes that use more of the available ingredients. Include some recipes that can be made entirely with available ingredients, and some that need just 1-2 additional ingredients.
      
      Example format:
      {
        "recipes": [
          {
            "id": "1",
            "name": "Simple Tomato Pasta",
            "description": "A quick and delicious pasta with fresh tomatoes and herbs.",
            "cookTime": "20 minutes",
            "difficulty": "Easy",
            "availableIngredients": ["tomato", "onion", "garlic"],
            "missingIngredients": ["pasta", "olive oil"],
            "instructions": ["Boil pasta", "Sauté onion and garlic", "Add tomatoes", "Combine with pasta"],
            "canMake": false
          }
        ]
      }`

      const response = await window.spark.llm(promptText, 'gpt-4o', true)
      const result = JSON.parse(response)
      
      if (result.recipes && Array.isArray(result.recipes)) {
        setRecipes(result.recipes)
        toast.success(`Found ${result.recipes.length} recipe suggestions!`)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Recipe generation failed:', error)
      toast.error('Failed to generate recipes. Please try again.')
      setRecipes([])
    } finally {
      setIsLoading(false)
    }
  }

  const getMissingIngredientsShoppingUrl = (ingredients: string[]) => {
    const query = ingredients.join(' ')
    return `https://www.google.com/search?q=${encodeURIComponent(query + ' grocery delivery')}`
  }

  if (availableIngredients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat size={24} className="text-primary" />
            Recipe Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Add some ingredients to see recipe suggestions!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ChefHat size={24} className="text-primary" />
            Recipe Suggestions
          </CardTitle>
          <Button 
            onClick={generateRecipes} 
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChefHat size={16} />
            Refresh Recipes
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-3" />
                  <div className="flex gap-2 mb-3">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </Card>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No recipes generated yet.
              </p>
              <Button onClick={generateRecipes} className="flex items-center gap-2">
                <ChefHat size={16} />
                Generate Recipes
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className={`p-4 transition-colors ${
                  recipe.canMake ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'
                }`}>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{recipe.name}</h3>
                      <p className="text-sm text-muted-foreground">{recipe.description}</p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock size={12} />
                        {recipe.cookTime}
                      </Badge>
                      <Badge 
                        variant={recipe.difficulty === 'Easy' ? 'default' : recipe.difficulty === 'Medium' ? 'secondary' : 'destructive'}
                      >
                        {recipe.difficulty}
                      </Badge>
                      {recipe.canMake && (
                        <Badge className="bg-green-600 text-white">Can Make!</Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Available: {recipe.availableIngredients.length} ingredients</p>
                      {recipe.missingIngredients.length > 0 && (
                        <p className="text-sm text-orange-600">Missing: {recipe.missingIngredients.length} ingredients</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 flex items-center gap-2">
                            <Eye size={16} />
                            View Recipe
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                          <DialogHeader>
                            <DialogTitle>{recipe.name}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh] pr-4">
                            <div className="space-y-4">
                              <p className="text-muted-foreground">{recipe.description}</p>
                              
                              <div className="flex gap-4">
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {recipe.cookTime}
                                </Badge>
                                <Badge variant="secondary">{recipe.difficulty}</Badge>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-green-600 mb-2">Available Ingredients</h4>
                                  <div className="space-y-1">
                                    {recipe.availableIngredients.map((ing, i) => (
                                      <div key={i} className="text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span className="capitalize">{ing}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {recipe.missingIngredients.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-orange-600 mb-2">Missing Ingredients</h4>
                                    <div className="space-y-1">
                                      {recipe.missingIngredients.map((ing, i) => (
                                        <div key={i} className="text-sm flex items-center gap-2">
                                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                          <span className="capitalize">{ing}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Instructions</h4>
                                <div className="space-y-2">
                                  {recipe.instructions.map((step, i) => (
                                    <div key={i} className="flex gap-3">
                                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                        {i + 1}
                                      </span>
                                      <p className="text-sm">{step}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      {recipe.missingIngredients.length > 0 && (
                        <Button 
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => window.open(getMissingIngredientsShoppingUrl(recipe.missingIngredients), '_blank')}
                        >
                          <ShoppingCart size={16} />
                          Shop
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}