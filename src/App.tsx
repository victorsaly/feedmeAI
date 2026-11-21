import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Logo } from '@/components/Logo'
import { PhotoPicker } from '@/components/PhotoPicker'
import { HaulList } from '@/components/HaulList'
import { IdeaList } from '@/components/IdeaList'
import { IdeaSheet, primeRecipe } from '@/components/IdeaSheet'
import { ListTab } from '@/components/ListTab'
import { Account, AccountButton } from '@/components/Account'
import { CookScreen } from '@/components/CookScreen'
import { MealPicker } from '@/components/MealPicker'
import { RecipesTab } from '@/components/RecipesTab'
import { HaulHistory } from '@/components/HaulHistory'
import { RecipeStrip } from '@/components/RecipeStrip'
import { useBack } from '@/hooks/use-back'
import { useOnline } from '@/hooks/use-online'
import { PlanLimit } from '@/lib/plan'
import { SampleCard } from '@/components/SampleCard'
import { SAMPLE, isSample } from '@/lib/sample'
import { TabBar, type Tab } from '@/components/TabBar'
import { ensureFavoritesLoaded } from '@/lib/favorites'
import { syncList, useList } from '@/lib/list'
import { completeSignIn, useSessionToken } from '@/lib/account'
import { findImage } from '@/lib/spoonacular'
import { loadHauls, saveHaul, removeHaul, thumbnail, LARGE, type Haul } from '@/lib/history'
import {
  identify, suggest, loadMeal, saveMeal, hasKey, probeAI, explain,
  type Idea, type Ingredient, type Recipe, type Meal, type Source,
} from '@/lib/kitchen'

export type { Ingredient } from '@/lib/kitchen'

