import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, ChefHat, List, MapPin } from '@phosphor-icons/react'
import { ImageUpload } from '@/components/ImageUpload'
import { IngredientsList } from '@/components/IngredientsList'
import { RecipesSuggestions } from '@/components/RecipesSuggestions'
import { PostcodeSetup } from '@/components/PostcodeSetup'
import { Toaster } from '@/components/ui/sonner'
import { type DeliveryArea } from '@/lib/postcode'

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
  const [userPostcode] = useKV<string>('user-postcode', '')
  const [activeTab, setActiveTab] = useState('upload')
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([])

  const handleIngredientsDetected = (detectedIngredients: Ingredient[]) => {
    setIngredients(detectedIngredients)
    setActiveTab('ingredients')
  }

  const handleIngredientsUpdate = (updatedIngredients: Ingredient[]) => {
    setIngredients(updatedIngredients)
  }

  const handleLocationSet = (postcode: string, areas: DeliveryArea[]) => {
    setDeliveryAreas(areas)
  }

  const availableIngredients = (ingredients || []).filter(ing => ing.available)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first container with better spacing */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Smart Kitchen Assistant</h1>
          <p className="text-muted-foreground text-base sm:text-lg px-4">
            Upload a photo of your ingredients and discover what you can cook with UK supermarket integration
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile-optimized tabs */}
          <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-12">
            <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Camera size={16} className="sm:size-18" />
              <span className="hidden xs:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <List size={16} className="sm:size-18" />
              <span className="hidden xs:inline">Items</span>
              <span className="ml-1">({(ingredients || []).length})</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <MapPin size={16} className="sm:size-18" />
              <span className="hidden xs:inline">Location</span>
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <ChefHat size={16} className="sm:size-18" />
              <span className="hidden xs:inline">Recipes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 sm:space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Camera size={20} className="text-primary sm:size-24" />
                  Analyse Your Kitchen
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Take a photo of your ingredients and let AI identify what you have
                </p>
              </CardHeader>
              <CardContent>
                <ImageUpload onIngredientsDetected={handleIngredientsDetected} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-4 sm:space-y-6">
            <IngredientsList 
              ingredients={ingredients || []} 
              onIngredientsUpdate={handleIngredientsUpdate}
            />
          </TabsContent>

          <TabsContent value="location" className="space-y-4 sm:space-y-6">
            <PostcodeSetup onLocationSet={handleLocationSet} />
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4 sm:space-y-6">
            <RecipesSuggestions 
              availableIngredients={availableIngredients}
              allIngredients={ingredients || []}
              userPostcode={userPostcode}
              deliveryAreas={deliveryAreas}
            />
          </TabsContent>
        </Tabs>

        <Toaster />
      </div>
    </div>
  )
}

export default App