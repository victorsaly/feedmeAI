import { useState } from 'react'
import { X, Plus, PencilSimple, Check } from '@phosphor-icons/react'
import type { Ingredient } from '@/lib/kitchen'

interface HaulListProps {
  photo?: string
  items: Ingredient[]
  onChange: (items: Ingredient[]) => void
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

/** how many magnets show before the door is opened for editing */
const FOLDED = 5

/*
 * The photo is the fridge door, and what was read in it is stuck on as
 * magnets along its lower edge. Folded, that is a handful of names and a
 * count, so dinner sits right under it. "Edit" opens the door: every magnet,
 * each with its rough amount to correct and a way to pull it off, and a
 * place to add what was missed. Anything the model was under 70% sure of
 * says so rather than being hidden.
 */
export function HaulList({ photo, items, onChange }: HaulListProps) {
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const open = editing || items.length === 0
  const title = items.length === 0 ? 'Nothing spotted' : `${items.length} thing${items.length === 1 ? '' : 's'} in`
  const hidden = Math.max(0, items.length - FOLDED)

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
    <section aria-labelledby="haul-title" className={`haul ${photo ? 'has-photo' : ''}`}>
      <header className="haul-hero">
        {photo && <img src={photo} alt="The photo you took" />}
        <h1 id="haul-title">{title}</h1>
      </header>

      {!open ? (
        <ul className="door is-folded">
          {items.slice(0, FOLDED).map((item, n) => (
            <li key={item.name} className="magnet" style={{ animationDelay: `${n * 40}ms` }}>
              <span className="magnet-name">{item.name}</span>
            </li>
          ))}
          <li className="door-edit">
            <button type="button" className="magnet magnet-edit" onClick={() => setEditing(true)}>
              <PencilSimple size={15} weight="bold" aria-hidden="true" />
              {hidden > 0 ? `${hidden} more, edit` : 'Edit'}
            </button>
          </li>
        </ul>
      ) : (
        <div className="door-open">
          <p className="door-hint">
            {items.length === 0 ? 'Add what you have, or take the photo again.' : 'Pull off anything wrong, add anything missed. Tap an amount to change it.'}
          </p>
          <ul className="door">
            {items.map((item) => {
              const unsure = item.confidence !== undefined && item.confidence < 0.7
              return (
                <li key={item.name} className={`magnet is-full ${unsure ? 'is-unsure' : ''}`}>
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
                    <X size={16} weight="bold" />
                  </button>
                </li>
              )
            })}
            <li className="magnet-add">
              <input
                id="add-ingredient"
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
          {items.length > 0 && (
            <button type="button" className="btn btn-quiet door-done" onClick={() => setEditing(false)}>
              <Check size={18} weight="bold" /> Done
            </button>
          )}
        </div>
      )}
    </section>
  )
}
