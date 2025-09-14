import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, Image as ImageIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Ingredient } from '@/App'

interface ImageUploadProps {
  onIngredientsDetected: (ingredients: Ingredient[]) => void
}

export function ImageUpload({ onIngredientsDetected }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setIsUploading(true)
    
    try {
      // Convert image to base64 for AI analysis
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageData = event.target?.result as string
        
        // Create AI prompt for ingredient analysis
        const promptText = `Analyze this image of food items/kitchen ingredients and identify all visible food ingredients. 
        
        Return a JSON object with a "ingredients" property containing an array of objects, each with:
        - id: unique identifier
        - name: ingredient name (lowercase, singular form)
        - quantity: estimated quantity if visible (optional)
        - available: always true for detected items
        - confidence: confidence score 0-1
        
        Focus on identifying actual food ingredients, not kitchenware or non-food items. Be specific (e.g., "red bell pepper" not just "pepper").
        
        Example format:
        {
          "ingredients": [
            {"id": "1", "name": "tomato", "quantity": "3 pieces", "available": true, "confidence": 0.9},
            {"id": "2", "name": "onion", "quantity": "1 large", "available": true, "confidence": 0.85}
          ]
        }`

        try {
          const response = await window.spark.llm(promptText, 'gpt-4o', true)
          const result = JSON.parse(response)
          
          if (result.ingredients && Array.isArray(result.ingredients)) {
            onIngredientsDetected(result.ingredients)
            toast.success(`Detected ${result.ingredients.length} ingredients!`)
          } else {
            throw new Error('Invalid response format')
          }
        } catch (error) {
          console.error('AI analysis failed:', error)
          toast.error('Failed to analyze image. Please try again.')
        } finally {
          setIsUploading(false)
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('File processing failed:', error)
      toast.error('Failed to process image')
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const triggerCameraInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment')
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
          {isUploading ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary" />
              <p className="text-muted-foreground text-sm sm:text-base">Analysing your ingredients...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <div className="rounded-full bg-primary/10 p-3 sm:p-4">
                <ImageIcon size={28} className="text-primary sm:size-32" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-base sm:text-lg font-medium">Upload Kitchen Photo</h3>
                <p className="text-muted-foreground text-sm">
                  Drag and drop an image or click to browse
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Take a clear photo of your fridge, pantry, or ingredients
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile-first button layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button 
          onClick={triggerCameraInput} 
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 h-12"
        >
          <Camera size={18} />
          Take Photo
        </Button>
        <Button 
          variant="outline" 
          onClick={triggerFileInput}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 h-12"
        >
          <Upload size={18} />
          Choose File
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="text-xs text-muted-foreground text-center px-4">
        <p>For best results, ensure good lighting and clear visibility of all ingredients.</p>
      </div>
    </div>
  )
}