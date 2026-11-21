import { useEffect, useState } from 'react'
import { MagnifyingGlass, X, ClockCounterClockwise, Trash } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { loadSearches, saveSearch, removeSearch, type Search } from '@/lib/history'
import { MealPicker } from '@/components/MealPicker'
import { IdeaList } from '@/components/IdeaList'
import { IdeaGrid } from '@/components/IdeaGrid'
import { SavedList } from '@/components/SavedList'
import { useFavorites } from '@/lib/favorites'
import { canSignIn, signIn, useSessionToken } from '@/lib/account'
import { searchRecipes } from '@/lib/spoonacular'
import { CATEGORIES, localSearch, recipesForMeal, ideaFromLocal, type Category, type Idea, type Meal } from '@/lib/kitchen'

interface RecipesTabProps {
  meal: Meal
  onMeal: (meal: Meal) => void
  onOpen: (idea: Idea) => void
}

/*
 * Browse or search. Nothing typed and no chip: the built-ins for the meal,
 * as before. Anything else: the built-ins that fit, then — signed in —
 * what Spoonacular has for it. Results are remembered per search for the
 * session so flicking between chips is instant and costs nothing twice.
 */
export function RecipesTab({ meal, onMeal, onOpen }: RecipesTabProps) {
  const token = useSessionToken()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<Category>()
  const [results, setResults] = useState<Idea[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [remote, setRemote] = useState(false)
  const [recent, setRecent] = useState<Search[]>(() => loadSearches())
  const [view, setView] = useState<'all' | 'saved'>('all')
  const savedCount = useFavorites()?.length ?? 0
  // Signed out, only the built-in recipes answer: a filter that would return
  // nothing is not offered. Signed in, the wider search covers every one.
  const cats = token ? CATEGORIES : CATEGORIES.filter((c) => localSearch('', c, meal).length > 0)

  const words = q.trim()
  const browsing = !words && !category

  useEffect(() => {
    if (browsing) { setState('idle'); return }
    const key = `${meal}|${category?.id ?? ''}|${words.toLowerCase()}|${token ? 'in' : 'out'}`
    const local = localSearch(words, category, meal)
    const hit = remembered.get(key)
    if (hit) { setResults(hit); setRemote(hit.some((i) => i.source === 'spoonacular')); setState('ready'); return }
    if (!token) { setResults(local); setRemote(false); setState('ready'); return }

    let live = true
    setState('loading')
    const timer = setTimeout(async () => {
      const found = await searchRecipes(token, words, category, meal)
      if (!live) return
      const seen = new Set(local.map((i) => i.title.toLowerCase()))
      const merged = [...local, ...found.filter((i) => !seen.has(i.title.toLowerCase()))]
      remembered.set(key, merged)
      setResults(merged)
      setRemote(found.length > 0)
      setState('ready')
      if (merged.length) setRecent(saveSearch({ q: words, categoryId: category?.id, meal, ideas: merged }))
    }, words ? 400 : 0)
    return () => { live = false; clearTimeout(timer) }
  }, [words, category, meal, token, browsing])

  const shown = browsing ? recipesForMeal(meal).map(ideaFromLocal) : results

  /** An earlier search, back with its results — no round trip. */
  function again(s: Search) {
    const cat = CATEGORIES.find((c) => c.id === s.categoryId)
    remembered.set(`${s.meal}|${cat?.id ?? ''}|${s.q.toLowerCase()}|${token ? 'in' : 'out'}`, s.ideas)
    if (s.meal !== meal) onMeal(s.meal)
    setCategory(cat)
    setQ(s.q)
  }

  return (
    <>
      <section className="hero hero-tab recipes-head">
        <h1>Recipes</h1>
        <div className="switch" role="radiogroup" aria-label="Which recipes">
          <button type="button" role="radio" aria-checked={view === 'all'} className={view === 'all' ? 'is-active' : ''} onClick={() => setView('all')}>All</button>
          <button type="button" role="radio" aria-checked={view === 'saved'} className={view === 'saved' ? 'is-active' : ''} onClick={() => setView('saved')}>
            Saved{savedCount > 0 ? ` · ${savedCount}` : ''}
          </button>
        </div>
      </section>

      {view === 'saved' ? <SavedList onOpen={onOpen} onBrowse={() => setView('all')} /> : <>

      <label className="search">
        <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search recipes"
          autoComplete="off"
          enterKeyHint="search"
        />
        {q && (
          <button type="button" className="search-clear" onClick={() => setQ('')} aria-label="Clear search">
            <X size={14} weight="bold" />
          </button>
        )}
      </label>

      <div className="cats" role="group" aria-label="Category">
        {cats.map((c) => {
          const active = category?.id === c.id
          return (
            <button
              key={c.id}
              type="button"
              className={`cat ${active ? 'is-active' : ''}`}
              aria-pressed={active}
              onClick={() => setCategory(active ? undefined : c)}
            >
              {c.name}
            </button>
          )
        })}
      </div>

      <MealPicker value={meal} onChange={onMeal} />

      {browsing && recent.length > 0 && (
        <section aria-labelledby="recent-searches">
          <header className="label">
            <h2 id="recent-searches">Recent searches</h2>
            <span className="label-note">kept on this device</span>
          </header>
          <ul className="idea-list">
            {recent.map((s) => {
              const cat = CATEGORIES.find((c) => c.id === s.categoryId)
              return (
                <li key={s.id} className="idea saved-row">
                  <button type="button" className="idea-btn" onClick={() => again(s)}>
                    <span className="saved-photo history-blank"><ClockCounterClockwise size={18} /></span>
                    <span className="idea-main">
                      <span className="idea-title">{[s.q, cat?.name].filter(Boolean).join(' · ')}</span>
                      <span className="idea-meta">
                        <span>{s.ideas.length} found</span>
                        <span>{formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}</span>
                      </span>
                    </span>
                  </button>
                  <button type="button" className="saved-remove" aria-label={`Forget search ${s.q}`} onClick={() => setRecent(removeSearch(s.id))}>
                    <Trash size={18} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {browsing ? (
        <p className="label">{shown.length} built in</p>
      ) : (
        <p className="label">
          <span>{state === 'loading' ? 'Searching' : `${shown.length} found`}</span>
          {state === 'ready' && (remote ? <span className="label-note">via Spoonacular</span> : !token ? <span className="label-note">built-ins only</span> : null)}
        </p>
      )}

      {state === 'ready' || browsing ? (
        shown.length > 0 ? <IdeaGrid ideas={shown} onOpen={onOpen} /> : (
          <div className="ideas-empty">
            <p>
              {browsing
                ? `No built-in ${meal} recipes yet. Try another meal, or take a photo on the Fridge tab.`
                : token ? 'Nothing for that. Try fewer words, or a different filter.' : 'Nothing built in for that.'}
            </p>
          </div>
        )
      ) : (
        <IdeaList ideas={[]} state={state} onOpen={onOpen} onRefresh={() => {}} quiet />
      )}

      {!browsing && !token && canSignIn && state === 'ready' && (
        <div className="ideas-empty" style={{ marginTop: '1rem' }}>
          <p>Sign in to search thousands more, with photos and videos.</p>
          <button type="button" className="btn btn-primary" onClick={signIn}>Sign in</button>
        </div>
      )}
      </>}
    </>
  )
}

const remembered = new Map<string, Idea[]>()
