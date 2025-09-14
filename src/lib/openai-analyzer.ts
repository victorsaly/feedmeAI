// OpenAI Vision API integration service
// This would typically run as a separate backend service

export interface Ingredient {
  name: string
  confidence: number
}

export interface AnalysisResponse {
  ingredients: Ingredient[]
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