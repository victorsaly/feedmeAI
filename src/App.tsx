import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, ChefHat, List } from '@phosphor-icons/react'
import { ImageUpload } from '@/components/ImageUpload'
import { IngredientsList } from '@/components/IngredientsList'
import { RecipesSuggestions } from '@/components/RecipesSuggestions'
import { Toaster } from '@/components/ui/sonner'

export interface Ingredient {
  id: string
  name: string
  quantity?: string
  available: boolean
  confidence?: number
}

export interface Recipe {
  id: string
  name: string
  description: string
  cookTime: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  availableIngredients: string[]
  missingIngredients: string[]
  instructions: string[]
  canMake: boolean
}

function App() {
  const [ingredients, setIngredients] = useKV<Ingredient[]>('kitchen-ingredients', [])
  const [activeTab, setActiveTab] = useState('upload')

  const handleIngredientsDetected = (detectedIngredients: Ingredient[]) => {
    setIngredients(detectedIngredients)
    setActiveTab('ingredients')
  }

  const handleIngredientsUpdate = (updatedIngredients: Ingredient[]) => {
    setIngredients(updatedIngredients)
  }

  const availableIngredients = (ingredients || []).filter(ing => ing.available)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Smart Kitchen Assistant</h1>
          <p className="text-muted-foreground text-lg">Upload a photo of your ingredients and discover what you can cook</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Camera size={18} />
              Upload
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="flex items-center gap-2">
              <List size={18} />
              Ingredients ({(ingredients || []).length})
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <ChefHat size={18} />
              Recipes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera size={24} className="text-primary" />
                  Analyze Your Kitchen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload onIngredientsDetected={handleIngredientsDetected} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-6">
            <IngredientsList 
              ingredients={ingredients || []} 
              onIngredientsUpdate={handleIngredientsUpdate}
            />
          </TabsContent>

          <TabsContent value="recipes" className="space-y-6">
            <RecipesSuggestions 
              availableIngredients={availableIngredients}
              allIngredients={ingredients || []}
            />
          </TabsContent>
        </Tabs>

        <Toaster />
      </div>
    </div>
  )
}

export default App