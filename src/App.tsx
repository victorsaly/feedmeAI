import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, ChefHat, Heart } from '@phosphor-icons/react'
import { ImageUpload } from '@/components/ImageUpload'
import { CookingWorkflow } from '@/components/CookingWorkflow'
import { FavoritesView } from '@/components/FavoritesView'
import { ExampleImages } from '@/components/ExampleImages'
import { QuickIdeas } from '@/components/QuickIdeas'
import { Toaster } from '@/components/ui/sonner'
import { FavoritesStorage } from '@/lib/favorites-storage'

export interface Ingredient {
  name: string
  confidence?: number
}

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [originalImageBase64, setOriginalImageBase64] = useState<string>()
  const [showFavorites, setShowFavorites] = useState(false)
  const [showWorkflow, setShowWorkflow] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [selectedQuickRecipe, setSelectedQuickRecipe] = useState<any>(null)

  const handleIngredientsDetected = (detectedIngredients: Ingredient[], imageBase64: string) => {
    setIngredients(detectedIngredients)
    setOriginalImageBase64(imageBase64)
    setIsAnalyzing(false)
    setShowWorkflow(true)
  }

  const handleAnalyzing = (analyzing: boolean) => {
    setIsAnalyzing(analyzing)
  }

  const handleBackToUpload = () => {
    setShowWorkflow(false)
    setIngredients([])
    setOriginalImageBase64(undefined)
    setSelectedQuickRecipe(null)
  }

  const handleQuickRecipeSelect = (recipe: any) => {
    setSelectedQuickRecipe(recipe)
    // Set ingredients based on the recipe for the workflow
    const recipeIngredients = recipe.ingredients.map((ingredient: string) => ({
      name: ingredient,
      confidence: 1.0
    }))
    setIngredients(recipeIngredients)
    setShowWorkflow(true)
  }

  // Update favorites count when component mounts and when favorites might change
  useEffect(() => {
    setFavoritesCount(FavoritesStorage.getFavoritesCount())
  }, [showFavorites])

  // Show the cooking workflow when ingredients are detected or quick recipe selected
  if (showWorkflow && (ingredients.length > 0 || selectedQuickRecipe)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">🍳 Feed me - Cooking Guide</h1>
              <p className="text-muted-foreground">
                {selectedQuickRecipe ? `Quick Recipe: ${selectedQuickRecipe.title}` : "Let's create something delicious together!"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFavorites(true)}
              className="flex items-center gap-2"
            >
              <Heart size={16} />
              Favorites
              {favoritesCount > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                  {favoritesCount}
                </span>
              )}
            </Button>
          </header>
          
          <CookingWorkflow 
            ingredients={ingredients}
            originalImageBase64={originalImageBase64}
            selectedRecipe={selectedQuickRecipe}
            onBackToUpload={handleBackToUpload}
          />
          <Toaster />
        </div>
      </div>
    )
  }

  if (showFavorites) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">My Favorite Recipes</h1>
              <p className="text-muted-foreground">
                Your saved recipes from Feed me
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFavorites(false)}
              className="flex items-center gap-2"
            >
              <Camera size={16} />
              New Recipes
            </Button>
          </header>
          
          <FavoritesView onClose={() => setShowFavorites(false)} />
          <Toaster />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div /> {/* Spacer */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-2">🍳 Feed me</h1>
              <p className="text-muted-foreground text-lg">
                Upload a photo of your ingredients and discover delicious recipes
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFavorites(true)}
              className="flex items-center gap-2"
            >
              <Heart size={16} />
              Favorites
              {favoritesCount > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                  {favoritesCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        <div className="space-y-12">
          {/* Example Images Section */}
          <ExampleImages />
          
          {/* Image Upload Section */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Camera size={24} className="text-primary" />
                Upload Your Ingredients
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Take a photo and let AI identify what you can cook with
              </p>
            </CardHeader>
            <CardContent>
              <ImageUpload 
                onIngredientsDetected={handleIngredientsDetected}
                onAnalyzing={handleAnalyzing}
              />
              
              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <p className="text-muted-foreground">Analyzing your ingredients...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground font-medium">OR</span>
            </div>
          </div>

          {/* Quick Recipe Ideas Section */}
          <QuickIdeas onSelectRecipe={handleQuickRecipeSelect} />
        </div>

        <Toaster />
      </div>
    </div>
  )
}

export default App