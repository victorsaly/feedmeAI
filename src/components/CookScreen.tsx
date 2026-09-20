import { useEffect, useState } from 'react'
import { ArrowLeft, CaretLeft, CaretRight, Check } from '@phosphor-icons/react'
import type { Recipe } from '@/lib/kitchen'

interface CookScreenProps {
  recipe: Recipe
  onBack: () => void
  onDone: () => void
}

/*
 * Cooking: one step at a time, in type you can read from across the hob.
 * The whole recipe is one tap away in the bar; ← → step, and the last
 * step's Next is Done. Keyboard arrows work too, without animation.
 */
export function CookScreen({ recipe, onBack, onDone }: CookScreenProps) {
  const steps = recipe.instructions
  const [n, setN] = useState(0)
  const last = n === steps.length - 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !last) setN((i) => i + 1)
      if (e.key === 'ArrowLeft' && n > 0) setN((i) => i - 1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [n, last])

  return (
    <div className="app cook">
      <header className="top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={18} weight="bold" /> Recipe
        </button>
        <h1 className="top-title">{recipe.title}</h1>
        <span className="top-spacer" aria-hidden="true" />
      </header>

      <main className="page cook-page" aria-live="polite">
        <ol className="cook-dots" aria-label={`Step ${n + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <li key={i} className={i < n ? 'done' : i === n ? 'now' : ''} aria-hidden="true" />
          ))}
        </ol>
        <p className="cook-count">Step {n + 1} of {steps.length}</p>
        <p className="cook-step" key={n}>{steps[n]}</p>
      </main>

      <div className="cook-bar">
        <button type="button" className="btn btn-quiet" onClick={() => setN(n - 1)} disabled={n === 0} aria-label="Previous step">
          <CaretLeft size={20} weight="bold" />
        </button>
        {last ? (
          <button type="button" className="btn btn-primary" onClick={onDone}>
            <Check size={20} weight="bold" /> Done
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setN(n + 1)}>
            Next <CaretRight size={20} weight="bold" />
          </button>
        )}
      </div>
    </div>
  )
}
