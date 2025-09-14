import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, ChefHat } from '@phosphor-icons/react'
import { ImageUpload } from '@/components/ImageUpload'
import { RecipesSuggestions } from '@/components/RecipesSuggestions'
import { Toaster } from '@/components/ui/sonner'

export interface Ingredient {
  name: string
  confidence?: number
}

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleIngredientsDetected = (detectedIngredients: Ingredient[]) => {
    setIngredients(detectedIngredients)
    setIsAnalyzing(false)
  }

  const handleAnalyzing = (analyzing: boolean) => {
    setIsAnalyzing(analyzing)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-2">🍳 Feed me</h1>
          <p className="text-muted-foreground text-lg">
            Upload a photo of your ingredients and discover delicious recipes
          </p>
        </header>

        <div className="space-y-8">
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
              />
            </CardContent>
          </Card>

          {/* Recipe Suggestions Section */}
          {(ingredients.length > 0 || isAnalyzing) && (
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ChefHat size={24} className="text-primary" />
                  Recipe Suggestions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isAnalyzing 
                    ? "Analyzing your ingredients..." 
                    : `Found ${ingredients.length} ingredients - here's what you can make`
                  }
                </p>
              </CardHeader>
              <CardContent>
                <RecipesSuggestions 
                  ingredients={ingredients}
                  isAnalyzing={isAnalyzing}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <Toaster />
      </div>
    </div>
  )
}

export default App