import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Clock, ChefHat, ArrowRight, ArrowLeft, CheckCircle, Warning, Lightbulb, Image as ImageIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Ingredient } from '@/App'
import type { Recipe } from '../lib/openai-analyzer'
import { OpenAIAnalyzer } from '../lib/openai-analyzer'
import { FavoritesStorage } from '../lib/favorites-storage'

interface CookingWorkflowProps {
  ingredients: Ingredient[]
  originalImageBase64?: string
  onBackToUpload: () => void
}

type WorkflowStep = 'selection' | 'preparation' | 'cooking'

// Enhanced demo recipes with detailed instructions and tips
const DEMO_RECIPES: Recipe[] = [
  {
    id: "demo-1",
    title: "Classic Tomato Pasta",
    description: "A timeless Italian classic with fresh tomatoes, garlic, and herbs. Perfect for beginners!",
    cookingTime: "25 minutes",
    difficulty: "Easy",
    ingredients: ["400g pasta (spaghetti or penne)", "4 large ripe tomatoes", "3 garlic cloves", "60ml extra virgin olive oil", "fresh basil leaves", "50g parmesan cheese", "salt", "black pepper"],
    instructions: [
      "Bring a large pot of salted water to boil (tip: water should taste like sea water)",
      "Meanwhile, score an 'X' on tomato bottoms, blanch in boiling water for 1 minute, then transfer to ice water",
      "Peel tomatoes easily and dice them into chunks, removing seeds if desired",
      "Mince garlic finely (tip: remove green germ for milder flavor)",
      "Heat olive oil in a large pan over medium heat, add garlic and cook until fragrant (30 seconds)",
      "Add diced tomatoes, season with salt and pepper, simmer for 8-10 minutes until sauce thickens",
      "Cook pasta according to package directions until al dente (usually 1-2 minutes less than package time)",
      "Reserve 1/2 cup pasta water before draining",
      "Add drained pasta to tomato sauce, toss with a splash of pasta water if needed",
      "Remove from heat, add torn basil leaves and half the parmesan",
      "Serve immediately with remaining cheese and a drizzle of good olive oil"
    ],
    createdAt: new Date().toISOString(),
    isFavorite: false
  },
  {
    id: "demo-2", 
    title: "Colorful Vegetable Stir Fry",
    description: "Quick, healthy, and packed with nutrients. A perfect weeknight dinner that's ready in minutes!",
    cookingTime: "15 minutes",
    difficulty: "Easy",
    ingredients: ["2 bell peppers (any color)", "1 large onion", "2 medium carrots", "3 garlic cloves", "30ml soy sauce", "15ml sesame oil", "1 tsp fresh ginger", "2 cups cooked rice", "vegetable oil", "salt", "pepper"],
    instructions: [
      "Prep all vegetables first (stir-frying happens fast!) - slice peppers, onions, and carrots into similar-sized pieces",
      "Cook rice ahead of time and keep warm, or use day-old rice (it fries better)",
      "Heat 2 tbsp vegetable oil in a wok or large pan over high heat until smoking",
      "Add harder vegetables first (carrots) and stir-fry for 2 minutes",
      "Add onions and cook for 1 minute, then add peppers",
      "Push vegetables to one side, add minced garlic and ginger to empty side for 30 seconds",
      "Mix everything together, add soy sauce and sesame oil",
      "Stir-fry for another 2-3 minutes until vegetables are crisp-tender",
      "Taste and adjust seasoning with salt, pepper, or more soy sauce",
      "Serve immediately over warm rice"
    ],
    createdAt: new Date().toISOString(),
    isFavorite: false
  }
]

// Common pantry staples that most people have
const PANTRY_STAPLES = [
  "salt", "black pepper", "olive oil", "vegetable oil", "butter", 
  "garlic powder", "onion powder", "dried herbs", "flour", "sugar"
]

// Ingredient freshness tips
const FRESHNESS_TIPS: { [key: string]: string } = {
  "tomatoes": "Should be firm but yield slightly to pressure. Avoid if very soft or have dark spots.",
  "onions": "Should be firm with no soft spots or sprouting. Papery skin should be intact.",
  "garlic": "Cloves should be firm and plump. Avoid if sprouting or soft.",
  "bell peppers": "Should be firm, glossy, and have good color. Avoid if wrinkled or soft spots.",
  "carrots": "Should be firm and bright orange. Avoid if bendy or have white film.",
  "potatoes": "Should be firm with no green spots or sprouts. Store in dark, cool place.",
  "herbs": "Fresh herbs should be bright green with no wilting or dark spots."
}

