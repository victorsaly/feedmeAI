import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash, Check, X, PencilSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Ingredient } from '@/App'

interface IngredientsListProps {
  ingredients: Ingredient[]
  onIngredientsUpdate: (ingredients: Ingredient[]) => void
}

export function IngredientsList({ ingredients, onIngredientsUpdate }: IngredientsListProps) {
  const [newIngredientName, setNewIngredientName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const addIngredient = () => {
    if (!newIngredientName.trim()) return
    
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: newIngredientName.toLowerCase().trim(),
      available: true,
      confidence: 1
    }
    
    onIngredientsUpdate([...ingredients, newIngredient])
    setNewIngredientName('')
    toast.success(`Added ${newIngredient.name}`)
  }

  const removeIngredient = (id: string) => {
    const ingredient = ingredients.find(ing => ing.id === id)
    onIngredientsUpdate(ingredients.filter(ing => ing.id !== id))
    if (ingredient) {
      toast.success(`Removed ${ingredient.name}`)
    }
  }

  const toggleAvailability = (id: string) => {
    onIngredientsUpdate(
      ingredients.map(ing => 
        ing.id === id ? { ...ing, available: !ing.available } : ing
      )
    )
  }

  const startEditing = (ingredient: Ingredient) => {
    setEditingId(ingredient.id)
    setEditingName(ingredient.name)
  }

  const saveEdit = (id: string) => {
    if (!editingName.trim()) return
    
    onIngredientsUpdate(
      ingredients.map(ing =>
        ing.id === id ? { ...ing, name: editingName.toLowerCase().trim() } : ing
      )
    )
    setEditingId(null)
    setEditingName('')
    toast.success('Ingredient updated')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const availableCount = ingredients.filter(ing => ing.available).length

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <span>Your Ingredients</span>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {availableCount} available
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your ingredients and mark what's currently available
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile-optimized add ingredient section */}
          <div className="space-y-2">
            <Input
              placeholder="Add ingredient (e.g., tomato, onion)"
              value={newIngredientName}
              onChange={(e) => setNewIngredientName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              className="w-full h-12 text-base"
            />
            <Button 
              onClick={addIngredient} 
              disabled={!newIngredientName.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-12"
            >
              <Plus size={16} />
              Add Ingredient
            </Button>
          </div>

          {/* Ingredients list */}
          {ingredients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                  <Plus size={20} className="text-muted-foreground" />
                </div>
              </div>
              <p className="font-medium mb-1">No ingredients yet</p>
              <p className="text-sm">Upload a photo or add ingredients manually</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ingredients.map((ingredient) => (
                <Card 
                  key={ingredient.id} 
                  className={`transition-all duration-200 ${
                    ingredient.available 
                      ? 'bg-card border-green-200/50 shadow-sm' 
                      : 'bg-muted/30 border-gray-200'
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {/* Available toggle - larger touch target */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAvailability(ingredient.id)}
                        className={`p-2 rounded-full min-w-[40px] min-h-[40px] ${
                          ingredient.available 
                            ? 'text-green-600 hover:bg-green-100 bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {ingredient.available ? <Check size={18} /> : <X size={18} />}
                      </Button>
                      
                      {/* Ingredient info */}
                      <div className="flex-1 min-w-0">
                        {editingId === ingredient.id ? (
                          <div className="flex gap-2 items-center">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && saveEdit(ingredient.id)}
                              className="text-sm h-10 flex-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveEdit(ingredient.id)}
                              className="h-10 px-3"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                              className="h-10 px-3"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`capitalize font-medium text-sm sm:text-base ${
                                !ingredient.available ? 'line-through text-muted-foreground' : ''
                              }`}>
                                {ingredient.name}
                              </span>
                              {ingredient.quantity && (
                                <Badge variant="outline" className="text-xs">
                                  {ingredient.quantity}
                                </Badge>
                              )}
                              {ingredient.confidence && ingredient.confidence < 0.8 && (
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(ingredient.confidence * 100)}% sure
                                </Badge>
                              )}
                            </div>
                            {!ingredient.available && (
                              <p className="text-xs text-muted-foreground">
                                Tap ✓ to mark as available
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(ingredient)}
                          className="p-2 text-muted-foreground hover:text-foreground min-w-[40px] min-h-[40px]"
                        >
                          <PencilSimple size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(ingredient.id)}
                          className="p-2 text-muted-foreground hover:text-destructive min-w-[40px] min-h-[40px]"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {ingredients.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              <p>Tap the ✓/✗ to mark ingredients as available or unavailable</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}