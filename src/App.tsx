import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Logo } from '@/components/Logo'
import { PhotoPicker } from '@/components/PhotoPicker'
import { HaulList } from '@/components/HaulList'
import { IdeaList } from '@/components/IdeaList'
import { IdeaSheet, primeRecipe } from '@/components/IdeaSheet'
import { SavedList } from '@/components/SavedList'
import { ListTab } from '@/components/ListTab'
import { SignIn } from '@/components/SignIn'
import { CookScreen } from '@/components/CookScreen'
import { MealPicker } from '@/components/MealPicker'
import { RecipesTab } from '@/components/RecipesTab'
import { HaulHistory } from '@/components/HaulHistory'
import { HowItWorks } from '@/components/HowItWorks'
import { TabBar, type Tab } from '@/components/TabBar'
import { ensureFavoritesLoaded, useFavorites } from '@/lib/favorites'
import { completeSignIn, useSessionToken } from '@/lib/account'
import { listTodos } from '@/lib/todos'
import { findImage } from '@/lib/spoonacular'
import { loadHauls, saveHaul, removeHaul, thumbnail, LARGE, type Haul } from '@/lib/history'
import {
  identify, suggest, loadMeal, saveMeal, hasKey, probeAI, explain,
  type Idea, type Ingredient, type Recipe, type Meal, type Source,
} from '@/lib/kitchen'

export type { Ingredient } from '@/lib/kitchen'

/*
 * Three tabs — the fridge, the built-in recipes, saved — and one full-screen
 * stage, Cook, that hides the bar. The fridge tab holds the flow: take the
 * photo, read the list, pick an idea. Its state survives a tab switch.
 */
type Stage = 'start' | 'haul' | 'cook'
type IdeasState = 'idle' | 'loading' | 'ready' | 'error' | 'stale'

/** How the ideas heading greets each meal — matched to the picker above it. */
const HEADING: Record<Meal, string> = {
  breakfast: 'This morning',
  lunch: 'For lunch',
  dinner: 'Tonight',
  dessert: 'Something sweet',
}