export function CookingWorkflow({ ingredients, originalImageBase64, onBackToUpload }: CookingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('selection')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const analyzer = new OpenAIAnalyzer(import.meta.env.VITE_OPENAI_API_KEY)

  useEffect(() => {
    generateRecipes()
  }, [ingredients])

  const generateRecipes = async () => {
    setIsLoadingRecipes(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For now, use enhanced demo recipes
      const shuffled = [...DEMO_RECIPES].sort(() => 0.5 - Math.random())
      setRecipes(shuffled)
      
      toast.success(`🍳 Found ${shuffled.length} perfect recipes for your ingredients!`)
    } catch (error) {
      console.error('Recipe generation failed:', error)
      toast.error('Failed to generate recipes. Please try again.')
      setRecipes(DEMO_RECIPES)
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const handleRecipeSelect = async (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setCurrentStep('preparation')
    
    // Auto-generate recipe image
    setIsGeneratingImage(true)
    try {
      const imageResult = await analyzer.generateRecipeImage(recipe.title, recipe.ingredients)
      setGeneratedImage(imageResult.imageUrl)
      
      if (imageResult.error) {
        toast.warning('Using stock image - AI image generation unavailable')
      } else {
        toast.success('✨ Generated your recipe image!')
      }
    } catch (error) {
      console.error('Image generation failed:', error)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const startCooking = () => {
    setCurrentStep('cooking')
    toast.success('🍳 Let\'s start cooking! Follow along step by step.')
  }

  const saveRecipeAsFavorite = () => {
    if (!selectedRecipe) return
    
    const recipeToSave = {
      ...selectedRecipe,
      originalImageBase64,
      generatedImageUrl: generatedImage || undefined,
      createdAt: new Date().toISOString(),
      isFavorite: true
    }
    
    FavoritesStorage.saveFavorite(recipeToSave)
    toast.success('❤️ Recipe saved to your favorites!')
  }

  const checkIngredientFreshness = (ingredient: string) => {
    const normalizedIngredient = ingredient.toLowerCase()
    const tip = FRESHNESS_TIPS[normalizedIngredient] || FRESHNESS_TIPS[Object.keys(FRESHNESS_TIPS).find(key => 
      normalizedIngredient.includes(key) || key.includes(normalizedIngredient)
    ) || '']
    
    return tip || "Check that this ingredient looks fresh and hasn't expired."
  }

  const getIngredientSubstitutions = (ingredient: string): string[] => {
    const substitutions: { [key: string]: string[] } = {
      "tomatoes": ["canned diced tomatoes", "cherry tomatoes", "tomato sauce + fresh herbs"],
      "bell peppers": ["any color bell pepper", "sweet peppers", "mild chili peppers"],
      "onions": ["shallots", "green onions", "leeks"],
      "garlic": ["garlic powder (1/8 tsp per clove)", "garlic paste", "shallots"],
      "basil": ["oregano", "parsley", "dried basil (use less)"],
      "parmesan": ["any hard cheese", "nutritional yeast", "pecorino romano"]
    }
    
    const normalizedIngredient = ingredient.toLowerCase()
    return substitutions[normalizedIngredient] || substitutions[Object.keys(substitutions).find(key => 
      normalizedIngredient.includes(key) || key.includes(normalizedIngredient)
    ) || ''] || []
  }

  // Recipe Selection Step
  if (currentStep === 'selection') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Choose Your Recipe</h2>
          <p className="text-muted-foreground mb-4">
            Based on your ingredients, here are some delicious options
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
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

        {isLoadingRecipes ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-muted-foreground">Finding perfect recipes for you...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{recipe.title}</CardTitle>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {recipe.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap mt-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock size={14} />
                      {recipe.cookingTime}
                    </Badge>
                    <Badge 
                      variant={recipe.difficulty === 'Easy' ? 'default' : recipe.difficulty === 'Medium' ? 'secondary' : 'destructive'}
                    >
                      {recipe.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {recipe.instructions.length} steps
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Key ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.slice(0, 4).map((ingredient, i) => (
                        <span key={i} className="text-xs bg-muted px-2 py-1 rounded capitalize">
                          {ingredient.split(' ')[ingredient.split(' ').length - 1]}
                        </span>
                      ))}
                      {recipe.ingredients.length > 4 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{recipe.ingredients.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleRecipeSelect(recipe)}
                    className="w-full flex items-center gap-2"
                  >
                    Choose This Recipe
                    <ArrowRight size={16} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <Button 
            variant="outline" 
            onClick={onBackToUpload}
            className="flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            Upload Different Photo
          </Button>
        </div>
      </div>
    )
  }

  // Recipe Preparation Step
  if (currentStep === 'preparation' && selectedRecipe) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep('selection')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Choose Different Recipe
          </Button>
          <Button 
            variant="outline" 
            onClick={saveRecipeAsFavorite}
            className="flex items-center gap-2"
          >
            Save Recipe
          </Button>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">{selectedRecipe.title}</h2>
          <p className="text-muted-foreground text-lg mb-4">
            {selectedRecipe.description}
          </p>
          
          <div className="flex gap-3 justify-center mb-6">
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
              <Clock size={16} />
              {selectedRecipe.cookingTime}
            </Badge>
            <Badge 
              variant={selectedRecipe.difficulty === 'Easy' ? 'default' : selectedRecipe.difficulty === 'Medium' ? 'secondary' : 'destructive'}
              className="px-4 py-2"
            >
              <ChefHat size={16} className="mr-1" />
              {selectedRecipe.difficulty}
            </Badge>
          </div>
        </div>

        {/* Recipe Image */}
        <div className="text-center">
          {isGeneratingImage ? (
            <div className="bg-muted rounded-lg p-12 mb-6">
              <div className="animate-spin mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
              <p className="text-muted-foreground">Generating your recipe image...</p>
            </div>
          ) : generatedImage ? (
            <img 
              src={generatedImage} 
              alt={selectedRecipe.title}
              className="w-full max-w-md mx-auto rounded-lg shadow-lg mb-6"
            />
          ) : (
            <div className="bg-muted rounded-lg p-12 mb-6">
              <ImageIcon size={48} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Recipe image will appear here</p>
            </div>
          )}
        </div>

        {/* Ingredient Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle size={20} />
              Ingredient Preparation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                We assume you have basic pantry staples like {PANTRY_STAPLES.slice(0, 5).join(', ')}, etc. 
                Don't worry if you're missing something - we'll suggest alternatives!
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              {selectedRecipe.ingredients.map((ingredient, index) => {
                const isPantryStaple = PANTRY_STAPLES.some(staple => 
                  ingredient.toLowerCase().includes(staple.toLowerCase())
                )
                const freshnessTip = checkIngredientFreshness(ingredient)
                const substitutions = getIngredientSubstitutions(ingredient)
                
                return (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium capitalize">{ingredient}</span>
                      {isPantryStaple && (
                        <Badge variant="secondary" className="text-xs">
                          Pantry staple
                        </Badge>
                      )}
                    </div>
                    
                    {!isPantryStaple && (
                      <div className="text-sm text-muted-foreground mb-2">
                        <div className="flex items-start gap-2">
                          <Warning size={14} className="mt-0.5 text-amber-500" />
                          <span>{freshnessTip}</span>
                        </div>
                      </div>
                    )}
                    
                    {substitutions.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium">Alternatives: </span>
                        {substitutions.join(', ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={startCooking}
            size="lg"
            className="flex items-center gap-2 px-8"
          >
            Start Cooking!
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    )
  }

  // Cooking Instructions Step
  if (currentStep === 'cooking' && selectedRecipe) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep('preparation')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Preparation
          </Button>
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock size={14} />
            {selectedRecipe.cookingTime}
          </Badge>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Let's Cook!</h2>
          <p className="text-muted-foreground">
            Follow these step-by-step instructions for perfect results
          </p>
        </div>

        {generatedImage && (
          <div className="text-center mb-6">
            <img 
              src={generatedImage} 
              alt={selectedRecipe.title}
              className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Cooking Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedRecipe.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="leading-relaxed">{instruction}</p>
                    {index < selectedRecipe.instructions.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb size={20} />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Taste as you go and adjust seasoning to your preference</p>
              <p>• Don't be afraid to add a pinch more salt - it enhances all flavors</p>
              <p>• Fresh herbs are best added at the end to preserve their flavor</p>
              <p>• Let the dish rest for a few minutes before serving for best results</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="outline"
            onClick={saveRecipeAsFavorite}
            className="flex items-center gap-2 mx-auto"
          >
            Save This Recipe
          </Button>
        </div>
      </div>
    )
  }

  return null
}