import { useState } from 'react'
import { X, Plus } from '@phosphor-icons/react'
import type { Ingredient } from '@/lib/kitchen'

interface HaulListProps {
  photo?: string
  items: Ingredient[]
  onChange: (items: Ingredient[]) => void
  onRetake: () => void
}

/** A short, rough vocabulary — tapping the amount cycles through these,
 *  landing on the first one from anywhere (the AI's own free-text guess
 *  included), then clears. Ideas are drafted from whatever's set here, so
 *  correcting it is how you tell the kitchen "that's not much chicken". */
const AMOUNTS = ['a little', 'some', 'plenty'] as const
function nextAmount(current?: string): string | undefined {
  const i = AMOUNTS.indexOf(current as (typeof AMOUNTS)[number])
  if (i === -1) return AMOUNTS[0]
  if (i === AMOUNTS.length - 1) return undefined
  return AMOUNTS[i + 1]
}

/*
 * What you've got, stuck to the door as magnets. The model is usually right
 * and occasionally guesses, so anything under 70% gets an amber magnet and
 * the words "not sure" rather than being hidden; a missed item is one tap
 * to add, and a wrong one is one tap to pull off. Each also carries a rough
 * amount — tap it to correct how much you actually have.
 */
export function HaulList({ photo, items, onChange, onRetake }: HaulListProps) {
  const [draft, setDraft] = useState('')

  function cycleAmount(name: string) {
    onChange(items.map((i) => (i.name === name ? { ...i, amount: nextAmount(i.amount) } : i)))
  }

  function add() {
    const name = draft.trim().toLowerCase()
    if (!name) return
    if (!items.some((i) => i.name === name)) onChange([...items, { name }])
    setDraft('')
  }

  return (
    <section aria-labelledby="haul-title">
      <header className="haul-head">
        {photo && (
          <button type="button" className="haul-photo" onClick={onRetake} aria-label="Retake the photo">
            <img src={photo} alt="" />
          </button>
        )}
        <div>
          <h1 id="haul-title">
            {items.length === 0 ? 'Nothing spotted' : `${items.length} thing${items.length === 1 ? '' : 's'} in`}
          </h1>
          <p className="haul-sub">
            {items.length === 0 ? 'Add what you have, or retake the photo.' : 'Pull off anything wrong, add anything missed.'}
          </p>
        </div>
      </header>

      <p className="label">On the door</p>
      <ul className="door">
        {items.map((item, n) => {
          const unsure = item.confidence !== undefined && item.confidence < 0.7
          return (
            <li key={item.name} className={`magnet ${unsure ? 'is-unsure' : ''}`} style={{ animationDelay: `${n * 40}ms` }}>
              <span className="magnet-dot" aria-hidden="true" />
              <span className="magnet-name">{item.name}</span>
              <button
                type="button"
                className={`magnet-amount ${item.amount ? '' : 'magnet-amount-unset'}`}
                onClick={() => cycleAmount(item.name)}
                aria-label={`How much ${item.name}: ${item.amount ?? 'not set'}. Tap to change.`}
              >
                {item.amount ?? '+ amount'}
              </button>
              {unsure && <span className="magnet-unsure">not sure</span>}
              <button
                type="button"
                className="magnet-remove"
                aria-label={`Remove ${item.name}`}
                onClick={() => onChange(items.filter((i) => i.name !== item.name))}
              >
                <X size={14} weight="bold" />
              </button>
            </li>
          )
        })}
        <li className="magnet-add">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="done"
            placeholder="Add something"
            aria-label="Add an ingredient"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          />
          <button type="button" className="magnet-plus" onClick={add} disabled={!draft.trim()} aria-label="Add">
            <Plus size={18} weight="bold" />
          </button>
        </li>
      </ul>
    </section>
  )
}
