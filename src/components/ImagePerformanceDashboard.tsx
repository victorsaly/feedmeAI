import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendUp, 
  Clock, 
  Database, 
  Lightning, 
  Image as ImageIcon,
  Trash
} from '@phosphor-icons/react'
import { imageCache } from '@/lib/image-cache'
import { imagePreloader } from '@/lib/image-preloader'

export function ImagePerformanceDashboard() {
  const [cacheStats, setCacheStats] = useState(imageCache.getStats())
  const [preloaderStats, setPreloaderStats] = useState(imagePreloader.getStats())
  const [showDashboard, setShowDashboard] = useState(false)

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(imageCache.getStats())
      setPreloaderStats(imagePreloader.getStats())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const formatHitRate = (rate: number) => {
    return `${Math.round(rate * 100)}%`
  }

  const clearCache = () => {
    imageCache.clear()
    imagePreloader.clearQueue()
    setCacheStats(imageCache.getStats())
    setPreloaderStats(imagePreloader.getStats())
  }

  if (!showDashboard) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowDashboard(true)}
        className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm shadow-lg"
      >
        <Lightning size={16} />
        Performance
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <Card className="shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightning className="w-4 h-4 text-orange-500" />
              Image Performance
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDashboard(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Cache Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center gap-1">
                <Database className="w-3 h-3" />
                Cached Images
              </span>
              <Badge variant="secondary" className="text-xs">
                {cacheStats.totalImages}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center gap-1">
                <TrendUp className="w-3 h-3" />
                Hit Rate
              </span>
              <Badge 
                variant={cacheStats.hitRate > 0.7 ? "default" : "secondary"}
                className="text-xs"
              >
                {formatHitRate(cacheStats.hitRate)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Storage Used
              </span>
              <Badge variant="outline" className="text-xs">
                {formatSize(cacheStats.totalSize)}
              </Badge>
            </div>
          </div>

          {/* Preloader Stats */}
          <div className="border-t pt-3 space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Image Preloader Queue
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {preloaderStats.loaded}
                </div>
                <div className="text-xs text-gray-500">Loaded</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {preloaderStats.loading}
                </div>
                <div className="text-xs text-gray-500">Loading</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">
                  {preloaderStats.pending}
                </div>
                <div className="text-xs text-gray-500">Queued</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {preloaderStats.error}
                </div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>
          </div>

          {/* Performance Benefits */}
          <div className="border-t pt-3">
            <div className="text-xs font-medium text-gray-700 mb-2">
              🚀 Speed Benefits
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Persistent caching</span>
                <span className="text-green-600">✓ Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>Image compression</span>
                <span className="text-green-600">✓ WebP/JPEG</span>
              </div>
              <div className="flex justify-between">
                <span>Smart preloading</span>
                <span className="text-green-600">✓ Priority queue</span>
              </div>
              <div className="flex justify-between">
                <span>Progressive loading</span>
                <span className="text-green-600">✓ Blur-to-sharp</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
              className="flex-1 text-xs"
            >
              <Trash className="w-3 h-3 mr-1" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}