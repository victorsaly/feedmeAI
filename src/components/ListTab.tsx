import { useEffect, useState } from 'react'
import { Plus, Trash, MagnifyingGlass, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { signIn, useSessionToken } from '@/lib/account'
import { addTodo, listTodos, removeTodo, setTodoChecked, type Todo } from '@/lib/todos'
import { COUNTRIES, loadCountry, saveCountry, searchShopping, type ShoppingResult } from '@/lib/shopping'

/**
 * The shopping list: what "Add to list" on a recipe sends items to, plus
 * anything typed in here directly. Kept under the signed-in account, so
 * it's the same list on the phone that took the fridge photo and the
 * laptop doing the shop.
 */
export function ListTab() {
  const token = useSessionToken()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [country, setCountry] = useState(() => loadCountry() ?? 'gb')
  const [shopping, setShopping] = useState<{ id: string; results: ShoppingResult[] } | null>(null)

  useEffect(() => {
    if (!token) { setTodos([]); return }
    let live = true
    setLoading(true)
    listTodos(token).then((t) => { if (live) { setTodos(t); setLoading(false) } })
    return () => { live = false }
  }, [token])

  function changeCountry(code: string) {
    setCountry(code)
    saveCountry(code)
    setShopping(null)
  }

  async function submitDraft(e: React.FormEvent) {
    e.preventDefault()
    const ingredient = draft.trim()
    if (!ingredient || !token) return
    setDraft('')
    const created = await addTodo(token, ingredient)
    if (created) setTodos((prev) => [created, ...prev])
    else toast.error("Couldn't add that. Try again.")
  }

  async function toggle(todo: Todo) {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, checked: !t.checked } : t)))
    if (token) await setTodoChecked(token, todo.id, !todo.checked)
  }

  async function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    if (shopping?.id === id) setShopping(null)
    if (token) await removeTodo(token, id)
  }

  async function findIt(todo: Todo) {
    if (!token) return
    if (shopping?.id === todo.id) { setShopping(null); return }
    setShopping({ id: todo.id, results: [] })
    const results = await searchShopping(token, todo.ingredient, country)
    setShopping((cur) => (cur?.id === todo.id ? { id: todo.id, results } : cur))
  }

  if (!token) {
    return (
      <>
        <section className="hero hero-tab">
          <h1>List</h1>
          <p>Missing ingredients, kept in one place and findable near you.</p>
        </section>
        <div className="ideas-empty">
          <p>Sign in to keep a shopping list — it follows your account, not this device.</p>
          <button type="button" className="btn btn-primary" onClick={signIn}>Sign in</button>
        </div>
      </>
    )
  }

  const open = todos.filter((t) => !t.checked)
  const done = todos.filter((t) => t.checked)

  return (
    <>
      <section className="hero hero-tab">
        <h1>List</h1>
        <p>Add missing ingredients from any recipe, or type your own.</p>
      </section>

      <div className="list-toolbar">
        <form className="magnet-add" onSubmit={submitDraft}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add an item"
            aria-label="Add an item"
          />
          <button type="submit" className="magnet-plus" disabled={!draft.trim()}>
            <Plus size={18} weight="bold" />
          </button>
        </form>
        <select
          className="list-country"
          value={country}
          onChange={(e) => changeCountry(e.target.value)}
          aria-label="Country for shopping search"
        >
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="label-note">Loading…</p>
      ) : todos.length === 0 ? (
        <div className="ideas-empty"><p>Nothing on the list yet.</p></div>
      ) : (
        <>
          {open.length > 0 && (
            <ul className="list-items">
              {open.map((t) => (
                <ListItem key={t.id} todo={t} shopping={shopping} onToggle={toggle} onRemove={remove} onFind={findIt} />
              ))}
            </ul>
          )}
          {done.length > 0 && (
            <>
              <p className="label">Got it</p>
              <ul className="list-items">
                {done.map((t) => (
                  <ListItem key={t.id} todo={t} shopping={shopping} onToggle={toggle} onRemove={remove} onFind={findIt} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </>
  )
}

function ListItem({ todo, shopping, onToggle, onRemove, onFind }: {
  todo: Todo
  shopping: { id: string; results: ShoppingResult[] } | null
  onToggle: (t: Todo) => void
  onRemove: (id: string) => void
  onFind: (t: Todo) => void
}) {
  const searching = shopping?.id === todo.id
  return (
    <li className={`list-item ${todo.checked ? 'is-checked' : ''}`}>
      <div className="list-item-row">
        <button type="button" className="list-check" onClick={() => onToggle(todo)} aria-pressed={todo.checked}>
          <span className="magnet-dot" aria-hidden="true" />
        </button>
        <div className="list-item-main">
          <span className="list-item-name">{todo.ingredient}</span>
          {todo.recipeName && <span className="list-item-recipe">for {todo.recipeName}</span>}
        </div>
        {!todo.checked && (
          <button type="button" className="magnet-remove" onClick={() => onFind(todo)} aria-label={`Find ${todo.ingredient} to buy`}>
            {searching ? <X size={16} /> : <MagnifyingGlass size={16} />}
          </button>
        )}
        <button type="button" className="magnet-remove" onClick={() => onRemove(todo.id)} aria-label={`Remove ${todo.ingredient}`}>
          <Trash size={16} />
        </button>
      </div>
      {searching && (
        <div className="list-shopping">
          {shopping.results.length === 0 ? (
            <p className="label-note">Searching…</p>
          ) : (
            shopping.results.map((r, i) => (
              <a key={i} className="list-shopping-item" href={r.link ?? undefined} target="_blank" rel="noopener noreferrer">
                {r.thumbnail && <img src={r.thumbnail} alt="" />}
                <span className="list-shopping-title">{r.title}</span>
                <span className="list-shopping-meta">{[r.source, r.price].filter(Boolean).join(' · ')}</span>
              </a>
            ))
          )}
        </div>
      )}
    </li>
  )
}
