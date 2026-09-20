import { useEffect, useState } from 'react'
import { Heart, Clock, ChefHat, Play, Fire } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { FavoritesStorage } from '@/lib/favorites-storage'
import { expand, generateDishImage, hasKey, type Idea, type Ingredient, type Recipe } from '@/lib/kitchen'

interface IdeaSheetProps {
  idea: Idea | null
  items: Ingredient[]
  photo?: string
  onClose: () => void
  onCook: (recipe: Recipe) => void
}

/*
 * One idea, written out. A bottom sheet on a phone (vaul, so it drags),
 * a dialog on a desktop. The full recipe is fetched when the sheet opens
 * and cached per idea, so reopening is instant.
 */
export function IdeaSheet({ idea, items, photo, onClose, onCook }: IdeaSheetProps) {
  const isMobile = useIsMobile()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [failed, setFailed] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!idea) return
    let live = true
    setRecipe(null)
    setFailed(false)
    const cached = cache.get(idea.id)
    if (cached) {
      setRecipe(cached)
      setSaved(FavoritesStorage.isFavorite(cached.id))
      return
    }
    expand(idea, items)
      .then((r) => {
        if (!live) return
        cache.set(idea.id, r)
        setRecipe(r)
        setSaved(FavoritesStorage.isFavorite(r.id))
      })
      .catch(() => live && setFailed(true))
    return () => { live = false }
  }, [idea, items])

  // A generated look at a genuinely new AI idea — best-effort, after the
  // recipe itself has loaded, and only when there's no photo of it already.
  useEffect(() => {
    if (!idea || !recipe || recipe.previewImage || recipe.image || idea.source !== 'ai' || !hasKey()) return
    let live = true
    generateDishImage(idea).then((url) => {
      if (!live || !url) return
      setRecipe((prev) => {
        if (!prev) return prev
        const next = { ...prev, previewImage: url }
        cache.set(prev.id, next)
        return next
      })
    })
    return () => { live = false }
  }, [idea, recipe])

  function toggleSave() {
    if (!recipe) return
    if (saved) {
      FavoritesStorage.removeFavorite(recipe.id)
      setSaved(false)
    } else {
      FavoritesStorage.saveFavorite({ ...recipe, originalImageBase64: photo, isFavorite: true })
      setSaved(true)
      toast.success('Saved')
    }
  }

  const have = new Set(items.map((i) => i.name.toLowerCase()))
  // The photo you took is the source of truth for what's in the recipe;
  // a built-in recipe's own photo only stands in when there is no upload.
  const shotSrc = photo ?? recipe?.image ?? idea?.image
  const shotCaption = photo ? 'Your photo' : null
  const body = idea && (
    <div className="sheet-body">
      {shotSrc && (
        <figure className="sheet-shot">
          <img src={shotSrc} alt="" />
          {shotCaption && <figcaption>{shotCaption}</figcaption>}
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

          <h3>Ingredients</h3>
          <ul className="sheet-ings">
            {recipe.ingredients.map((line, n) => {
              const got = [...have].some((h) => line.toLowerCase().includes(h))
              return (
                <li key={n} className={got ? 'got' : ''}>
                  <span className="sheet-dot" aria-hidden="true" />
                  {line}
                  {got && <span className="sr-only"> (you have this)</span>}
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

          {recipe.previewImage && (
            <figure className="sheet-preview">
              <img src={recipe.previewImage} alt="" />
              <figcaption>Suggested look, AI-generated</figcaption>
            </figure>
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

/** A recipe we already hold (a saved one) opens without a round trip. */
export function primeRecipe(recipe: Recipe) {
  cache.set(recipe.id, recipe)
}
