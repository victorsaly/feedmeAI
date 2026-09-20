import { useEffect } from 'react'
import { Trash } from '@phosphor-icons/react'
import { signIn, useSessionToken } from '@/lib/account'
import { ensureFavoritesLoaded, removeFavorite, useFavorites } from '@/lib/favorites'
import { ideaFromRecipe, type Idea } from '@/lib/kitchen'
import { primeRecipe } from '@/components/IdeaSheet'

interface SavedListProps {
  onOpen: (idea: Idea) => void
}

/* Saved recipes: the same grouped list, newest first, with a way to let go.
 * Server-backed under the signed-in account — see src/lib/favorites.ts and
 * workers/favorites-api — not this device's storage, so it follows you. */
export function SavedList({ onOpen }: SavedListProps) {
  const token = useSessionToken()
  const saved = useFavorites()

  useEffect(() => { ensureFavoritesLoaded(token) }, [token])

  function remove(id: string) {
    if (token) removeFavorite(token, id)
  }

  if (!token) {
    return (
      <div className="ideas-empty" style={{ marginTop: '1rem' }}>
        <p>Sign in to save recipes for later.</p>
        <button type="button" className="btn btn-primary" onClick={signIn}>Sign in</button>
      </div>
    )
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
    return (
      <div className="ideas-empty" style={{ marginTop: '1rem' }}>
        <p>Nothing saved yet. Open any recipe and tap Save to keep it here.</p>
      </div>
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
            <button type="button" className="saved-remove" aria-label={`Remove ${r.title}`} onClick={() => remove(r.id)}>
              <Trash size={18} />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
