import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowsLeftRight, 
  Plus, 
  CheckCircle,
  Info,
  Lightning,
  ShoppingCart
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Ingredient } from '@/App'

interface Substitution {
  id: string
  originalIngredient: string
  substitute: string
  ratio: string
  description: string
  category: 'exact' | 'similar' | 'alternative'
  commonUse: string
  difficulty: 'easy' | 'medium' | 'advanced'
}

interface IngredientSubstitutionsProps {
  ingredients: Ingredient[]
  onIngredientsUpdate: (ingredients: Ingredient[]) => void
}

export function IngredientSubstitutions({ ingredients, onIngredientsUpdate }: IngredientSubstitutionsProps) {
  const [substitutions, setSubstitutions] = useState<Substitution[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const unavailableIngredients = ingredients.filter(ing => !ing.available)

  // Generate substitution suggestions using AI
  const generateSubstitutions = async () => {
    if (unavailableIngredients.length === 0) return
    
    setIsGenerating(true)
    
    try {
      const ingredientNames = unavailableIngredients.map(ing => ing.name).join(', ')
      const prompt = (window as any).spark.llmPrompt`You are a culinary expert. Generate practical ingredient substitutions for these unavailable ingredients: ${ingredientNames}. 

For each ingredient, suggest 2-3 substitutes that would be commonly available in UK supermarkets. 

Return a JSON object with a "substitutions" array containing objects with:
- originalIngredient: the original ingredient name
- substitute: the substitute ingredient name  
- ratio: substitution ratio (e.g., "1:1", "2 tbsp per 1 egg")
- description: brief explanation of taste/texture difference
- category: "exact" (very similar), "similar" (close match), or "alternative" (different but works)
- commonUse: what dishes this substitution works best in
- difficulty: "easy", "medium", or "advanced" based on how the substitution affects cooking

Focus on realistic UK ingredients like: dairy alternatives, common spices, pantry staples, and fresh produce typically found in Tesco, Sainsbury's, ASDA.`

      const response = await (window as any).spark.llm(prompt, 'gpt-4o', true)
      const data = JSON.parse(response)
      
      const formattedSubstitutions: Substitution[] = data.substitutions.map((sub: any, index: number) => ({
        id: `sub-${Date.now()}-${index}`,
        ...sub
      }))
      
      setSubstitutions(formattedSubstitutions)
      toast.success(`Found ${formattedSubstitutions.length} substitution suggestions`)
      
    } catch (error) {
      console.error('Error generating substitutions:', error)
      toast.error('Failed to generate substitution suggestions')
    } finally {
      setIsGenerating(false)
    }
  }

  // Add substitute as an available ingredient
  const addSubstitute = (substitution: Substitution) => {
    const newIngredient: Ingredient = {
      id: `substitute-${Date.now()}`,
      name: substitution.substitute.toLowerCase().trim(),
      available: true,
      confidence: 0.9
    }

    // Check if substitute already exists
    const existingIngredient = ingredients.find(
      ing => ing.name.toLowerCase() === substitution.substitute.toLowerCase()
    )

    if (existingIngredient) {
      // Mark existing ingredient as available
      onIngredientsUpdate(
        ingredients.map(ing =>
          ing.id === existingIngredient.id ? { ...ing, available: true } : ing
        )
      )
      toast.success(`Marked ${substitution.substitute} as available`)
    } else {
      // Add new ingredient
      onIngredientsUpdate([...ingredients, newIngredient])
      toast.success(`Added ${substitution.substitute} as substitute`)
    }
  }

  useEffect(() => {
    if (unavailableIngredients.length > 0 && substitutions.length === 0) {
      generateSubstitutions()
    }
  }, [unavailableIngredients.length])

  if (unavailableIngredients.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="text-center py-8">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <p className="font-medium text-foreground mb-1">All ingredients available!</p>
          <p className="text-sm text-muted-foreground">
            Great! You have everything you need for cooking.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-sm border-orange-200/50">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ArrowsLeftRight size={20} className="text-accent" />
            Ingredient Substitutions
            <Badge variant="secondary" className="text-xs">
              {unavailableIngredients.length} missing
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Smart alternatives for ingredients you don't have, using UK supermarket staples
          </p>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">
                Generating substitution suggestions...
              </p>
            </div>
          ) : substitutions.length === 0 ? (
            <div className="text-center py-6">
              <Button 
                onClick={generateSubstitutions}
                className="flex items-center gap-2"
                disabled={isGenerating}
              >
                <Lightning size={16} />
                Get Substitution Ideas
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group substitutions by original ingredient */}
              {unavailableIngredients.map((ingredient) => {
                const ingredientSubstitutions = substitutions.filter(
                  sub => sub.originalIngredient.toLowerCase() === ingredient.name.toLowerCase()
                )
                
                if (ingredientSubstitutions.length === 0) return null
                
                return (
                  <div key={ingredient.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        Missing
                      </Badge>
                      <span className="font-medium capitalize text-sm sm:text-base">
                        {ingredient.name}
                      </span>
                    </div>
                    
                    <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                      {ingredientSubstitutions.map((substitution) => (
                        <Card 
                          key={substitution.id}
                          className="border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-transparent"
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm sm:text-base capitalize">
                                    {substitution.substitute}
                                  </span>
                                  <Badge 
                                    variant={
                                      substitution.category === 'exact' ? 'default' :
                                      substitution.category === 'similar' ? 'secondary' : 'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {substitution.category === 'exact' ? '✓ Exact' :
                                     substitution.category === 'similar' ? '≈ Similar' : '~ Alternative'}
                                  </Badge>
                                </div>
                                
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p><strong>Ratio:</strong> {substitution.ratio}</p>
                                  <p>{substitution.description}</p>
                                  <p><strong>Best for:</strong> {substitution.commonUse}</p>
                                </div>
                              </div>
                              
                              <Button
                                size="sm"
                                onClick={() => addSubstitute(substitution)}
                                className="h-8 px-3 text-xs shrink-0"
                              >
                                <Plus size={12} className="mr-1" />
                                Add
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  substitution.difficulty === 'easy' ? 'text-green-600 border-green-200' :
                                  substitution.difficulty === 'medium' ? 'text-yellow-600 border-yellow-200' :
                                  'text-red-600 border-red-200'
                                }`}
                              >
                                {substitution.difficulty} swap
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                  </div>
                )
              })}
              
              <Card className="bg-blue-50/50 border-blue-200/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex gap-3">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Pro Tips:</p>
                      <ul className="text-blue-800 space-y-1 text-xs">
                        <li>• Start with "exact" matches for best results</li>
                        <li>• Check ratios carefully - some substitutes are concentrated</li>
                        <li>• Taste as you go when using alternatives</li>
                        <li>• Consider texture changes in baking</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-center pt-2">
                <Button 
                  variant="outline" 
                  onClick={generateSubstitutions}
                  disabled={isGenerating}
                  className="text-xs"
                >
                  <Lightning size={14} className="mr-2" />
                  Get More Ideas
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}