import { useState } from 'react'
import { Flag, Check } from '@phosphor-icons/react'
import { useSessionToken } from '@/lib/account'
import type { Recipe, Source } from '@/lib/kitchen'
import { REASONS, sendReport, type Reason } from '@/lib/report'

/*
 * At the foot of every recipe: a quiet way to say it is unsafe or wrong.
 * It opens in place rather than over the recipe, because the person
 * reporting usually wants to look at the line they are reporting.
 */
export function ReportRecipe({ recipe, source }: { recipe: Recipe; source?: Source }) {
  const token = useSessionToken()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<Reason>()
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'limit' | 'failed'>('idle')

  async function send() {
    if (!reason) return
    setState('sending')
    const result = await sendReport(token, recipe, source, reason, note)
    setState(result === 'ok' ? 'sent' : result)
  }

  if (state === 'sent') {
    return <p className="report-done" role="status"><Check size={16} weight="bold" aria-hidden="true" /> Reported. Thank you: a person will read it.</p>
  }

  if (!open) {
    return (
      <button type="button" className="report-open" onClick={() => setOpen(true)}>
        <Flag size={16} aria-hidden="true" /> Report this recipe
      </button>
    )
  }

  return (
    <form className="report" onSubmit={(e) => { e.preventDefault(); send() }} aria-labelledby="report-title">
      <h3 id="report-title">Report this recipe</h3>
      <fieldset className="report-reasons">
        <legend className="sr-only">What is wrong with it?</legend>
        {REASONS.map((r) => (
          <label key={r.id} className={`report-reason ${reason === r.id ? 'is-on' : ''}`}>
            <input type="radio" name="report-reason" id={`report-${r.id}`} value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
            <span>
              <b>{r.label}</b>
              {r.hint && <small>{r.hint}</small>}
            </span>
          </label>
        ))}
      </fieldset>
      <label className="report-note" htmlFor="report-note">
        <span>Anything to add? <small>Optional</small></span>
        <textarea id="report-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Which step or ingredient, and what is wrong with it" />
      </label>
      {state === 'failed' && <p className="report-error" role="alert">That didn’t send. Check the connection and try again.</p>}
      {state === 'limit' && <p className="report-error" role="alert">That is as many reports as we take from one person in a day. Thank you; try again tomorrow.</p>}
      <div className="report-actions">
        <button type="button" className="btn btn-quiet" onClick={() => { setOpen(false); setState('idle') }}>Cancel</button>
        <button type="submit" className="btn btn-quiet report-send" disabled={!reason || state === 'sending' || state === 'limit'}>
          {state === 'sending' ? 'Sending…' : 'Send report'}
        </button>
      </div>
      <p className="report-foot">We keep the recipe as shown, your reason and your note. Not your photo.</p>
    </form>
  )
}