function App() {
  const [stage, setStage] = useState<Stage>('start')
  const [photo, setPhoto] = useState<string>()
  const [analyzing, setAnalyzing] = useState(false)
  const [items, setItems] = useState<Ingredient[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [ideasState, setIdeasState] = useState<IdeasState>('idle')
  const [ideasSource, setIdeasSource] = useState<Source>()
  const [ideasError, setIdeasError] = useState<string>()
  const [openIdea, setOpenIdea] = useState<Idea | null>(null)
  const [cooking, setCooking] = useState<Recipe | null>(null)
  const [lastIdea, setLastIdea] = useState<Idea | null>(null) // the sheet to reopen after Cook → back
  const [cameFrom, setCameFrom] = useState<Tab>('fridge') // the tab Cook was opened from
  const [listCount, setListCount] = useState(0)
  const [tab, setTab] = useState<Tab>('fridge')
  const [meal, setMeal] = useState<Meal>(() => loadMeal())
  const [hauls, setHauls] = useState<Haul[]>(() => loadHauls())
  const [haul, setHaul] = useState<Pick<Haul, 'id' | 'createdAt' | 'photo' | 'photoLarge'>>() // the history entry this screen is
  const [opened, setOpened] = useState<Record<string, Recipe>>({}) // recipes written out for it
  const run = useRef(0) // a newer request makes an older result irrelevant
  const token = useSessionToken()
  const favorites = useFavorites()
  const savedCount = favorites?.length ?? 0

  // Saved is server-backed under the account, same as the shopping list
  // below — load it once a token exists so the tab badge is accurate.
  useEffect(() => { ensureFavoritesLoaded(token) }, [token])

  // The return trip from Google, if this load is one — comes back with
  // `?auth=` on whichever tab sign-in was offered from.
  useEffect(() => {
    completeSignIn().then((session) => { if (session) toast.success(`Signed in as ${session.name}`) })
  }, [])

  // Ask the worker once whether a model is behind it, so the start screen
  // can say so before the first photo rather than after.
  const [, setAiKnown] = useState(false)
  useEffect(() => { probeAI().then(() => setAiKnown(true)) }, [])

  useEffect(() => {
    if (!token) { setListCount(0); return }
    let live = true
    listTodos(token).then((todos) => { if (live) setListCount(todos.filter((t) => !t.checked).length) })
    return () => { live = false }
  }, [token, tab, openIdea])

  // Whatever this screen shows is what history keeps — written on every
  // change, so a closed tab loses nothing. Loading ideas aren't kept: an
  // entry restored mid-draft would show an empty list with no way to redo.
  useEffect(() => {
    if (!haul || stage !== 'haul' || !items.length || ideasState === 'loading') return
    setHauls(saveHaul({ ...haul, meal, items, ideas, source: ideasSource, recipes: opened }))
  }, [haul, stage, items, ideas, ideasSource, ideasState, meal, opened])

  async function onPhoto(display: string, small: string) {
    setPhoto(display)
    setAnalyzing(true)
    setIdeas([])
    setIdeasState('idle')
    setOpened({})
    const id = ++run.current
    try {
      const [{ items }, thumb, large] = await Promise.all([identify(small, token), thumbnail(small), thumbnail(small, LARGE)])
      if (id !== run.current) return
      setItems(items)
      setHaul({ id: `h-${Date.now()}`, createdAt: new Date().toISOString(), photo: thumb, photoLarge: large })
      setStage('haul')
      window.scrollTo({ top: 0 })
      if (items.length) draft(items, meal)
    } catch (err) {
      toast.error(explain(err, "Couldn't read the photo. Check the connection and try again."))
    } finally {
      if (id === run.current) setAnalyzing(false)
    }
  }

  async function draft(from: Ingredient[], forMeal: Meal) {
    const id = ++run.current
    setIdeasState('loading')
    try {
      const { ideas, source } = await suggest(from, forMeal, token)
      if (id !== run.current) return
      setIdeas(ideas)
      setIdeasSource(source)
      setIdeasState('ready')
      // The model's ideas arrive without a picture; find one for each as
      // they come, so the list doesn't wait on five more lookups.
      if (token) {
        for (const idea of ideas.filter((i) => !i.image)) {
          findImage(token, idea.title).then((image) => {
            if (!image || id !== run.current) return
            setIdeas((cur) => cur.map((i) => (i.id === idea.id ? { ...i, image } : i)))
          })
        }
      }
    } catch (err) {
      if (id !== run.current) return
      setIdeasError(explain(err, "Couldn't reach the kitchen. Check the connection and try again."))
      setIdeasState('error')
    }
  }

  function editItems(next: Ingredient[]) {
    setItems(next)
    if (next.length === 0) setIdeasState('idle')
    else if (ideasState !== 'loading') setIdeasState('stale')
  }

  function changeMeal(next: Meal) {
    setMeal(next)
    saveMeal(next)
    // The picker is shared across tabs; if ideas already exist for the old
    // meal, mark them stale rather than refetch — same pattern as editing
    // the ingredient list. A tap on "Update ideas" redraws with the new meal.
    if (ideasState === 'ready' && items.length > 0) setIdeasState('stale')
  }

  function startOver() {
    run.current++
    setStage('start')
    setPhoto(undefined)
    setItems([])
    setIdeas([])
    setIdeasState('idle')
    setAnalyzing(false)
    setHaul(undefined)
    setOpened({})
    window.scrollTo({ top: 0 })
  }

  /** An earlier screen, back as it was — the kept photo (large for the
   *  newest few, a thumbnail beyond) stands in for the original, and every
   *  recipe opened then opens again without a fetch. */
  function reopen(h: Haul) {
    run.current++
    for (const r of Object.values(h.recipes ?? {})) primeRecipe(r)
    setHaul({ id: h.id, createdAt: h.createdAt, photo: h.photo, photoLarge: h.photoLarge })
    setOpened(h.recipes ?? {})
    setPhoto(h.photoLarge ?? h.photo)
    setItems(h.items)
    setIdeas(h.ideas)
    setIdeasSource(h.source)
    setIdeasState(h.ideas.length ? 'ready' : 'stale')
    setMeal(h.meal)
    setAnalyzing(false)
    setStage('haul')
    window.scrollTo({ top: 0 })
  }

  /** A recipe written out (or updated with a video or picture) while a
   *  haul is on screen belongs to that haul. */
  function onRecipe(r: Recipe) {
    if (tab !== 'fridge' || !haul) return
    setOpened((cur) => (cur[r.id] === r ? cur : { ...cur, [r.id]: r }))
  }

  const leaveCook = () => { setStage(items.length ? 'haul' : 'start'); setTab(cameFrom) }

  /* ----- cook: full screen, no bar ----- */

  if (stage === 'cook' && cooking) {
    return (
      <CookScreen
        recipe={cooking}
        onBack={() => { leaveCook(); setOpenIdea(lastIdea) }}
        onDone={() => { setCooking(null); setLastIdea(null); leaveCook() }}
      />
    )
  }

  /* ----- the tabs ----- */

  return (
    <div className="app has-tabs">
      <header className="top">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); startOver(); setTab('fridge') }} aria-label="FeedMe AI home">
          <Logo size={26} />
          <span>FeedMe<span className="brand-ai">AI</span></span>
        </a>
        {tab === 'fridge' && stage === 'haul' && (
          <button type="button" className="btn btn-ghost" onClick={startOver}>
            <ArrowLeft size={16} weight="bold" /> New photo
          </button>
        )}
        <SignIn />
      </header>

      <main className="page">
        {tab === 'recipes' && <RecipesTab meal={meal} onMeal={changeMeal} onOpen={setOpenIdea} />}

        {tab === 'saved' && (
          <>
            <section className="hero hero-tab">
              <h1>Saved</h1>
              <p>Recipes you've kept for later.</p>
            </section>
            <SavedList onOpen={setOpenIdea} />
          </>
        )}

        {tab === 'fridge' && stage === 'start' && (
          <div className="home">
            <section className="hero">
              <h1>What's in the fridge?</h1>
              <p>One photo. You get what's in it, and what to cook from it tonight.</p>
            </section>

            <PhotoPicker onPhoto={onPhoto} looking={analyzing ? photo : undefined} />

            {!hasKey() && !analyzing && (
              <p className="demo-note">
                Running without an AI behind it: the photo step shows a sample list and the ideas
                come from the built-in recipes.
              </p>
            )}

            {!analyzing && <HaulHistory hauls={hauls} onOpen={reopen} onRemove={(id) => setHauls(removeHaul(id))} />}
            {!analyzing && <HowItWorks />}
          </div>
        )}

        {tab === 'fridge' && stage === 'haul' && (
          <>
            <HaulList photo={photo} items={items} onChange={editItems} onRetake={startOver} />
            <MealPicker value={meal} onChange={changeMeal} />
            <IdeaList
              ideas={ideas}
              state={ideasState}
              source={ideasSource}
              error={ideasError}
              heading={HEADING[meal]}
              onOpen={setOpenIdea}
              onRefresh={() => draft(items, meal)}
            />
          </>
        )}

        {tab === 'list' && <ListTab />}
      </main>

      <TabBar tab={tab} savedCount={savedCount} listCount={listCount} onChange={setTab} />

      <IdeaSheet
        idea={openIdea}
        lateImage={openIdea ? ideas.find((i) => i.id === openIdea.id)?.image : undefined}
        items={tab === 'fridge' ? items : []}
        photo={tab === 'fridge' ? photo : undefined}
        onClose={() => setOpenIdea(null)}
        onRecipe={onRecipe}
        onCook={(r) => { setLastIdea(openIdea); setCameFrom(tab); setOpenIdea(null); setCooking(r); setStage('cook') }}
      />

      <Toaster position="top-center" />
    </div>
  )
}

export default App
