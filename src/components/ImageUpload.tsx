import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, Image as ImageIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Ingredient } from '@/App'
import { OpenAIAnalyzer } from '@/lib/openai-analyzer'

interface ImageUploadProps {
  onIngredientsDetected: (ingredients: Ingredient[], imageBase64: string) => void
  onAnalyzing?: (analyzing: boolean) => void
}

export function ImageUpload({ onIngredientsDetected, onAnalyzing }: ImageUploadProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
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

  const analyzeIngredients = async (imageBase64: string): Promise<Ingredient[]> => {
    const analyzer = new OpenAIAnalyzer(import.meta.env.VITE_OPENAI_API_KEY)
    
    const prompt = `Analyze this image and identify all visible food ingredients. 
    Focus on identifying actual food ingredients, not kitchenware or non-food items.
    Be specific (e.g., "red bell pepper" not just "pepper").
    Return ingredients with confidence scores between 0.5 and 1.0.`

    const result = await analyzer.analyzeIngredients(imageBase64, prompt)
    return result.ingredients
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setIsAnalyzing(true)
    onAnalyzing?.(true)
    
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageData = event.target?.result as string
        setUploadedImage(imageData)
        
        try {
          const ingredients = await analyzeIngredients(imageData)
          
          if (ingredients && ingredients.length > 0) {
            onIngredientsDetected(ingredients, imageData)
            toast.success(`🎉 Detected ${ingredients.length} ingredients!`)
          } else {
            toast.warning('No ingredients detected. Try a clearer photo with more visible ingredients.')
          }
        } catch (error) {
          console.error('AI analysis failed:', error)
          toast.error('Failed to analyze image. Please try again.')
        } finally {
          setIsAnalyzing(false)
          onAnalyzing?.(false)
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('File processing failed:', error)
      toast.error('Failed to process image')
      setIsAnalyzing(false)
      onAnalyzing?.(false)
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

  const resetUpload = () => {
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Card 
        className={`border-2 border-dashed transition-colors ${
          !isAnalyzing ? 'cursor-pointer' : ''
        } ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!isAnalyzing ? triggerFileInput : undefined}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          {isAnalyzing ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <div>
                <p className="text-lg font-medium mb-1">🔍 Analyzing your ingredients...</p>
                <p className="text-sm text-muted-foreground">This may take a few seconds</p>
              </div>
            </div>
          ) : uploadedImage ? (
            <div className="flex flex-col items-center space-y-4">
              <img 
                src={uploadedImage} 
                alt="Uploaded ingredients" 
                className="max-h-48 rounded-lg border shadow-sm"
              />
              <div>
                <p className="text-lg font-medium mb-1">✅ Analysis Complete!</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Check your recipe suggestions below
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation()
                    resetUpload()
                  }}
                >
                  Upload Another Image
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-primary/10 p-6">
                <ImageIcon size={48} className="text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium">Upload Your Ingredients</h3>
                <p className="text-muted-foreground">
                  Drag and drop an image or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  📸 Take a clear photo of your fridge, pantry, or ingredients
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button 
          onClick={triggerCameraInput} 
          disabled={isAnalyzing}
          size="lg"
          className="w-full flex items-center justify-center gap-3"
        >
          <Camera size={20} />
          📱 Take Photo
        </Button>
        <Button 
          variant="outline" 
          onClick={triggerFileInput}
          disabled={isAnalyzing}
          size="lg"
          className="w-full flex items-center justify-center gap-3"
        >
          <Upload size={20} />
          💾 Choose File
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
        <p className="font-medium mb-2">💡 Tips for best results:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>✨ Good lighting</div>
          <div>🔍 Clear visibility</div>
          <div>📦 Multiple ingredients</div>
        </div>
      </div>
    </div>
  )
}