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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Ingredients</span>
            <Badge variant="secondary" className="text-sm">
              {availableCount} available
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new ingredient */}
          <div className="flex gap-2">
            <Input
              placeholder="Add ingredient (e.g., tomato, onion)"
              value={newIngredientName}
              onChange={(e) => setNewIngredientName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              className="flex-1"
            />
            <Button 
              onClick={addIngredient} 
              disabled={!newIngredientName.trim()}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add
            </Button>
          </div>

          {/* Ingredients list */}
          {ingredients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No ingredients yet.</p>
              <p className="text-sm">Upload a photo or add ingredients manually.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ingredients.map((ingredient) => (
                <Card 
                  key={ingredient.id} 
                  className={`p-3 ${ingredient.available ? 'bg-card' : 'bg-muted/50'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAvailability(ingredient.id)}
                        className={`p-1 rounded-full ${
                          ingredient.available 
                            ? 'text-green-600 hover:bg-green-100' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {ingredient.available ? <Check size={16} /> : <X size={16} />}
                      </Button>
                      
                      <div className="flex-1">
                        {editingId === ingredient.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && saveEdit(ingredient.id)}
                              className="text-sm h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveEdit(ingredient.id)}
                              className="h-8 px-2"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-8 px-2"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`capitalize ${!ingredient.available ? 'line-through text-muted-foreground' : ''}`}>
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
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(ingredient)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <PencilSimple size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(ingredient.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash size={14} />
                      </Button>
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