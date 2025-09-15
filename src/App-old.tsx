import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, ChefHat, Heart } from '@phosphor-icons/react'
import { ImageUpload } from '@/components/ImageUpload'
import { CookingWorkflow } from '@/components/CookingWorkflow'
import { FavoritesView } from '@/components/FavoritesView'
import { ExampleImages } from '@/components/ExampleImages'
import { QuickIdeas } from '@/components/QuickIdeas'
import { ImagePerformanceDashboard } from '@/components/ImagePerformanceDashboard'
import { NavigationMenu, MobileNavigationMenu, type MenuSection } from '@/components/NavigationMenu'
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
  const [currentSection, setCurrentSection] = useState<MenuSection>('upload')
  const [showWorkflow, setShowWorkflow] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [selectedQuickRecipe, setSelectedQuickRecipe] = useState<any>(null)

  const handleIngredientsDetected = (detectedIngredients: Ingredient[], imageBase64: string) => {
    setIngredients(detectedIngredients)
    setOriginalImageBase64(imageBase64)
    setIsAnalyzing(false)
    setCurrentSection('ideas')
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
    setCurrentSection('upload')
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

  const handleFavoriteRecipeSelect = (recipe: any) => {
    // Convert favorite recipe to the expected format for the workflow
    setSelectedQuickRecipe(recipe)
    const recipeIngredients = recipe.ingredients.map((ingredient: string) => ({
      name: ingredient,
      confidence: 1.0
    }))
    setIngredients(recipeIngredients)
    setOriginalImageBase64(recipe.originalImageBase64)
    setCurrentSection('ideas')
    setShowWorkflow(true)
  }

    // Update favorites count when component mounts and when favorites might change
  useEffect(() => {
    setFavoritesCount(FavoritesStorage.getFavoritesCount())
  }, [currentSection])

  // Show the cooking workflow when ingredients are detected or quick recipe selected
  if (showWorkflow && (ingredients.length > 0 || selectedQuickRecipe)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">🍳 FeedmeAI - Cooking Guide</h1>
              <p className="text-muted-foreground">
                {selectedQuickRecipe ? `Quick Recipe: ${selectedQuickRecipe.title}` : "Let's create something delicious together!"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentSection('favorites')}
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

  // Main app with navigation
  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'upload':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Upload Your Ingredients</h2>
              <p className="text-lg text-gray-600">Take a photo of your fridge, pantry, or ingredients to get AI-powered recipe suggestions</p>
            </div>

            <ImageUpload 
              onIngredientsDetected={handleIngredientsDetected}
              onAnalyzing={handleAnalyzing}
            />

            {/* Quick Ideas for users without ingredients */}
            <div className="mt-12">
              <QuickIdeas onQuickRecipeSelect={handleQuickRecipeSelect} />
            </div>
          </div>
        )

      case 'ideas':
        return (
          <div className="space-y-8">
            {ingredients.length > 0 ? (
              <div>
                <div className="text-center space-y-4 mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Recipe Suggestions</h2>
                  <p className="text-lg text-gray-600">Based on your ingredients</p>
                </div>
                
                {/* Show ingredients detected */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera size={20} />
                      Detected Ingredients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {ingredients.map((ingredient, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {ingredient.name}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <CookingWorkflow 
                  ingredients={ingredients}
                  originalImageBase64={originalImageBase64}
                  selectedRecipe={selectedQuickRecipe}
                  onBackToUpload={handleBackToUpload}
                />
              </div>
            ) : (
              <div className="text-center space-y-4">
                <ChefHat size={64} className="mx-auto text-gray-400" />
                <h2 className="text-2xl font-bold text-gray-900">No ingredients detected yet</h2>
                <p className="text-gray-600">Upload a photo in the Upload section to get started</p>
                <Button onClick={() => setCurrentSection('upload')} className="mt-4">
                  <Camera className="mr-2" size={16} />
                  Go to Upload
                </Button>
              </div>
            )}
          </div>
        )

      case 'favorites':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">My Favorite Recipes</h2>
              <p className="text-lg text-gray-600">Your saved recipes from FeedmeAI</p>
            </div>

            <FavoritesView 
              onRecipeSelect={handleFavoriteRecipeSelect}
              onClose={() => setCurrentSection('upload')}
            />
          </div>
        )

      case 'examples':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Photo Tips & Examples</h2>
              <p className="text-lg text-gray-600">Learn how to take better photos for accurate ingredient detection</p>
            </div>

            <ExampleImages />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="hidden sm:block">
        <NavigationMenu 
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          favoritesCount={favoritesCount}
          hasIngredients={ingredients.length > 0}
        />
      </div>
      <div className="sm:hidden">
        <MobileNavigationMenu 
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          favoritesCount={favoritesCount}
          hasIngredients={ingredients.length > 0}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {renderCurrentSection()}
      </div>

      <Toaster />
      <ImagePerformanceDashboard />
    </div>
  )

  if (showFavorites) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">My Favorite Recipes</h1>
              <p className="text-muted-foreground">
                Your saved recipes from FeedmeAI
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
          
          <FavoritesView 
            onClose={() => setShowFavorites(false)} 
            onSelectRecipe={handleFavoriteRecipeSelect}
          />
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
              <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-2">🍳 FeedmeAI</h1>
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

          {/* Creator Attribution */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Built with ❤️ using AI-powered technology
              </p>
              <p className="text-sm text-muted-foreground">
                Created by{' '}
                <a 
                  href="https://victorsaly.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                >
                  Victor Saly
                </a>
              </p>
            </div>
          </div>
        </div>

        <Toaster />
        <ImagePerformanceDashboard />
      </div>
    </div>
  )
}

export default App