/*
 * Three tabs — the fridge, the list, recipes (with saved inside) — and one
 * full-screen stage, Cook, that hides the bar. The fridge tab holds the flow: take the
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
  const [account, setAccount] = useState(false)
  const [photoLimit, setPhotoLimit] = useState<string>() // today's photos are used up: the Worker's own sentence
  const [tab, setTab] = useState<Tab>('fridge')
  const [meal, setMeal] = useState<Meal>(() => loadMeal())
  const [hauls, setHauls] = useState<Haul[]>(() => loadHauls())
  const [haul, setHaul] = useState<Pick<Haul, 'id' | 'createdAt' | 'photo' | 'photoLarge'>>() // the history entry this screen is
  const [opened, setOpened] = useState<Record<string, Recipe>>({}) // recipes written out for it
  const run = useRef(0) // a newer request makes an older result irrelevant
  const token = useSessionToken()
  const online = useOnline()
  const listCount = useList().filter((t) => !t.checked).length

  // Saved is server-backed under the account, same as the shopping list
  // below — load it once a token exists so the tab badge is accurate.
  useEffect(() => { ensureFavoritesLoaded(token) }, [token])

  // The return trip from Google, if this load is one — comes back with
  // `?auth=` on whichever tab sign-in was offered from.
  useEffect(() => {
    completeSignIn().then((session) => { if (session) toast.success(`Signed in as ${session.name}`) })
  }, [])

  // The product site's "Try a sample photo" arrives as /app/?sample. Opened
  // once, then taken out of the address so a reload starts at the beginning.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('sample')) return
    url.searchParams.delete('sample')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    reopen(SAMPLE)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, [])

  // Ask the worker once whether a model is behind it, so the start screen
  // can say so before the first photo rather than after.
  const [, setAiKnown] = useState(false)
  useEffect(() => { probeAI().then(() => setAiKnown(true)) }, [])

  // The list is on this device; an account's copy is brought in line with it.
  useEffect(() => { syncList(token) }, [token])

  // Whatever this screen shows is what history keeps — written on every
  // change, so a closed tab loses nothing. Loading ideas aren't kept: an
  // entry restored mid-draft would show an empty list with no way to redo.
  useEffect(() => {
    if (!haul || isSample(haul.id) || stage !== 'haul' || !items.length || ideasState === 'loading') return
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
      setPhotoLimit(undefined)
      setItems(items)
      setHaul({ id: `h-${Date.now()}`, createdAt: new Date().toISOString(), photo: thumb, photoLarge: large })
      setStage('haul')
      window.scrollTo({ top: 0 })
      if (items.length) draft(items, meal)
    } catch (err) {
      if (err instanceof PlanLimit) { setPhoto(undefined); setPhotoLimit(err.message) }
      else toast.error(explain(err, "Couldn't read the photo. Check the connection and try again."))
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
    // The written recipe knows its time better than the one-line idea did:
    // the row and the sheet must not disagree.
    const minutes = parseInt(r.cookingTime)
    if (minutes) setIdeas((cur) => (cur.some((i) => i.id === r.id && i.minutes !== minutes) ? cur.map((i) => (i.id === r.id ? { ...i, minutes } : i)) : cur))
  }

  const leaveCook = () => { setStage(items.length ? 'haul' : 'start'); setTab(cameFrom) }

  // Back closes whatever is on top — cooking, then the recipe, then the
  // photo's results — instead of leaving the app. Bottom layer first.
  useBack([
    { open: tab === 'fridge' && (stage === 'haul' || (stage === 'cook' && items.length > 0)), close: startOver },
    { open: Boolean(openIdea), close: () => setOpenIdea(null) },
    { open: account, close: () => setAccount(false) },
    { open: stage === 'cook' && Boolean(cooking), close: () => { leaveCook(); setOpenIdea(lastIdea) } },
  ])

  /* ----- cook: full screen, no bar ----- */

  if (stage === 'cook' && cooking) {
    return (
      <CookScreen
        recipe={cooking}
        photo={cooking.image ?? cooking.previewImage ?? (cameFrom === 'fridge' ? photo : undefined)}
        onBack={() => { leaveCook(); setOpenIdea(lastIdea) }}
        onDone={() => { setCooking(null); setLastIdea(null); leaveCook() }}
      />
    )
  }

  /* ----- the tabs ----- */

  return (
    <div className="app has-tabs">
      <header className="top">
        <a className="brand" href="/app/" onClick={(e) => { e.preventDefault(); startOver(); setTab('fridge') }} aria-label="FeedMe AI home">
          <Logo size={26} />
          <span>FeedMe<span className="brand-ai">AI</span></span>
        </a>
        {tab === 'fridge' && stage === 'haul' && (
          <button type="button" className="btn btn-ghost" onClick={startOver}>
            <ArrowLeft size={16} weight="bold" /> New photo
          </button>
        )}
        <AccountButton onOpen={() => setAccount(true)} />
      </header>

      <main className="page">
        {tab === 'recipes' && <RecipesTab meal={meal} onMeal={changeMeal} onOpen={setOpenIdea} />}

        {tab === 'fridge' && stage === 'start' && (
          <div className="home">
            <section className="hero">
              <h1>What's in the fridge?</h1>
              <p>One photo. You get what's in it, and what to cook from it tonight.</p>
            </section>

            {!online && (
              <p className="offline-note" role="status">
                No connection. A new photo needs one; your list, saved recipes and earlier photos still work.
              </p>
            )}
            {photoLimit && !analyzing && (
              <div className="offline-note limit-note" role="status">
                <b>{photoLimit}</b>
                <span>The sample, your earlier photos and the recipes below still work.</span>
              </div>
            )}
            <PhotoPicker onPhoto={onPhoto} onSample={() => reopen(SAMPLE)} looking={analyzing ? photo : undefined} />

            {!hasKey() && !analyzing && (
              <p className="demo-note">
                Running without an AI behind it: the photo step shows a sample list and the ideas
                come from the built-in recipes.
              </p>
            )}

            {!analyzing && hauls.length === 0 && <SampleCard onOpen={() => reopen(SAMPLE)} />}
            {!analyzing && <HaulHistory hauls={hauls} onOpen={reopen} onRemove={(id) => setHauls(removeHaul(id))} />}
            {!analyzing && <RecipeStrip meal={meal} onOpen={setOpenIdea} />}
          </div>
        )}

        {tab === 'fridge' && stage === 'haul' && (
          <div className="results">
            <div className="results-side">
              <HaulList photo={photo} items={items} onChange={editItems} />
            </div>
            <div className="results-main">
            {items.length > 0 && <MealPicker value={meal} onChange={changeMeal} />}
            {items.length > 0 && <IdeaList
              ideas={ideas}
              state={ideasState}
              source={ideasSource}
              error={ideasError}
              heading={HEADING[meal]}
              onOpen={setOpenIdea}
              onRefresh={() => draft(items, meal)}
              photo={photo}
            />}
            {isSample(haul?.id) && (
              <p className="demo-note">
                A sample: one real photo and what the app made of it, recorded. Nothing here calls the AI
                until you change the list. Take your own photo to try it on your fridge.
              </p>
            )}
            {ideasState === 'stale' && (
              <div className="update-bar" role="status">
                <span>The list changed.</span>
                <button type="button" className="btn btn-primary" onClick={() => draft(items, meal)}>Update ideas</button>
              </div>
            )}
            </div>
          </div>
        )}

        {tab === 'list' && <ListTab onAccount={() => setAccount(true)} />}
      </main>

      <TabBar tab={tab} listCount={listCount} onChange={setTab} />

      <IdeaSheet
        idea={openIdea}
        lateImage={openIdea ? ideas.find((i) => i.id === openIdea.id)?.image : undefined}
        items={tab === 'fridge' ? items : []}
        onClose={() => setOpenIdea(null)}
        onRecipe={onRecipe}
        onCook={(r) => { setLastIdea(openIdea); setCameFrom(tab); setOpenIdea(null); setCooking(r); setStage('cook') }}
      />

      <Account open={account} onClose={() => setAccount(false)} />

      <Toaster position="top-center" />
    </div>
  )
}

export default App
