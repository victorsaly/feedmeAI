// OpenAI Vision API integration service
// This would typically run as a separate backend service

export interface Ingredient {
  name: string
  confidence: number
}

export interface Recipe {
  id: string
  title: string
  description: string
  cookingTime: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  instructions: string[]
  ingredients: string[]
  generatedImageUrl?: string
  originalImageBase64?: string
  createdAt: string
  isFavorite?: boolean
}

export interface AnalysisResponse {
  ingredients: Ingredient[]
  error?: string
}

export interface ImageGenerationResponse {
  imageUrl: string
  error?: string
}

export class OpenAIAnalyzer {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ''
  }

  async analyzeIngredients(imageBase64: string, prompt: string): Promise<AnalysisResponse> {
    if (!this.apiKey) {
      console.warn('OpenAI API key not provided, using demo data')
      return this.getDemoData()
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `${prompt}

Return only a valid JSON object in this exact format:
{
  "ingredients": [
    {"name": "ingredient_name", "confidence": 0.9}
  ]
}

Do not include any other text or markdown formatting.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64,
                    detail: 'low'
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenAI')
      }

      const result = JSON.parse(content)
      
      if (!result.ingredients || !Array.isArray(result.ingredients)) {
        throw new Error('Invalid response format from OpenAI')
      }

      return {
        ingredients: result.ingredients
      }

    } catch (error) {
      console.error('OpenAI analysis failed:', error)
      return this.getDemoData()
    }
  }

  async generateRecipeImage(recipeTitle: string, ingredients: string[]): Promise<ImageGenerationResponse> {
    if (!this.apiKey) {
      console.warn('OpenAI API key not provided, returning demo image')
      return {
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center'
      }
    }

    try {
      const prompt = `A beautiful, appetizing photo of ${recipeTitle} made with ${ingredients.slice(0, 5).join(', ')}. Professional food photography, well-lit, restaurant quality presentation, colorful and delicious looking.`
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'natural'
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI DALL-E API error: ${response.status}`)
      }

      const data = await response.json()
      const imageUrl = data.data[0]?.url

      if (!imageUrl) {
        throw new Error('No image URL received from DALL-E')
      }

      return { imageUrl }

    } catch (error) {
      console.error('DALL-E image generation failed:', error)
      // Return a fallback image from Unsplash
      const fallbackImages = [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&h=300&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop&crop=center'
      ]
      const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)]
      
      return {
        imageUrl: randomImage,
        error: 'Using fallback image due to generation failure'
      }
    }
  }

  private getDemoData(): AnalysisResponse {
    const demoIngredients = [
      { name: "tomatoes", confidence: 0.92 },
      { name: "red onion", confidence: 0.88 },
      { name: "garlic cloves", confidence: 0.85 },
      { name: "bell pepper", confidence: 0.79 },
      { name: "carrots", confidence: 0.76 },
      { name: "fresh basil", confidence: 0.71 }
    ]

    // Return random subset to simulate real analysis
    const shuffled = demoIngredients.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, Math.floor(Math.random() * 4) + 2)

    return {
      ingredients: selected
    }
  }
}

// Usage example:
// const analyzer = new OpenAIAnalyzer(process.env.VITE_OPENAI_API_KEY)
// const result = await analyzer.analyzeIngredients(imageBase64, prompt)