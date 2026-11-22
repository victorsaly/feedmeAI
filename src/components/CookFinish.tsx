import { useState } from 'react'
import { Heart, ThumbsUp, Question, Check, ArrowCounterClockwise } from '@phosphor-icons/react'
import { useSessionToken } from '@/lib/account'
import type { Recipe } from '@/lib/kitchen'
import { MISSED, sendFeedback, type Missed } from '@/lib/feedback'
import { haptic } from '@/lib/native'

interface CookFinishProps {
  recipe: Recipe
  /** the last step's picture, or the dish, or the photo it was cooked from */
  picture?: string
  saved: boolean
  onSave: () => void
  /** back to the last step */
  onSteps: () => void
  onDone: () => void
}

/*
 * After the last step: a moment to keep the recipe, and to say how it went.
 * Both are one tap, and both can be skipped; the way out is always there.
 * "Something was missing" opens a short list of what, and a line for more.
 */
export function CookFinish({ recipe, picture, saved, onSave, onSteps, onDone }: CookFinishProps) {
  const token = useSessionToken()
  const [verdict, setVerdict] = useState<'good' | 'missed'>()
  const [missed, setMissed] = useState<Missed[]>([])
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'limit' | 'failed'>('idle')

  async function send(as: 'good' | 'missed') {
    setVerdict(as)
    setState('sending')
    const result = await sendFeedback(token, recipe, as, as === 'missed' ? missed : [], as === 'missed' ? note : '')
    setState(result === 'ok' ? 'sent' : result)
    if (result === 'ok') haptic('done')
  }

  const toggle = (id: Missed) => setMissed((cur) => (cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]))

  return (
    <main className="page cook-page cook-finish">
      {picture && <img className="cook-photo is-step" src={picture} alt="" />}
      <h2 className="finish-title">Done. Enjoy it.</h2>
      <p className="finish-sub">{recipe.title}</p>

      {saved ? (
        <p className="finish-saved" role="status"><Heart size={18} weight="fill" aria-hidden="true" /> Saved, in Recipes</p>
      ) : (
        <button type="button" className="btn btn-primary btn-xl" onClick={onSave}>
          <Heart size={20} weight="bold" /> Save this recipe
        </button>
      )}

      <section className="finish-feedback" aria-labelledby="finish-how">
        <h3 id="finish-how">How did it turn out?</h3>
        {state === 'sent' ? (
          <p className="finish-thanks" role="status">
            <Check size={18} weight="bold" aria-hidden="true" />
            {verdict === 'good' ? 'Thanks. Glad it worked.' : 'Thanks. A person reads every note.'}
          </p>
        ) : verdict === 'missed' ? (
          <form className="finish-missed" onSubmit={(e) => { e.preventDefault(); send('missed') }}>
            <fieldset>
              <legend>What was missing or off?</legend>
              <div className="finish-chips">
                {MISSED.map((m) => (
                  <label key={m.id} className={`finish-chip ${missed.includes(m.id) ? 'is-on' : ''}`}>
                    <input type="checkbox" id={`missed-${m.id}`} checked={missed.includes(m.id)} onChange={() => toggle(m.id)} />
                    {m.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="report-note" htmlFor="finish-note">
              <span>Tell us more <small>Optional</small></span>
              <textarea id="finish-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="It needed garlic, step 4 was too long…" />
            </label>
            {state === 'failed' && <p className="report-error" role="alert">That didn’t send. Check the connection and try again.</p>}
            {state === 'limit' && <p className="report-error" role="alert">That’s as many notes as we take from one person in a day. Thank you.</p>}
            <div className="report-actions">
              <button type="button" className="btn btn-quiet" onClick={() => { setVerdict(undefined); setState('idle') }}>Cancel</button>
              <button type="submit" className="btn btn-quiet report-send" disabled={(!missed.length && !note.trim()) || state === 'sending' || state === 'limit'}>
                {state === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="finish-verdicts">
              <button type="button" className="btn btn-quiet" onClick={() => send('good')} disabled={state === 'sending'}>
                <ThumbsUp size={20} weight="bold" /> It was good
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => { setVerdict('missed'); setState('idle') }}>
                <Question size={20} weight="bold" /> Something was missing
              </button>
            </div>
            {state === 'failed' && <p className="report-error" role="alert">That didn’t send. Check the connection and try again.</p>}
          </>
        )}
      </section>

      <div className="finish-out">
        <button type="button" className="btn btn-ghost" onClick={onSteps}><ArrowCounterClockwise size={18} weight="bold" /> Back to the steps</button>
        <button type="button" className="btn btn-quiet" onClick={onDone}>Finish</button>
      </div>
    </main>
  )
}
