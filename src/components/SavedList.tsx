import { useEffect } from 'react'
import { Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useSessionToken } from '@/lib/account'
import { ensureFavoritesLoaded, removeFavorite, saveFavorite, useFavorites } from '@/lib/favorites'
import { ideaFromLocal, ideaFromRecipe, recipesForMeal, type Idea, type Recipe } from '@/lib/kitchen'
import { IdeaGrid } from '@/components/IdeaGrid'
import { DEVICE } from '@/lib/device'
import { primeRecipe } from '@/components/IdeaSheet'

interface SavedListProps {
  onOpen: (idea: Idea) => void
  /** from the empty state: go and find something to save */
  onBrowse?: () => void
}

/* Saved recipes: newest first, with a way to let go. They are kept on this
 * device, and under your account once you sign in — see src/lib/favorites.ts. */
export function SavedList({ onOpen, onBrowse }: SavedListProps) {
  const token = useSessionToken()
  const saved = useFavorites()

  useEffect(() => { ensureFavoritesLoaded(token) }, [token])

  function remove(r: Recipe) {
    removeFavorite(token, r.id)
    toast(`Removed ${r.title}`, { action: { label: 'Undo', onClick: () => { saveFavorite(token, r) } } })
  }

  if (saved === null) {
    return (
      <ul className="idea-list" aria-hidden="true" style={{ marginTop: '1rem' }}>
        {[0, 1].map((n) => (
          <li key={n} className="idea idea-skeleton" style={{ animationDelay: `${n * 80}ms` }}>
            <span className="sk sk-title" />
            <span className="sk sk-line" />
            <span className="sk sk-meta" />
          </li>
        ))}
      </ul>
    )
  }

  if (saved.length === 0) {
    const starters = recipesForMeal('dinner').slice(0, 2).map(ideaFromLocal)
    return (
      <>
        <div className="ideas-empty">
          <p>Nothing saved yet. Open a recipe and tap Save, and it stays on this {DEVICE}; sign in and it follows your account.</p>
          {onBrowse && <button type="button" className="btn btn-primary" onClick={onBrowse}>Browse recipes</button>}
        </div>
        {starters.length > 0 && (
          <>
            <p className="label">Two to start with</p>
            <IdeaGrid ideas={starters} onOpen={onOpen} />
          </>
        )}
      </>
    )
  }

  return (
    <>
      <p className="label">{saved.length} saved</p>
      <ul className="idea-list">
        {saved.map((r, n) => (
          <li key={r.id} className="idea saved-row" style={{ animationDelay: `${n * 45}ms` }}>
            <button type="button" className="idea-btn" onClick={() => { primeRecipe(r); onOpen(ideaFromRecipe(r)) }}>
              {(r.image ?? r.previewImage) && <img className="saved-photo" src={r.image ?? r.previewImage} alt="" />}
              <span className="idea-main">
                <span className="idea-title">{r.title}</span>
                <span className="idea-meta">
                  <span>{r.cookingTime}</span>
                  <span>{r.ingredients.length} ingredients</span>
                </span>
              </span>
            </button>
            <button type="button" className="saved-remove" aria-label={`Remove ${r.title}`} onClick={() => remove(r)}>
              <Trash size={18} />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
