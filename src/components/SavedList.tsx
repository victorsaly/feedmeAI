import { useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import { FavoritesStorage } from '@/lib/favorites-storage'
import { ideaFromRecipe, type Idea, type Recipe } from '@/lib/kitchen'
import { primeRecipe } from '@/components/IdeaSheet'

interface SavedListProps {
  onOpen: (idea: Idea) => void
}

/* Saved recipes: the same grouped list, newest first, with a way to let go. */
export function SavedList({ onOpen }: SavedListProps) {
  const [saved, setSaved] = useState<Recipe[]>(() => FavoritesStorage.getFavoritesByDate())

  function remove(id: string) {
    FavoritesStorage.removeFavorite(id)
    setSaved(FavoritesStorage.getFavoritesByDate())
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
              {r.originalImageBase64 && <img className="saved-photo" src={r.originalImageBase64} alt="" />}
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
