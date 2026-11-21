import { useEffect, useState } from 'react'
import { Plus, Trash, Check, Storefront, ArrowSquareOut, Export, CaretDown } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { signIn, useSessionToken } from '@/lib/account'
import { addItem, checkItem, removeItem, syncList, useList, type Item } from '@/lib/list'
import { nameOf } from '@/lib/pantry'
import { DEVICE } from '@/lib/device'
import { COMPARE_CAP, COUNTRIES, compareShops, loadCountry, type Comparison } from '@/lib/shopping'

/** "2 tablespoons soy sauce" → what to look for on the shelf: "Soy sauce" */
function shelfName(line: string): string {
  const name = nameOf(line) || line
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const money = (n: number, c: string) => `${c}${n.toFixed(2)}`

/**
 * The shopping list, made to be read in an aisle: what to look for is the
 * line, the amount and the recipe sit under it, and the whole row ticks it
 * off. It lives on this device, so it opens with no signal and no account;
 * signing in sends it to your other devices. Shop prices are a search that
 * costs money, so they wait for a tap, and need an account.
 */
export function ListTab({ onAccount }: { onAccount: () => void }) {
  const token = useSessionToken()
  const items = useList()
  const [draft, setDraft] = useState('')
  const [compare, setCompare] = useState<{ state: 'loading' } | { state: 'ready'; result: Comparison; of: string[]; at: Date } | null>(null)
  const [allShops, setAllShops] = useState(false)
  const country = loadCountry() ?? 'gb'
  const countryName = COUNTRIES.find((c) => c.code === country)?.label ?? country.toUpperCase()

  useEffect(() => { syncList(token) }, [token])

  const open = items.filter((t) => !t.checked)
  const done = items.filter((t) => t.checked)
  const names = open.map((t) => shelfName(t.ingredient))
  const fresh = compare?.state === 'ready' && compare.of.join('\n') === names.slice(0, COMPARE_CAP).join('\n')
  const best = compare?.state === 'ready' ? compare.result.groups[0] : undefined
  /** what the cheapest shop charges for each thing, by its shelf name */
  const prices = new Map(fresh && best ? best.lines.map((l) => [l.ingredient, l.item.price]) : [])

  async function runCompare() {
    if (!token) { signIn(); return }
    const of = names.slice(0, COMPARE_CAP)
    setCompare({ state: 'loading' })
    setCompare({ state: 'ready', result: await compareShops(token, of, country), of, at: new Date() })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const ingredient = draft.trim()
    if (!ingredient) return
    setDraft('')
    addItem(token, ingredient)
  }

  function remove(item: Item) {
    removeItem(token, item.id)
    toast(`Removed ${shelfName(item.ingredient)}`, {
      action: { label: 'Undo', onClick: () => { addItem(token, item.ingredient, item.recipeId && item.recipeName ? { id: item.recipeId, name: item.recipeName } : undefined) } },
    })
  }

  async function share() {
    const text = open.map((t) => `• ${shelfName(t.ingredient)}${nameOf(t.ingredient) && nameOf(t.ingredient) !== t.ingredient.toLowerCase() ? ` (${t.ingredient})` : ''}`).join('\n')
    try {
      if (navigator.share) await navigator.share({ title: 'Shopping list', text })
      else { await navigator.clipboard.writeText(text); toast.success('List copied') }
    } catch {
      // closed the share sheet: nothing to say
    }
  }

  const row = (t: Item) => {
    const name = shelfName(t.ingredient)
    const full = t.ingredient.toLowerCase() !== name.toLowerCase() ? t.ingredient : null
    const price = prices.get(name)
    return (
      <li key={t.id} className={`list-item ${t.checked ? 'is-checked' : ''}`}>
        <button type="button" className="list-tick" onClick={() => checkItem(token, t.id, !t.checked)} aria-pressed={t.checked}>
          <span className="list-box" aria-hidden="true">{t.checked && <Check size={16} weight="bold" />}</span>
          <span className="list-item-main">
            <span className="list-item-name">{name}</span>
            {full && <span className="list-item-recipe">{full}</span>}
            {t.recipeName && <span className="list-item-recipe">for {t.recipeName}</span>}
          </span>
          {price && <span className="list-price">{price}</span>}
        </button>
        <button type="button" className="list-remove" onClick={() => remove(t)} aria-label={`Remove ${name}`}>
          <Trash size={18} />
        </button>
      </li>
    )
  }

  return (
    <>
      <section className="hero hero-tab list-head">
        <div>
          <h1>List</h1>
          <p>{token ? `On this ${DEVICE} and your account.` : `Kept on this ${DEVICE}. Works with no signal.`}</p>
        </div>
        {open.length > 0 && (
          <button type="button" className="btn btn-quiet" onClick={share}>
            <Export size={18} weight="bold" /> Share
          </button>
        )}
      </section>

      <form className="magnet-add list-add" onSubmit={submit}>
        <input
          id="list-add"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an item"
          aria-label="Add an item"
          enterKeyHint="done"
          autoCapitalize="sentences"
        />
        <button type="submit" className="magnet-plus" disabled={!draft.trim()} aria-label="Add">
          <Plus size={18} weight="bold" />
        </button>
      </form>

      {items.length === 0 && (
        <div className="ideas-empty">
          <p>Nothing to buy yet. Open a recipe and tap “Add to the list”, or type something above.</p>
        </div>
      )}

      {open.length > 0 && (
        <section aria-label="Shop prices" className="shops">
          {fresh && best ? (
            <div className="shops-best">
              <div className="shops-lead">
                <b>
                  {best.lines.length === compare.result.searched ? `${best.label} is cheapest` : `${best.label} has ${best.lines.length} of ${compare.result.searched}`}
                </b>
                {best.total !== null && (
                  <span className="shops-total">
                    {money(best.total, best.currency)}
                    <small>{best.lines.length === 1 ? 'for it' : best.lines.length === 2 ? 'for both' : `for ${best.lines.length}`}</small>
                  </span>
                )}
                {best.link && (
                  <a className="btn btn-small" href={best.link} target="_blank" rel="noopener noreferrer">
                    Open <ArrowSquareOut size={14} />
                  </a>
                )}
              </div>
              {compare.result.groups.length > 1 && (
                <>
                  <button type="button" className="shops-more" onClick={() => setAllShops((v) => !v)} aria-expanded={allShops}>
                    <span>{allShops ? 'Every shop with a listing' : compare.result.groups.slice(1).filter((g) => g.lines.length === compare.result.searched).slice(0, 2).map((g) => `${g.label}${g.total !== null ? ` ${money(g.total, g.currency)}` : ''}`).join(' · ') || 'Other shops'}</span>
                    <span className="shops-toggle">{allShops ? 'Hide' : 'All shops'} <CaretDown size={14} weight="bold" /></span>
                  </button>
                  {allShops && (
                    <ul className="shops-all">
                      {compare.result.groups.map((g) => (
                        <li key={g.label}>
                          <span className="shops-all-name">{g.label}{g.lines.length < compare.result.searched && <small>only {g.lines.length} of {compare.result.searched}</small>}</span>
                          <span className={`list-price ${g.lines.length < compare.result.searched ? 'is-partial' : ''}`}>{g.total !== null ? money(g.total, g.currency) : '—'}</span>
                          {g.link && <a className="btn btn-small" href={g.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${g.label}`}><ArrowSquareOut size={14} /></a>}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              <p className="shops-foot in">
                Shop listings for {countryName}, checked at {compare.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Prices can change before you get there.
                {compare.result.unfound.length > 0 && ` Nothing found for ${compare.result.unfound.join(', ')}.`}
              </p>
            </div>
          ) : fresh ? (
            <div className="ideas-empty"><p>No shop in {countryName} lists any of these.</p></div>
          ) : (
            <div className="shops-ask">
              <button type="button" className="btn btn-quiet" onClick={runCompare} disabled={compare?.state === 'loading'}>
                <Storefront size={18} />
                {compare?.state === 'loading'
                  ? `Checking ${Math.min(open.length, COMPARE_CAP)} ${open.length === 1 ? 'item' : 'items'}…`
                  : !token ? 'Sign in to compare shop prices'
                  : compare ? 'List changed. Compare again' : 'Find the cheapest shop'}
              </button>
              <button type="button" className="shops-country" onClick={onAccount}>Prices for {countryName}{country !== 'gb' && ' (untested)'}</button>
            </div>
          )}
          {open.length > COMPARE_CAP && <p className="shops-foot">The first {COMPARE_CAP} items only, to keep it quick.</p>}
        </section>
      )}

      {open.length > 0 && (
        <>
          <p className="label">To buy · {open.length}</p>
          <ul className="list-items">{open.map(row)}</ul>
        </>
      )}
      {done.length > 0 && (
        <>
          <p className="label">Got it · {done.length}</p>
          <ul className="list-items">{done.map(row)}</ul>
        </>
      )}
    </>
  )
}
