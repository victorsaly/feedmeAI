import { useEffect, useRef, useState } from 'react'
import { Heart, Clock, ChefHat, Play, Fire, Plus, Check, ListPlus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSessionToken } from '@/lib/account'
import { ensureFavoritesLoaded, saveFavorite, removeFavorite, useFavorites } from '@/lib/favorites'
import { addItem } from '@/lib/list'
import { expand, generateDishImage, hasKey, type Idea, type Ingredient, type Recipe } from '@/lib/kitchen'
import { findVideo } from '@/lib/spoonacular'
import { isSample } from '@/lib/sample'
import { sortIngredients } from '@/lib/pantry'

interface IdeaSheetProps {
  idea: Idea | null
  items: Ingredient[]
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
export function IdeaSheet({ idea, items, lateImage, onClose, onRecipe, onCook }: IdeaSheetProps) {
  const isMobile = useIsMobile()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [failed, setFailed] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [playing, setPlaying] = useState(false)
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
    if (!idea || isSample(idea.id) || !recipe || recipe.previewImage || recipe.image || lateImage || idea.source !== 'ai' || !hasKey() || !token) return
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

  // The list is on this device, so adding never fails and never needs an account.
  function addToList(line: string) {
    setAdded((prev) => new Set(prev).add(line))
    addItem(token, line, { id: idea!.id, name: idea!.title })
  }

  /** Everything missing, in one tap. */
  function addAll(lines: string[]) {
    const fresh = lines.filter((l) => !added.has(l))
    fresh.forEach(addToList)
    toast.success(fresh.length === 1 ? 'Added to your list' : `${fresh.length} added to your list`)
  }

  async function toggleSave() {
    if (!recipe) return
    if (saved) {
      const ok = await removeFavorite(token, recipe.id)
      if (!ok) toast.error("Couldn't remove that. Try again.")
    } else {
      // The photo you took stays on this device — only the recipe itself
      // (and whichever dish photo it already has) is kept.
      const ok = await saveFavorite(token, { ...recipe, image: recipe.image ?? dish, isFavorite: true })
      if (ok) toast.success('Saved')
      else toast.error("Couldn't save that. Try again.")
    }
  }

  // Only ever the dish: a real or built-in photo, else the AI's suggested
  // look. A photo of raw ingredients is not a picture of dinner.
  const dish = recipe?.image ?? idea?.image ?? lateImage ?? recipe?.previewImage
  const shotCaption = dish === recipe?.previewImage ? 'Suggested look, AI-generated' : 'The finished dish'
  // With a fridge to compare against, the lines sort into what to buy, what
  // you have and what any cupboard holds. Opened from Recipes there is no
  // fridge, so it is one plain list.
  const sorted = recipe && items.length > 0 ? sortIngredients(recipe.ingredients, items.map((i) => i.name), idea?.missing) : null
  const toBuy = sorted?.buy ?? []
  const allAdded = toBuy.length > 0 && toBuy.every((l) => added.has(l))

  const addButton = (line: string) => {
    const isAdded = added.has(line)
    return (
      <button
        type="button"
        className="sheet-ing-add"
        onClick={() => addToList(line)}
        disabled={isAdded}
        aria-label={isAdded ? `${line} added to list` : `Add ${line} to list`}
      >
        {isAdded ? <Check size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
      </button>
    )
  }

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
      {dish && (
        <figure className="sheet-shot">
          <img src={dish} alt="" />
          <figcaption>{shotCaption}</figcaption>
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
          {!idea.blurb && <p className="sheet-desc">{recipe.description}</p>}
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

          {sorted ? (
            <>
              {toBuy.length > 0 && (
                <>
                  <h3>To buy · {toBuy.length}</h3>
                  <div className="sheet-buy">
                    <ul className="sheet-ings">
                      {toBuy.map((line, n) => (
                        <li key={n}>
                          <span className="sheet-ing-text">{line}</span>
                          {addButton(line)}
                        </li>
                      ))}
                    </ul>
                    {allAdded ? (
                      <p className="sheet-buy-done" role="status"><Check size={18} weight="bold" aria-hidden="true" /> On your list</p>
                    ) : (
                      <button type="button" className="btn btn-quiet sheet-buy-all" onClick={() => addAll(toBuy)}>
                        <ListPlus size={18} weight="bold" /> {toBuy.length === 1 ? 'Add it to the list' : toBuy.length === 2 ? 'Add both to the list' : `Add all ${toBuy.length} to the list`}
                      </button>
                    )}
                  </div>
                </>
              )}
              {sorted.have.length > 0 && (
                <>
                  <h3>You have · {sorted.have.length}</h3>
                  <ul className="sheet-ings is-have">
                    {sorted.have.map((line, n) => (
                      <li key={n}>
                        <Check size={16} weight="bold" className="sheet-tick" aria-hidden="true" />
                        <span className="sheet-ing-text">{line}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {sorted.cupboard.length > 0 && (
                <p className="sheet-cupboard"><b>From the cupboard:</b> {sorted.cupboard.join('; ')}</p>
              )}
            </>
          ) : (
            <>
              <h3>Ingredients</h3>
              <ul className="sheet-ings">
                {recipe.ingredients.map((line, n) => (
                  <li key={n}>
                    <span className="sheet-ing-text">{line}</span>
                    {addButton(line)}
                  </li>
                ))}
              </ul>
            </>
          )}
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
