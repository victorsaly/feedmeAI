import { useEffect, useState } from 'react'

// Food SVG icons as components - More detailed and food-specific
const FoodIcons = {
  tomato: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M12 2c-1.5 0-2.8.6-3.8 1.5C7.2 4.4 6.5 5.7 6.5 7v1c0 2.8 2.2 5 5 5h1c2.8 0 5-2.2 5-5V7c0-1.3-.7-2.6-1.7-3.5C14.8 2.6 13.5 2 12 2zm0 2c.8 0 1.5.3 2.1.8.6.5 1 1.2 1 2V7c0 1.7-1.3 3-3 3h-1c-1.7 0-3-1.3-3-3V6.8c0-.8.4-1.5 1-2C10.5 4.3 11.2 4 12 4zm-1 12c-2.8 0-5 2.2-5 5v1h12v-1c0-2.8-2.2-5-5-5H11z"/>
      <path fill="currentColor" d="M9 6.5c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5zm2 0c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5zm2 0c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5z"/>
    </svg>
  ),

  broccoli: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M8 2c-1.1 0-2 .9-2 2s.9 2 2 2c.4 0 .7-.1 1-.3.3.2.6.3 1 .3s.7-.1 1-.3c.3.2.6.3 1 .3s.7-.1 1-.3c.3.2.6.3 1 .3 1.1 0 2-.9 2-2s-.9-2-2-2c-.4 0-.7.1-1 .3-.3-.2-.6-.3-1-.3s-.7.1-1 .3c-.3-.2-.6-.3-1-.3s-.7.1-1 .3C8.7 2.1 8.4 2 8 2zm2 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM8 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm3 6h2v8h-2v-8z"/>
    </svg>
  ),

  bread: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M18 6H6c-2.2 0-4 1.8-4 4v4c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4v-4c0-2.2-1.8-4-4-4zm2 8c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v4z"/>
      <circle fill="currentColor" cx="8" cy="10" r=".5"/>
      <circle fill="currentColor" cx="10" cy="12" r=".5"/>
      <circle fill="currentColor" cx="14" cy="10" r=".5"/>
      <circle fill="currentColor" cx="16" cy="12" r=".5"/>
      <circle fill="currentColor" cx="12" cy="14" r=".5"/>
    </svg>
  ),

  cheese: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M5 8l7-6 7 6v10c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8zm2 1v9h10V9l-5-4.2L7 9z"/>
      <circle fill="currentColor" cx="9" cy="11" r="1"/>
      <circle fill="currentColor" cx="15" cy="13" r="1"/>
      <circle fill="currentColor" cx="11" cy="15" r="1"/>
      <circle fill="currentColor" cx="13" cy="10" r=".5"/>
      <circle fill="currentColor" cx="10" cy="13" r=".5"/>
    </svg>
  ),

  fish: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M2 12c0 0 4.5-6 9-6s9 6 9 6-4.5 6-9 6-9-6-9-6zm9-4c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
      <circle fill="currentColor" cx="11" cy="12" r="1"/>
      <path fill="currentColor" d="M20 10l2 2-2 2v-1.5c-.7-.3-1.4-.5-2.1-.5.7 0 1.4-.2 2.1-.5V10z"/>
      <path fill="currentColor" d="M4 10v1.5c.7.3 1.4.5 2.1.5-.7 0-1.4.2-2.1.5V14l-2-2 2-2z"/>
    </svg>
  ),

  strawberry: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M12 3c-1 0-2 .5-2.6 1.3l-.9 1.4c-.3.4-.8.8-1.3.8-.8 0-1.5.7-1.5 1.5 0 .4.2.8.5 1.1L8 10.5V18c0 2.2 1.8 4 4 4s4-1.8 4-4v-7.5l1.8-1.4c.3-.3.5-.7.5-1.1 0-.8-.7-1.5-1.5-1.5-.5 0-1-.4-1.3-.8l-.9-1.4C14 3.5 13 3 12 3zm0 2c.3 0 .6.2.8.5l.9 1.4c.5.8 1.3 1.3 2.1 1.3.3 0 .5.2.5.5s-.1.3-.2.4L14.5 10H9.5l-1.6-1.3c-.1-.1-.2-.2-.2-.4s.2-.5.5-.5c.8 0 1.6-.5 2.1-1.3l.9-1.4c.2-.3.5-.5.8-.5zM10 12h4v6c0 1.1-.9 2-2 2s-2-.9-2-2v-6z"/>
      <circle fill="currentColor" cx="10.5" cy="13.5" r=".5"/>
      <circle fill="currentColor" cx="13.5" cy="14.5" r=".5"/>
      <circle fill="currentColor" cx="11.5" cy="16" r=".5"/>
      <path fill="currentColor" d="M11 4c-.3 0-.5.2-.5.5v1c0 .3.2.5.5.5s.5-.2.5-.5v-1c0-.3-.2-.5-.5-.5zm2 0c-.3 0-.5.2-.5.5v1c0 .3.2.5.5.5s.5-.2.5-.5v-1c0-.3-.2-.5-.5-.5z"/>
    </svg>
  ),

  lemon: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M12 2C9.8 2 8 3.8 8 6c0 .5.1 1 .3 1.4C6.9 8.1 6 9.4 6 11c0 1.7 1 3.2 2.5 3.9-.3.6-.5 1.2-.5 1.9 0 2.2 1.8 4 4 4s4-1.8 4-4c0-.7-.2-1.3-.5-1.9C16.9 14.2 18 12.7 18 11c0-1.6-.9-2.9-2.3-3.6.2-.4.3-.9.3-1.4 0-2.2-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2 0 .4-.1.7-.3 1-.4-.1-.8-.2-1.2-.2h-1c-.4 0-.8.1-1.2.2-.2-.3-.3-.6-.3-1 0-1.1.9-2 2-2zm0 4c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm0 8c-1.1 0-2-.9-2-2 0-.4.1-.8.3-1.1.5.1 1.1.2 1.7.2s1.2-.1 1.7-.2c.2.3.3.7.3 1.1 0 1.1-.9 2-2 2z"/>
    </svg>
  ),

  egg: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M12 2C8.7 2 6 5.1 6 9c0 5.5 2.7 11 6 11s6-5.5 6-11c0-3.9-2.7-7-6-7zm0 2c2.2 0 4 2.2 4 5 0 4.4-1.8 9-4 9s-4-4.6-4-9c0-2.8 1.8-5 4-5z"/>
      <ellipse fill="currentColor" cx="12" cy="9" rx="3" ry="4"/>
      <ellipse fill="currentColor" cx="10" cy="8" rx=".5" ry=".8" transform="rotate(-20 10 8)"/>
    </svg>
  ),

  grape: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <circle fill="currentColor" cx="12" cy="6" r="1"/>
      <circle fill="currentColor" cx="10" cy="8" r="1"/>
      <circle fill="currentColor" cx="14" cy="8" r="1"/>
      <circle fill="currentColor" cx="9" cy="10" r="1"/>
      <circle fill="currentColor" cx="12" cy="10" r="1"/>
      <circle fill="currentColor" cx="15" cy="10" r="1"/>
      <circle fill="currentColor" cx="10" cy="12" r="1"/>
      <circle fill="currentColor" cx="14" cy="12" r="1"/>
      <circle fill="currentColor" cx="11" cy="14" r="1"/>
      <circle fill="currentColor" cx="13" cy="14" r="1"/>
      <circle fill="currentColor" cx="12" cy="16" r="1"/>
      <path fill="currentColor" d="M12 2c-.5 0-1 .2-1.4.6l-1 1c-.2.2-.3.4-.3.7 0 .3.1.5.3.7l1 1c.4.4.9.6 1.4.6s1-.2 1.4-.6l1-1c.2-.2.3-.4.3-.7 0-.3-.1-.5-.3-.7l-1-1C13 2.2 12.5 2 12 2z"/>
    </svg>
  ),

  mushroom: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M12 2C7.6 2 4 5.6 4 10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2 0-4.4-3.6-8-8-8zm0 2c3.3 0 6 2.7 6 6H6c0-3.3 2.7-6 6-6z"/>
      <rect fill="currentColor" x="10" y="12" width="4" height="8" rx="1"/>
      <path fill="currentColor" d="M8 10.5c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5zm2-1c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5zm4 0c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5zm2 1c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5z"/>
    </svg>
  )
}

