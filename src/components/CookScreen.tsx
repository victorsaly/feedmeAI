import { useEffect, useState } from 'react'
import { ArrowLeft, CaretLeft, CaretRight, Check, Timer, Sun } from '@phosphor-icons/react'
import type { Recipe } from '@/lib/kitchen'
import { forStep, timeIn } from '@/lib/pantry'
import { useWakeLock } from '@/hooks/use-wake-lock'

interface CookScreenProps {
  recipe: Recipe
  /** the food this is being cooked from: the dish, or the photo you took */
  photo?: string
  onBack: () => void
  onDone: () => void
}

/** 754 → "12:34" */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/*
 * Cooking: one step at a time, in type you can read from across the hob,
 * with the amounts that step needs under it so nobody goes back to the
 * recipe with wet hands. A step that names a time offers a timer, which
 * keeps running as you move on. The screen stays awake until you leave.
 * ← → step, and the last step's Next is Done.
 */
export function CookScreen({ recipe, photo, onBack, onDone }: CookScreenProps) {
  const steps = recipe.instructions
  const [n, setN] = useState(0)
  const last = n === steps.length - 1
  const awake = useWakeLock()

  // one timer for the recipe: which step set it, and when it ends
  const [timer, setTimer] = useState<{ step: number; ends: number } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!timer) return
    const tick = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(tick)
  }, [timer])
  const left = timer ? Math.max(0, Math.ceil((timer.ends - now) / 1000)) : 0
  const rung = Boolean(timer) && left === 0
  useEffect(() => { if (rung) navigator.vibrate?.([200, 100, 200]) }, [rung])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !last) setN((i) => i + 1)
      if (e.key === 'ArrowLeft' && n > 0) setN((i) => i - 1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [n, last])

  const needs = forStep(steps[n], recipe.ingredients)
  const seconds = timeIn(steps[n])
  const mine = timer?.step === n

  return (
    <div className="app cook">
      <header className="top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={18} weight="bold" /> Recipe
        </button>
        <h1 className="top-title">{recipe.title}</h1>
        {timer && !mine ? (
          <button type="button" className={`cook-chip ${rung ? 'is-rung' : ''}`} onClick={() => setN(timer.step)} aria-label={`Timer from step ${timer.step + 1}`}>
            <Timer size={16} weight="bold" /> {rung ? 'Done' : clock(left)}
          </button>
        ) : (
          <span className="top-spacer" aria-hidden="true" />
        )}
      </header>

      <main className="page cook-page">
        {photo && <img className="cook-photo" src={photo} alt="" />}
        <div className="cook-progress">
          <ol className="cook-dots" aria-hidden="true">
            {steps.map((_, i) => <li key={i} className={i < n ? 'done' : i === n ? 'now' : ''} />)}
          </ol>
          <span className="cook-count" aria-hidden="true">{n + 1} of {steps.length}</span>
        </div>
        <div aria-live="polite">
          <span className="sr-only">Step {n + 1} of {steps.length}. </span>
          <p className={`cook-step ${steps[n].length < 60 ? 'is-short' : steps[n].length < 110 ? 'is-mid' : ''}`} key={n}>{steps[n]}</p>
        </div>

        <div className="cook-tools">
        {needs.length > 0 && (
          <ul className="cook-needs" aria-label="For this step">
            {needs.map((line) => <li key={line} className="magnet">{line}</li>)}
          </ul>
        )}

        {seconds !== null && (
          <div className={`cook-timer ${mine && rung ? 'is-rung' : ''}`} role="timer">
            <span className="cook-timer-time">{mine ? (rung ? "Time's up" : clock(left)) : clock(seconds)}</span>
            {mine ? (
              <button type="button" className="btn btn-quiet" onClick={() => setTimer(null)}>{rung ? 'Clear' : 'Stop'}</button>
            ) : (
              <button type="button" className="btn btn-quiet" onClick={() => { setNow(Date.now()); setTimer({ step: n, ends: Date.now() + seconds * 1000 }) }}>
                <Timer size={18} weight="bold" /> Start timer
              </button>
            )}
          </div>
        )}

        </div>

        {awake && <p className="cook-awake"><Sun size={14} weight="bold" aria-hidden="true" /> Screen stays on while you cook</p>}
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
