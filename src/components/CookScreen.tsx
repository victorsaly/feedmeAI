import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CaretLeft, CaretRight, Check, Timer, Sun, Heart, ImageSquare } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Recipe } from '@/lib/kitchen'
import { forStep, timeIn } from '@/lib/pantry'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { cancelRing, haptic, ringAt } from '@/lib/native'
import { useSave } from '@/hooks/use-save'
import { useSessionToken } from '@/lib/account'
import { PlanLimit } from '@/lib/plan'
import { isIllustrated, stepPicture } from '@/lib/steps'
import { CookFinish } from '@/components/CookFinish'

interface CookScreenProps {
  recipe: Recipe
  /** the food this is being cooked from: the dish, or the photo you took */
  photo?: string
  /** the recipe again, each time it gains something worth keeping (a step picture) */
  onRecipe?: (recipe: Recipe) => void
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
export function CookScreen({ recipe, photo, onRecipe, onBack, onDone }: CookScreenProps) {
  const steps = recipe.instructions
  const [n, setN] = useState(0)
  const last = n === steps.length - 1
  const awake = useWakeLock()
  const token = useSessionToken()
  const { saved, toggle } = useSave(recipe)

  /* Step pictures. Asked for only on a tap (each new recipe uses some of the
     allowance), then made one step at a time, the step on screen first, and
     kept with the recipe. A recipe that already has some carries on. */
  const [pics, setPics] = useState<(string | null)[]>(() => recipe.stepImages ?? [])
  const [drawing, setDrawing] = useState(isIllustrated(recipe))
  const [waiting, setWaiting] = useState<number | null>(null)
  const report = useRef(onRecipe)
  report.current = onRecipe
  const at = useRef(n)
  at.current = n
  useEffect(() => {
    if (!drawing) return
    let live = true
    ;(async () => {
      const got = [...pics]
      while (live) {
        // the step on screen, else the next one without a picture
        const order = [at.current, ...steps.map((_, i) => i).filter((i) => i > at.current), ...steps.map((_, i) => i).filter((i) => i < at.current)]
        const next = order.find((i) => got[i] === undefined)
        if (next === undefined) break
        setWaiting(next)
        try {
          got[next] = await stepPicture(token, recipe, next)
        } catch (err) {
          if (err instanceof PlanLimit) toast(err.message)
          setDrawing(false)
          break
        }
        if (!live) break
        setPics([...got])
        report.current?.({ ...recipe, stepImages: [...got] })
      }
      if (live) setWaiting(null)
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per tap, works from what it has
  }, [drawing])
  const pic = pics[n]
  const [finished, setFinished] = useState(false)
  const withPictures = () => ({ ...recipe, stepImages: pics.length ? pics : recipe.stepImages })

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
  useEffect(() => { if (rung) { navigator.vibrate?.([200, 100, 200]); haptic('alarm') } }, [rung])
  // leaving the cooking screen takes its timer with it
  useEffect(() => () => { cancelRing() }, [])

  function startTimer(seconds: number) {
    const ends = Date.now() + seconds * 1000
    setNow(Date.now())
    setTimer({ step: n, ends })
    ringAt(new Date(ends), 'Timer done', `${recipe.title}: step ${n + 1}`)
  }
  function stopTimer() {
    setTimer(null)
    cancelRing()
  }

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
        <div className="cook-actions">
          {timer && !mine && (
            <button type="button" className={`cook-chip ${rung ? 'is-rung' : ''}`} onClick={() => setN(timer.step)} aria-label={`Timer from step ${timer.step + 1}`}>
              <Timer size={16} weight="bold" /> {rung ? 'Done' : clock(left)}
            </button>
          )}
          <button
            type="button"
            className={`cook-chip cook-save ${saved ? 'is-saved' : ''}`}
            onClick={() => toggle(withPictures())}
            aria-pressed={saved}
          >
            <Heart size={16} weight={saved ? 'fill' : 'bold'} /> {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </header>

      {finished ? (
        <CookFinish
          recipe={recipe}
          picture={pics[steps.length - 1] ?? photo}
          saved={saved}
          onSave={() => toggle(withPictures())}
          onSteps={() => setFinished(false)}
          onDone={onDone}
        />
      ) : (
      <>
      <main className="page cook-page">
        <figure className="cook-picture">
          {pic
            ? <img className="cook-photo is-step" src={pic} alt={`Step ${n + 1}: ${steps[n]}`} key={pic} />
            : photo && <img className="cook-photo" src={photo} alt="" />}
          {!pic && drawing && waiting !== null && (
            <figcaption className="cook-drawing" role="status">{waiting === n ? 'Drawing this step…' : `Drawing step ${waiting + 1}…`}</figcaption>
          )}
          {!pic && !drawing && (
            <button type="button" className="cook-draw" onClick={() => setDrawing(true)}>
              <ImageSquare size={18} weight="bold" /> Picture each step
            </button>
          )}
        </figure>
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
              <button type="button" className="btn btn-quiet" onClick={stopTimer}>{rung ? 'Clear' : 'Stop'}</button>
            ) : (
              <button type="button" className="btn btn-quiet" onClick={() => startTimer(seconds)}>
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
          <button type="button" className="btn btn-primary" onClick={() => { cancelRing(); setFinished(true); window.scrollTo({ top: 0 }) }}>
            <Check size={20} weight="bold" /> Done
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setN(n + 1)}>
            Next <CaretRight size={20} weight="bold" />
          </button>
        )}
      </div>
      </>
      )}
    </div>
  )
}
