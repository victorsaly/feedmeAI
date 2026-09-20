import { useEffect, useRef, useState } from 'react'
import { Heart, Clock, ChefHat, Play, Fire, Plus, Check, ArrowsLeftRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { signIn, useSessionToken } from '@/lib/account'
import { ensureFavoritesLoaded, saveFavorite, removeFavorite, useFavorites } from '@/lib/favorites'
import { addTodo } from '@/lib/todos'
import { expand, generateDishImage, hasKey, type Idea, type Ingredient, type Recipe } from '@/lib/kitchen'
import { findVideo } from '@/lib/spoonacular'

interface IdeaSheetProps {
  idea: Idea | null
  items: Ingredient[]
  photo?: string
  /** a dish photo found after the idea was opened, if one turned up */
  lateImage?: string
  onClose: () => void
  /** the recipe as written out, and again each time it gains a video or picture */
  onRecipe?: (recipe: Recipe) => void
  onCook: (recipe: Recipe) => void
}

/*
 * One idea, written out. A bottom sheet on a phone (vaul, so it drags),
 * a dialog on a desktop. The full recipe is fetched when the sheet opens
 * and cached per idea, so reopening is instant.
 */
export function IdeaSheet({ idea, items, photo, lateImage, onClose, onRecipe, onCook }: IdeaSheetProps) {
  const isMobile = useIsMobile()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [failed, setFailed] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [playing, setPlaying] = useState(false)
  const [showMine, setShowMine] = useState(false)
  const token = useSessionToken()
  const report = useRef(onRecipe)
  report.current = onRecipe
  useEffect(() => { if (recipe) report.current?.(recipe) }, [recipe])
  const favorites = useFavorites()

  // Saved is server-backed (see src/lib/favorites.ts); load the account's
  // list once so the heart below reflects reality the moment it can.
  useEffect(() => { ensureFavoritesLoaded(token) }, [token])
  const saved = recipe ? (favorites?.some((f) => f.id === recipe.id) ?? false) : false

  useEffect(() => {
    if (!idea) return
    let live = true
    setRecipe(null)
    setFailed(false)
    setAdded(new Set())
    setPlaying(false)
    setShowMine(false)
    const cached = cache.get(idea.id)
    if (cached) {
      setRecipe(cached)
      return
    }
    expand(idea, items, token)
      .then((r) => {
        if (!live) return
        cache.set(idea.id, r)
        setRecipe(r)
      })
      .catch(() => live && setFailed(true))
    return () => { live = false }
  }, [idea, items, token])

  // Someone making it, looked up once per recipe and kept with it — so a
  // saved recipe carries its video too. The recipe object changes again when
  // a preview image lands, hence the in-flight guard rather than a re-fetch.
  useEffect(() => {
    if (!recipe || recipe.video !== undefined || !token || lookingUp.has(recipe.id)) return
    const { id, title } = recipe
    lookingUp.add(id)
    findVideo(token, title).then((video) => {
      lookingUp.delete(id)
      const cached = cache.get(id)
      if (cached) cache.set(id, { ...cached, video })
      setRecipe((prev) => (prev && prev.id === id ? { ...prev, video } : prev))
    })
  }, [recipe, token])

  // A generated look at a genuinely new AI idea — best-effort, after the
  // recipe itself has loaded, and only when there's no photo of it already.
  useEffect(() => {
    if (!idea || !recipe || recipe.previewImage || recipe.image || lateImage || idea.source !== 'ai' || !hasKey() || !token) return
    let live = true
    generateDishImage(idea, token).then((url) => {
      if (!live || !url) return
      setRecipe((prev) => {
        if (!prev) return prev
        const next = { ...prev, previewImage: url }
        cache.set(prev.id, next)
        return next
      })
    })
    return () => { live = false }
  }, [idea, recipe, lateImage, token])

  async function addToList(line: string) {
    if (!token) {
      toast('Sign in to keep a shopping list', { action: { label: 'Sign in', onClick: signIn } })
      return
    }
    setAdded((prev) => new Set(prev).add(line))
    const created = await addTodo(token, line, { id: idea!.id, name: idea!.title })
    if (!created) {
      setAdded((prev) => { const next = new Set(prev); next.delete(line); return next })
      toast.error("Couldn't add that to the list.")
    }
  }

  async function toggleSave() {
    if (!recipe) return
    if (!token) {
      toast('Sign in to save recipes', { action: { label: 'Sign in', onClick: signIn } })
      return
    }
    if (saved) {
      const ok = await removeFavorite(token, recipe.id)
      if (!ok) toast.error("Couldn't remove that. Try again.")
    } else {
      // The photo you took stays on this device — only the recipe itself
      // (and whichever dish photo it already has) goes to the server.
      const ok = await saveFavorite(token, { ...recipe, image: recipe.image ?? dish, isFavorite: true })
      if (ok) toast.success('Saved')
      else toast.error("Couldn't save that. Try again.")
    }
  }

  const have = new Set(items.map((i) => i.name.toLowerCase()))
  // The dish leads: a real or built-in photo, else the AI's suggested look.
  // When there's also the photo you took, one tap swaps between the two.
  const dish = recipe?.image ?? idea?.image ?? lateImage ?? recipe?.previewImage
  const shotSrc = dish && !showMine ? dish : photo ?? dish
  const shotCaption = shotSrc === photo ? 'Your photo' : shotSrc === recipe?.previewImage ? 'Suggested look, AI-generated' : 'The finished dish'
  const canSwap = Boolean(dish && photo)
  const video = recipe?.video
  const videoBlock = video && (
    <figure className="sheet-video">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" className="sheet-video-play" onClick={() => setPlaying(true)} aria-label={`Play: ${video.title}`}>
          <img
            src={video.thumbnail ?? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt=""
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <Play size={28} weight="fill" aria-hidden="true" />
        </button>
      )}
      <figcaption>
        <span>{video.title}</span>
        {video.seconds !== null && <span>{clock(video.seconds)}</span>}
      </figcaption>
    </figure>
  )
  const body = idea && (
    <div className="sheet-body">
      {shotSrc && (
        <figure className="sheet-shot">
          <img src={shotSrc} alt="" />
          <figcaption>{shotCaption}</figcaption>
          {canSwap && (
            <button type="button" className="sheet-shot-swap" onClick={() => setShowMine((v) => !v)}>
              <ArrowsLeftRight size={14} weight="bold" /> {showMine ? 'The dish' : 'Your photo'}
            </button>
          )}
        </figure>
      )}
      <div className="sheet-meta">
        <span><Clock size={16} /> {recipe ? recipe.cookingTime : `${idea.minutes} minutes`}</span>
        {recipe && <span><ChefHat size={16} /> {recipe.difficulty}</span>}
        {recipe?.nutrition && <span><Fire size={16} /> {recipe.nutrition.calories} kcal</span>}
      </div>

      {failed ? (
        <p className="sheet-error">Couldn't write this one out. Close and try again.</p>
      ) : !recipe ? (
        <div className="sheet-skeleton" aria-label="Writing the recipe">
          <span className="sk sk-line" style={{ width: '90%' }} />
          <span className="sk sk-line" style={{ width: '70%' }} />
          <span className="sk sk-title" style={{ width: '40%', marginTop: '1.2rem' }} />
          <span className="sk sk-line" /><span className="sk sk-line" /><span className="sk sk-line" style={{ width: '60%' }} />
          <span className="sk sk-title" style={{ width: '30%', marginTop: '1.2rem' }} />
          <span className="sk sk-line" /><span className="sk sk-line" style={{ width: '85%' }} />
        </div>
      ) : (
        <>
          {recipe.description !== idea.blurb && <p className="sheet-desc">{recipe.description}</p>}
          {recipe.credit && (
            <p className="sheet-key sheet-credit">
              Recipe from <a href={recipe.credit.url} target="_blank" rel="noopener noreferrer">{recipe.credit.name}</a>, found via Spoonacular.
            </p>
          )}

          {videoBlock && (
            <>
              <h3>Watch it made</h3>
              {videoBlock}
            </>
          )}

          <h3>Ingredients</h3>
          <ul className="sheet-ings">
            {recipe.ingredients.map((line, n) => {
              const got = [...have].some((h) => line.toLowerCase().includes(h))
              const isAdded = added.has(line)
              return (
                <li key={n} className={got ? 'got' : ''}>
                  <span className="sheet-dot" aria-hidden="true" />
                  <span className="sheet-ing-text">{line}</span>
                  {got && <span className="sr-only"> (you have this)</span>}
                  <button
                    type="button"
                    className="sheet-ing-add"
                    onClick={() => addToList(line)}
                    disabled={isAdded}
                    aria-label={isAdded ? `${line} added to list` : `Add ${line} to list`}
                  >
                    {isAdded ? <Check size={15} weight="bold" /> : <Plus size={15} weight="bold" />}
                  </button>
                </li>
              )
            })}
          </ul>
          {items.length > 0 && <p className="sheet-key"><span className="sheet-dot got" /> you have it</p>}

          <h3>Method</h3>
          <ol className="sheet-steps">
            {recipe.instructions.map((step, n) => <li key={n}>{step}</li>)}
          </ol>

          {recipe.nutrition && (
            <>
              <h3>Nutrition</h3>
              <div className="sheet-nutri">
                <div><b>{recipe.nutrition.calories}</b><span>kcal</span></div>
                <div><b>{recipe.nutrition.protein}</b><span>protein</span></div>
                <div><b>{recipe.nutrition.carbs}</b><span>carbs</span></div>
                <div><b>{recipe.nutrition.fat}</b><span>fat</span></div>
              </div>
              <p className="sheet-key">Estimated per serving &mdash; useful as a rough guide, not a lab figure.</p>
            </>
          )}

        </>
      )}
    </div>
  )

  const footer = recipe && !failed && (
    <div className="sheet-actions">
      <button type="button" className={`btn btn-quiet ${saved ? 'is-saved' : ''}`} onClick={toggleSave}>
        <Heart size={18} weight={saved ? 'fill' : 'regular'} /> {saved ? 'Saved' : 'Save'}
      </button>
      <button type="button" className="btn btn-primary" onClick={() => onCook(recipe)}>
        <Play size={18} weight="fill" /> Cook step by step
      </button>
    </div>
  )

  const open = Boolean(idea)
  const onOpenChange = (o: boolean) => { if (!o) onClose() }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="sheet">
          <div className="sheet-scroll">
            <DrawerTitle className="sheet-title">{idea?.title}</DrawerTitle>
            <DrawerDescription className="sheet-blurb">{idea?.blurb}</DrawerDescription>
            {body}
          </div>
          {footer}
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sheet sheet-dialog">
        <div className="sheet-scroll">
          <DialogTitle className="sheet-title">{idea?.title}</DialogTitle>
          <DialogDescription className="sheet-blurb">{idea?.blurb}</DialogDescription>
          {body}
        </div>
        {footer}
      </DialogContent>
    </Dialog>
  )
}

const cache = new Map<string, Recipe>()
const lookingUp = new Set<string>()

/** 754 → "12:34" */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** A recipe we already hold (a saved one) opens without a round trip. */
export function primeRecipe(recipe: Recipe) {
  cache.set(recipe.id, recipe)
}
