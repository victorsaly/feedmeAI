import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  ArrowCounterClockwise,
  Clock,
  ChefHat,
  ArrowLeft,
  Heart,
  Check
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Recipe } from '../lib/openai-analyzer'
import { OpenAIAnalyzer } from '../lib/openai-analyzer'
import { FavoritesStorage } from '../lib/favorites-storage'

// Simple image cache to avoid regenerating images
const imageCache = new Map<string, string>()

interface CookingTutorialProps {
  recipe: Recipe
  originalImageBase64?: string
  onBack: () => void
  onComplete: () => void
}

interface CookingStep {
  id: number
  instruction: string
  tip?: string
  estimatedTime?: string
  imagePrompt: string
  generatedImage?: string
}

export function CookingTutorial({ recipe, originalImageBase64, onBack, onComplete }: CookingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [stepImages, setStepImages] = useState<{ [key: number]: string }>({})
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: number]: 'idle' | 'loading' | 'loaded' | 'error' }>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [autoPlayTimer, setAutoPlayTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const analyzer = new OpenAIAnalyzer(import.meta.env.VITE_OPENAI_API_KEY)

  // Enhanced cooking steps with detailed visual prompts
  const cookingSteps: CookingStep[] = recipe.instructions.map((instruction, index) => {
    const stepNumber = index + 1
    const recipeTitle = recipe.title.toLowerCase()
    
    // Generate specific image prompts for each step
    let imagePrompt = ""
    let estimatedTime = "2-3 min"
    let tip = ""

    if (instruction.toLowerCase().includes('boil') || instruction.toLowerCase().includes('water')) {
      imagePrompt = `A large pot of boiling water on stove, steam rising, professional kitchen photography`
      estimatedTime = "5-8 min"
      tip = "Water is ready when you see large bubbles breaking the surface"
    } else if (instruction.toLowerCase().includes('chop') || instruction.toLowerCase().includes('dice') || instruction.toLowerCase().includes('cut')) {
      imagePrompt = `Fresh ingredients being chopped on wooden cutting board, sharp knife, organized prep station, professional food photography`
      estimatedTime = "3-5 min"
      tip = "Keep fingers curled and use a rocking motion with the knife"
    } else if (instruction.toLowerCase().includes('heat') || instruction.toLowerCase().includes('oil') || instruction.toLowerCase().includes('pan')) {
      imagePrompt = `Pan heating on stovetop with oil shimmering, ready for cooking, professional kitchen photography`
      estimatedTime = "1-2 min"
      tip = "Oil is ready when it shimmers and moves easily around the pan"
    } else if (instruction.toLowerCase().includes('sauté') || instruction.toLowerCase().includes('cook') || instruction.toLowerCase().includes('fry')) {
      imagePrompt = `Ingredients sautéing in pan with golden color, steam rising, professional cooking photography`
      estimatedTime = "3-7 min"
      tip = "Don't overcrowd the pan - cook in batches if needed"
    } else if (instruction.toLowerCase().includes('add') || instruction.toLowerCase().includes('mix') || instruction.toLowerCase().includes('combine')) {
      imagePrompt = `Ingredients being combined in pan or bowl, colors mixing together, professional food photography`
      estimatedTime = "1-2 min"
      tip = "Add ingredients gradually for better flavor integration"
    } else if (instruction.toLowerCase().includes('simmer') || instruction.toLowerCase().includes('reduce')) {
      imagePrompt = `${recipeTitle} simmering in pan with gentle bubbling, rich colors, professional cooking photography`
      estimatedTime = "5-10 min"
      tip = "Simmer means gentle bubbles, not a rolling boil"
    } else if (instruction.toLowerCase().includes('serve') || instruction.toLowerCase().includes('plate')) {
      imagePrompt = `Beautiful plated ${recipeTitle}, garnished and ready to serve, restaurant quality presentation`
      estimatedTime = "1-2 min"
      tip = "Let hot dishes rest briefly before serving for best flavor"
    } else {
      imagePrompt = `Step ${stepNumber} of cooking ${recipeTitle}, professional food photography, detailed cooking process`
      tip = "Take your time and taste as you go"
    }

    return {
      id: index,
      instruction,
      tip,
      estimatedTime,
      imagePrompt
    }
  })

  const totalSteps = cookingSteps.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  // Priority image loading for current and upcoming steps
  useEffect(() => {
    const loadPriorityImages = async () => {
      const prioritySteps = [currentStep, currentStep + 1, currentStep + 2].filter(
        step => step < cookingSteps.length && !stepImages[step] && imageLoadingStates[step] !== 'loading'
      )

      for (const stepIndex of prioritySteps) {
        const step = cookingSteps[stepIndex]
        const cacheKey = `${recipe.title}-step-${stepIndex}-${step.instruction.slice(0, 50)}`
        const cachedImage = imageCache.get(cacheKey)

        if (cachedImage) {
          setStepImages(prev => ({ ...prev, [stepIndex]: cachedImage }))
          setImageLoadingStates(prev => ({ ...prev, [stepIndex]: 'loaded' }))
          continue
        }

        setImageLoadingStates(prev => ({ ...prev, [stepIndex]: 'loading' }))
        
        try {
          const result = await analyzer.generateRecipeImage(
            `Step ${stepIndex + 1}: ${step.instruction}`, 
            [step.imagePrompt]
          )
          
          imageCache.set(cacheKey, result.imageUrl)
          setStepImages(prev => ({ ...prev, [stepIndex]: result.imageUrl }))
          setImageLoadingStates(prev => ({ ...prev, [stepIndex]: 'loaded' }))
        } catch (error) {
          console.error(`Failed to generate priority image for step ${stepIndex + 1}:`, error)
          setImageLoadingStates(prev => ({ ...prev, [stepIndex]: 'error' }))
        }
      }
    }

    loadPriorityImages()
  }, [currentStep, recipe.title])

  useEffect(() => {
    generateAllStepImages()
  }, [])

  useEffect(() => {
    if (isPlaying && autoPlayTimer) {
      clearTimeout(autoPlayTimer)
    }

    if (isPlaying) {
      const timer = setTimeout(() => {
        if (currentStep < totalSteps - 1) {
          nextStep()
        } else {
          setIsPlaying(false)
          toast.success("🎉 Cooking tutorial completed!")
        }
      }, 8000) // 8 seconds per step
      
      setAutoPlayTimer(timer)
    }

    return () => {
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer)
      }
    }
  }, [isPlaying, currentStep])

  const generateAllStepImages = async () => {
    // Initialize loading states for all steps
    const initialLoadingStates: { [key: number]: 'idle' | 'loading' | 'loaded' | 'error' } = {}
    cookingSteps.forEach((_, index) => {
      initialLoadingStates[index] = 'loading'
    })
    setImageLoadingStates(initialLoadingStates)

    try {
      // Generate images in smaller batches to reduce load
      const batchSize = 2
      const batches: CookingStep[][] = []
      
      for (let i = 0; i < cookingSteps.length; i += batchSize) {
        batches.push(cookingSteps.slice(i, i + batchSize))
      }

      // Process first batch immediately for current step
      const firstBatch = batches[0]
      const firstBatchPromises = firstBatch.map(async (step, batchIndex) => {
        const actualIndex = batchIndex
        setImageLoadingStates(prev => ({ ...prev, [actualIndex]: 'loading' }))
        
        // Check cache first
        const cacheKey = `${recipe.title}-step-${actualIndex}-${step.instruction.slice(0, 50)}`
        const cachedImage = imageCache.get(cacheKey)
        
        if (cachedImage) {
          setStepImages(prev => ({ ...prev, [actualIndex]: cachedImage }))
          setImageLoadingStates(prev => ({ ...prev, [actualIndex]: 'loaded' }))
          return { stepIndex: actualIndex, imageUrl: cachedImage }
        }
        
        try {
          const result = await analyzer.generateRecipeImage(
            `Step ${actualIndex + 1}: ${step.instruction}`, 
            [step.imagePrompt]
          )
          
          // Cache the result
          imageCache.set(cacheKey, result.imageUrl)
          
          setStepImages(prev => ({ ...prev, [actualIndex]: result.imageUrl }))
          setImageLoadingStates(prev => ({ ...prev, [actualIndex]: 'loaded' }))
          
          return { stepIndex: actualIndex, imageUrl: result.imageUrl }
        } catch (error) {
          console.error(`Failed to generate image for step ${actualIndex + 1}:`, error)
          
          // Use fallback images
          const fallbackImages = [
            'https://images.unsplash.com/photo-1556909114-8c3e56d78a9c?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1556909119-f7a0b2c1e3b5?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1556909114-ec8b5d04ea5e?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
          ]
          const fallbackUrl = fallbackImages[actualIndex % fallbackImages.length]
          
          setStepImages(prev => ({ ...prev, [actualIndex]: fallbackUrl }))
          setImageLoadingStates(prev => ({ ...prev, [actualIndex]: 'loaded' }))
          
          return { stepIndex: actualIndex, imageUrl: fallbackUrl }
        }
      })

      await Promise.all(firstBatchPromises)

      // Process remaining batches in background
      const remainingBatches = batches.slice(1)
      remainingBatches.forEach(async (batch, batchNum) => {
        const batchPromises = batch.map(async (step, batchIndex) => {
          const actualIndex = (batchNum + 1) * batchSize + batchIndex
          if (actualIndex >= cookingSteps.length) return
          
          setImageLoadingStates(prev => ({ ...prev, [actualIndex]: 'loading' }))
          
          // Check cache first
          const cacheKey = `${recipe.title}-step-${actualIndex}-${step.instruction.slice(0, 50)}`
          const cachedImage = imageCache.get(cacheKey)
          
          if (cachedImage) {
            setStepImages(prev => ({ ...prev, [actualIndex]: cachedImage }))
            setImageLoadingStates(prev => ({ ...prev, [actualIndex]: 'loaded' }))
            return
          }
          
          try {
            const result = await analyzer.generateRecipeImage(
              `Step ${actualIndex + 1}: ${step.instruction}`, 
              [step.imagePrompt]
            )
            
            // Cache the result
            imageCache.set(cacheKey, result.imageUrl)
            
            setStepImages(prev => ({ ...prev, [actualIndex]: result.imageUrl }))
            setImageLoadingStates(prev => ({ ...prev, [actualIndex]: 'loaded' }))
            
          } catch (error) {
            console.error(`Failed to generate image for step ${actualIndex + 1}:`, error)
            
            const fallbackImages = [
              'https://images.unsplash.com/photo-1556909114-8c3e56d78a9c?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1556909119-f7a0b2c1e3b5?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1556909114-ec8b5d04ea5e?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
            ]
            const fallbackUrl = fallbackImages[actualIndex % fallbackImages.length]
            
            setStepImages(prev => ({ ...prev, [actualIndex]: fallbackUrl }))
            setImageLoadingStates(prev => ({ ...prev, [actualIndex]: 'loaded' }))
          }
        })

        await Promise.all(batchPromises)
      })
      
    } catch (error) {
      console.error('Failed to generate step images:', error)
      // Set all remaining steps to error state
      const errorStates: { [key: number]: 'error' } = {}
      cookingSteps.forEach((_, index) => {
        if (!stepImages[index]) {
          errorStates[index] = 'error'
        }
      })
      setImageLoadingStates(prev => ({ ...prev, ...errorStates }))
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(prev => prev + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev)
  }

  const markStepComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    if (currentStep < totalSteps - 1) {
      nextStep()
    }
  }

  const restartTutorial = () => {
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setIsPlaying(false)
  }

  const saveRecipe = () => {
    const recipeToSave = {
      ...recipe,
      originalImageBase64,
      createdAt: new Date().toISOString(),
      isFavorite: true
    }
    
    FavoritesStorage.saveFavorite(recipeToSave)
    toast.success('❤️ Recipe saved to favorites!')
  }

  const finishCooking = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    toast.success('🎉 Congratulations! You\'ve completed the recipe!')
    onComplete()
  }

  const currentStepData = cookingSteps[currentStep]
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Recipe
        </Button>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{recipe.title}</h2>
          <p className="text-muted-foreground">Interactive Cooking Tutorial</p>
        </div>
        <Button 
          variant="outline" 
          onClick={saveRecipe}
          className="flex items-center gap-2"
        >
          <Heart size={16} />
          Save Recipe
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Slide Card */}
      <Card className="overflow-hidden shadow-xl">
        <CardContent className="p-0">
          {/* Image Section with consistent dimensions */}
          <div className="relative h-80 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center overflow-hidden">
            {stepImages[currentStep] ? (
              <img 
                src={stepImages[currentStep]} 
                alt={`Step ${currentStep + 1}`}
                className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                style={{
                  animation: isPlaying ? 'slideIn 0.5s ease-out' : undefined
                }}
              />
            ) : (
              <div className="text-center space-y-4 w-full h-full flex flex-col items-center justify-center">
                {imageLoadingStates[currentStep] === 'loading' ? (
                  <>
                    <div className="animate-pulse w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                      <ChefHat size={24} className="text-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-primary/20 rounded w-24 animate-pulse"></div>
                      <p className="text-sm text-muted-foreground">Preparing step image...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ChefHat size={48} className="text-muted-foreground/40" />
                    <p className="text-muted-foreground">Step {currentStep + 1}</p>
                  </>
                )}
              </div>
            )}
            
            {/* Step Number Overlay */}
            <div className="absolute top-4 left-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
                {currentStep + 1}
              </div>
            </div>

            {/* Completion Check */}
            {completedSteps.has(currentStep) && (
              <div className="absolute top-4 right-4">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  <Check size={16} />
                </div>
              </div>
            )}

            {/* Subtle loading indicator for background image generation */}
            {!completedSteps.has(currentStep) && Object.values(imageLoadingStates).some(state => state === 'loading') && (
              <div className="absolute top-4 right-4">
                <div className="bg-primary/80 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin"></div>
                </div>
              </div>
            )}

            {/* Time Estimate */}
            {currentStepData.estimatedTime && (
              <div className="absolute bottom-4 right-4">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                  <Clock size={12} className="mr-1" />
                  {currentStepData.estimatedTime}
                </Badge>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-4">
            {/* Main Instruction */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold leading-relaxed">
                {currentStepData.instruction}
              </h3>
              
              {/* Tip */}
              {currentStepData.tip && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="text-amber-600 dark:text-amber-400 mt-0.5">💡</div>
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                      <strong>Pro Tip:</strong> {currentStepData.tip}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Video-Style Controls */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousStep}
                  disabled={isFirstStep}
                  className="flex items-center gap-2"
                >
                  <SkipBack size={16} />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextStep}
                  disabled={isLastStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <SkipForward size={16} />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restartTutorial}
                  className="flex items-center gap-2"
                >
                  <ArrowCounterClockwise size={16} />
                  Restart
                </Button>
                
                {isLastStep ? (
                  <Button
                    onClick={finishCooking}
                    className="flex items-center gap-2"
                  >
                    <Check size={16} />
                    Finish Cooking
                  </Button>
                ) : (
                  <Button
                    onClick={markStepComplete}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Check size={16} />
                    Step Complete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Timeline */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">Recipe Timeline</h4>
          <div className="flex flex-wrap gap-2">
            {cookingSteps.map((step, index) => (
              <Button
                key={index}
                variant={
                  index === currentStep 
                    ? "default" 
                    : completedSteps.has(index) 
                      ? "secondary" 
                      : "outline"
                }
                size="sm"
                onClick={() => setCurrentStep(index)}
                className="relative"
              >
                {completedSteps.has(index) && (
                  <Check size={12} className="absolute -top-1 -right-1 text-green-600" />
                )}
                Step {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inline styles for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `
      }} />
    </div>
  )
}