interface FloatingFood {
  id: number
  icon: keyof typeof FoodIcons
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
  color: string
}

const colors = [
  'text-red-400/20',      // tomatoes
  'text-green-400/20',    // broccoli, herbs
  'text-amber-400/20',    // bread, cheese
  'text-yellow-400/18',   // lemon, cheese
  'text-blue-400/15',     // fish
  'text-pink-400/20',     // strawberry
  'text-lime-400/18',     // lemon, herbs
  'text-orange-400/20',   // cheese, egg yolk
  'text-purple-400/18',   // grape
  'text-emerald-400/20',  // vegetables
]

export function AnimatedFoodBackground() {
  const [foods, setFoods] = useState<FloatingFood[]>([])

  useEffect(() => {
    const foodTypes = Object.keys(FoodIcons) as (keyof typeof FoodIcons)[]
    const initialFoods: FloatingFood[] = []

    // Generate random floating food items - VISIBLE FOR TESTING
    for (let i = 0; i < 8; i++) { // Fewer items for easier debugging
      initialFoods.push({
        id: i,
        icon: foodTypes[Math.floor(Math.random() * foodTypes.length)],
        x: 15 + (i * 10) % 70, // Spread them out evenly
        y: 15 + (i * 15) % 70,
        size: 50 + Math.random() * 30, // 50px to 80px - very large
        duration: 5 + Math.random() * 5, // 5s to 10s - very fast
        delay: i * 0.5, // Staggered start
        opacity: 0.8 + Math.random() * 0.2, // 0.8 to 1.0 opacity - very visible
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    setFoods(initialFoods)

    // Gentle organic movement - very slow and subtle
    const interval = setInterval(() => {
      setFoods(prevFoods => 
        prevFoods.map(food => ({
          ...food,
          x: Math.max(2, Math.min(98, food.x + (Math.random() - 0.5) * 1.2)), // Slightly more movement
          y: Math.max(2, Math.min(98, food.y + (Math.random() - 0.5) * 1.0)), // Stay within bounds
        }))
      )
    }, 12000) // Update every 12 seconds for very gentle movement

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* CSS Animations */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          33% { transform: translate(-50%, -50%) translateY(-10px) rotate(2deg); }
          66% { transform: translate(-50%, -50%) translateY(5px) rotate(-1deg); }
        }
        
        @keyframes floatMedium {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-15px) rotate(3deg); }
        }
        
        @keyframes driftHorizontal {
          0%, 100% { transform: translate(-50%, -50%) translateX(0px); }
          25% { transform: translate(-50%, -50%) translateX(10px); }
          75% { transform: translate(-50%, -50%) translateX(-8px); }
        }
        
        .animate-float-slow {
          animation: floatSlow var(--duration, 30s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
        }
        
        .animate-float-medium {
          animation: floatMedium var(--duration, 25s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
        }
        
        .animate-drift {
          animation: driftHorizontal var(--duration, 40s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1] bg-red-500 bg-opacity-20">        
        {/* Debug test element */}
        <div className="absolute top-4 left-4 w-48 h-24 bg-blue-500 bg-opacity-70 border-4 border-yellow-500 z-50 flex items-center justify-center">
          <span className="text-white font-bold text-lg">BACKGROUND TEST</span>
        </div>
        
        {foods.map((food, index) => {
          const IconComponent = FoodIcons[food.icon]
          const animationType = ['animate-float-slow', 'animate-float-medium', 'animate-drift'][index % 3]
          
          return (
            <div
              key={food.id}
              className={`absolute ${food.color} transition-all duration-[8000ms] ease-in-out ${animationType} border-4 border-red-500 bg-white bg-opacity-50`}
              style={{
                left: `${food.x}%`,
                top: `${food.y}%`,
                width: `${food.size}px`,
                height: `${food.size}px`,
                opacity: food.opacity,
                '--duration': `${food.duration}s`,
                '--delay': `${food.delay}s`,
              } as React.CSSProperties}
            >
              <IconComponent />
            </div>
          )
        })}
        
        {/* Additional subtle floating particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                backgroundColor: `rgba(${Math.random() > 0.5 ? '34, 197, 94' : '245, 158, 11'}, ${0.1 + Math.random() * 0.15})`,
                animationDuration: `${4 + Math.random() * 6}s`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
        
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/5 pointer-events-none" />
      </div>
    </>
  )
}
