import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Check, X, ArrowClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  validateUKPostcode, 
  formatPostcode, 
  getPostcodeInfo, 
  getAllDeliveryAvailability,
  type PostcodeInfo,
  type DeliveryArea
} from '@/lib/postcode'

interface PostcodeSetupProps {
  onLocationSet?: (postcode: string, deliveryAreas: DeliveryArea[]) => void
  className?: string
}

export function PostcodeSetup({ onLocationSet, className = '' }: PostcodeSetupProps) {
  const [userPostcode, setUserPostcode, deleteUserPostcode] = useKV<string>('user-postcode', '')
  const [postcodeInput, setPostcodeInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [postcodeInfo, setPostcodeInfo] = useState<PostcodeInfo | null>(null)
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([])
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    // Load existing postcode info on mount
    if (userPostcode && validateUKPostcode(userPostcode)) {
      loadPostcodeInfo(userPostcode)
    }
  }, [userPostcode])

  const loadPostcodeInfo = async (postcode: string) => {
    try {
      const info = await getPostcodeInfo(postcode)
      const deliveryOptions = getAllDeliveryAvailability(postcode)
      
      setPostcodeInfo(info)
      setDeliveryAreas(deliveryOptions)
      
      if (onLocationSet) {
        onLocationSet(postcode, deliveryOptions)
      }
    } catch (error) {
      console.error('Failed to load postcode info:', error)
      toast.error('Failed to load delivery information')
    }
  }

  const handlePostcodeSubmit = async () => {
    const cleanPostcode = postcodeInput.trim().toUpperCase()
    
    if (!validateUKPostcode(cleanPostcode)) {
      toast.error('Please enter a valid UK postcode')
      return
    }

    setIsValidating(true)
    
    try {
      const formattedPostcode = formatPostcode(cleanPostcode)
      setUserPostcode(formattedPostcode)
      await loadPostcodeInfo(formattedPostcode)
      
      setShowSetup(false)
      setPostcodeInput('')
      toast.success(`Location set to ${formattedPostcode}`)
    } catch (error) {
      console.error('Postcode validation failed:', error)
      toast.error('Failed to validate postcode. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleChangeLocation = () => {
    setShowSetup(true)
    setPostcodeInput(userPostcode || '')
  }

  const handleClearLocation = () => {
    deleteUserPostcode()
    setPostcodeInfo(null)
    setDeliveryAreas([])
    setShowSetup(false)
    setPostcodeInput('')
    toast.success('Location cleared')
  }

  const availableStores = deliveryAreas.filter(area => area.available).length
  const getSupermarketBadgeColor = (supermarket: string) => {
    switch (supermarket) {
      case 'tesco': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'asda': return 'bg-green-100 text-green-800 border-green-200'
      case 'sainsburys': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'morrisons': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Show setup form if no postcode is set or user wants to change
  if (!userPostcode || showSetup) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin size={20} className="text-accent" />
            Set Your Location
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your UK postcode to see accurate delivery availability and pricing
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter UK postcode (e.g. SW1A 1AA)"
                value={postcodeInput}
                onChange={(e) => setPostcodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handlePostcodeSubmit()}
                className="flex-1"
                maxLength={8}
              />
              <Button 
                onClick={handlePostcodeSubmit}
                disabled={isValidating || !postcodeInput.trim()}
                className="flex items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <ArrowClockwise size={16} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Set Location
                  </>
                )}
              </Button>
            </div>
            
            {userPostcode && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSetup(false)}
                  className="flex-1"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClearLocation}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <X size={14} />
                  Clear Location
                </Button>
              </div>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Why do we need your postcode?</strong> UK supermarkets have different delivery areas and pricing. 
              Your postcode helps us show accurate availability, delivery fees, and timing for your area.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show location summary with delivery options
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-accent" />
            Your Location
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleChangeLocation}
            className="flex items-center gap-2"
          >
            <MapPin size={14} />
            Change
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {postcodeInfo && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{postcodeInfo.postcode}</h4>
                <p className="text-sm text-muted-foreground">{postcodeInfo.district}</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check size={12} className="mr-1" />
                Valid UK Postcode
              </Badge>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-sm">Delivery Available</h5>
                <Badge variant="outline">
                  {availableStores} of {deliveryAreas.length} stores
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {deliveryAreas.map((area, i) => (
                  <div key={i} className={`p-2 rounded-lg border text-xs ${
                    area.available 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {area.available ? (
                        <Check size={12} className="text-green-600" />
                      ) : (
                        <X size={12} className="text-gray-400" />
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-xs capitalize ${getSupermarketBadgeColor(area.supermarket)}`}
                      >
                        {area.supermarket}
                      </Badge>
                    </div>
                    {area.available ? (
                      <div className="text-muted-foreground">
                        Min order {area.minOrder} • {area.deliveryFee} delivery
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        {area.notes || 'Not available'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {availableStores === 0 && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Limited delivery options</strong> in your area. You may need to visit stores directly or check alternative postcodes nearby.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}