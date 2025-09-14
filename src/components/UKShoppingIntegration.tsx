import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart, MapPin, Clock, ArrowSquareOut } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface UKSupermarket {
  id: string
  name: string
  logo: string
  color: string
  deliveryInfo: string
  minOrder?: string
}

export interface ShoppingBasket {
  supermarket: UKSupermarket
  items: Array<{
    ingredient: string
    product: string
    price: string
    url: string
  }>
  totalPrice: string
  basketUrl: string
}

interface UKShoppingIntegrationProps {
  missingIngredients: string[]
  recipeName?: string
  className?: string
}

// Major UK supermarket chains
const UK_SUPERMARKETS: UKSupermarket[] = [
  {
    id: 'tesco',
    name: 'Tesco',
    logo: '🛒',
    color: 'bg-blue-600',
    deliveryInfo: 'Next day delivery • £4.50 minimum order',
    minOrder: '£25'
  },
  {
    id: 'asda',
    name: 'ASDA',
    logo: '🟢',
    color: 'bg-green-600',
    deliveryInfo: 'Same day delivery available • £30 minimum order',
    minOrder: '£30'
  },
  {
    id: 'sainsburys',
    name: "Sainsbury's",
    logo: '🟠',
    color: 'bg-orange-600',
    deliveryInfo: 'Next day delivery • £25 minimum order',
    minOrder: '£25'
  },
  {
    id: 'morrisons',
    name: 'Morrisons',
    logo: '🟡',
    color: 'bg-yellow-600',
    deliveryInfo: 'Next day delivery • £25 minimum order',
    minOrder: '£25'
  }
]

export function UKShoppingIntegration({ missingIngredients, recipeName, className = '' }: UKShoppingIntegrationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [baskets, setBaskets] = useState<ShoppingBasket[]>([])
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>('')

  const generateShoppingBaskets = async () => {
    if (missingIngredients.length === 0) return

    setIsGenerating(true)
    
    try {
      const ingredientsList = missingIngredients.join(', ')
      const promptText = `Generate shopping baskets for these ingredients: ${ingredientsList} ${recipeName ? `needed for recipe: ${recipeName}` : ''}
      
      Create shopping baskets for UK supermarkets (Tesco, ASDA, Sainsbury's, Morrisons).
      For each ingredient, find realistic UK products with approximate prices in GBP.
      
      Return JSON with "baskets" array containing objects with:
      - supermarket: supermarket id (tesco, asda, sainsburys, morrisons)
      - items: array of {ingredient, product, price, url} objects
      - totalPrice: estimated total in GBP format "£X.XX"
      - basketUrl: realistic deep link URL to the supermarket's online shopping
      
      Use realistic UK product names and prices. For URLs, create realistic deep links to each supermarket's grocery section.
      
      Example format:
      {
        "baskets": [
          {
            "supermarket": "tesco",
            "items": [
              {
                "ingredient": "tomatoes",
                "product": "Tesco Cherry Tomatoes 250g",
                "price": "£1.50",
                "url": "https://www.tesco.com/groceries/en-GB/products/254011747"
              }
            ],
            "totalPrice": "£8.50",
            "basketUrl": "https://www.tesco.com/groceries/en-GB/shop/fresh-food"
          }
        ]
      }`

      const response = await window.spark.llm(promptText, 'gpt-4o', true)
      const result = JSON.parse(response)
      
      if (result.baskets && Array.isArray(result.baskets)) {
        // Match with supermarket data
        const enrichedBaskets = result.baskets.map((basket: any) => ({
          ...basket,
          supermarket: UK_SUPERMARKETS.find(s => s.id === basket.supermarket) || UK_SUPERMARKETS[0]
        }))
        
        setBaskets(enrichedBaskets)
        toast.success(`Found shopping options at ${result.baskets.length} supermarkets`)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Shopping basket generation failed:', error)
      toast.error('Failed to generate shopping baskets. Please try again.')
      setBaskets([])
    } finally {
      setIsGenerating(false)
    }
  }

  const openBasket = (basket: ShoppingBasket) => {
    // Open the supermarket's online shopping in a new tab
    window.open(basket.basketUrl, '_blank')
    toast.success(`Opened ${basket.supermarket.name} online shopping`)
  }

  const getDeliveryBadgeColor = (supermarketId: string) => {
    switch (supermarketId) {
      case 'tesco': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'asda': return 'bg-green-100 text-green-800 border-green-200'
      case 'sainsburys': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'morrisons': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (missingIngredients.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart size={20} className="text-accent" />
          UK Supermarket Shopping
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get missing ingredients delivered from major UK supermarkets
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {baskets.length === 0 ? (
          <div className="text-center py-6">
            <div className="mb-4">
              <ShoppingCart size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-2">
                Missing {missingIngredients.length} ingredient{missingIngredients.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1 justify-center mb-4">
                {missingIngredients.slice(0, 5).map((ingredient, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {ingredient}
                  </Badge>
                ))}
                {missingIngredients.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{missingIngredients.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              onClick={generateShoppingBaskets}
              disabled={isGenerating}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <ShoppingCart size={16} />
              {isGenerating ? 'Finding Products...' : 'Compare UK Supermarkets'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Available at {baskets.length} supermarkets</h4>
              <Button 
                onClick={generateShoppingBaskets}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ShoppingCart size={14} />
                Refresh
              </Button>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {baskets.map((basket, i) => (
                <Card key={i} className="relative border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{basket.supermarket.logo}</span>
                        <div>
                          <h5 className="font-medium">{basket.supermarket.name}</h5>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getDeliveryBadgeColor(basket.supermarket.id)}`}
                          >
                            {basket.supermarket.minOrder} min order
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{basket.totalPrice}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>{basket.supermarket.deliveryInfo}</span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {basket.items.length} product{basket.items.length > 1 ? 's' : ''} available
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        onClick={() => openBasket(basket)}
                        className="w-full flex items-center gap-2"
                        size="sm"
                      >
                        <ArrowSquareOut size={14} />
                        Shop at {basket.supermarket.name}
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full flex items-center gap-2"
                            size="sm"
                          >
                            <MapPin size={14} />
                            View Products
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <span>{basket.supermarket.logo}</span>
                              {basket.supermarket.name} Shopping List
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh] pr-4">
                            <div className="space-y-3">
                              {basket.items.map((item, j) => (
                                <div key={j} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{item.product}</p>
                                    <p className="text-xs text-muted-foreground">For: {item.ingredient}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-primary">{item.price}</p>
                                  </div>
                                </div>
                              ))}
                              <div className="border-t pt-3 flex justify-between items-center">
                                <span className="font-medium">Total</span>
                                <span className="text-lg font-bold text-primary">{basket.totalPrice}</span>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}