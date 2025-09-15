import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Camera } from '@phosphor-icons/react'
import { exampleImages } from '@/data'

export function ExampleImages() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Camera className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold text-gray-900">📸 Photo Tips for Best Results</h3>
        </div>
        <p className="text-gray-600">
          Get better recipe suggestions by taking great photos of your ingredients
        </p>
      </div>

      {/* Example Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exampleImages.map((example, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <img
                src={example.url}
                alt={example.caption}
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge className="bg-green-500 text-white text-xs">
                  ✓ Good
                </Badge>
              </div>
            </div>
            <CardContent className="p-3 space-y-2">
              <h4 className="font-medium text-sm text-gray-900">{example.caption}</h4>
              <div className="flex items-start gap-2">
                <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">{example.tip}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="bg-primary/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h4 className="font-medium text-gray-900">Quick Photography Tips</h4>
        </div>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Use natural lighting when possible</li>
          <li>• Keep ingredients separate and visible</li>
          <li>• Clean, uncluttered background works best</li>
          <li>• Include labels if ingredients aren't obvious</li>
        </ul>
      </div>
    </div>
  )
}