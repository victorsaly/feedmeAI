import { useEffect } from 'react'
import { toast } from 'sonner'
import { useSessionToken } from '@/lib/account'
import { ensureFavoritesLoaded, removeFavorite, saveFavorite, useFavorites } from '@/lib/favorites'
import type { Recipe } from '@/lib/kitchen'
import { haptic } from '@/lib/native'

/** Save or let go of a recipe, from wherever it is on screen: the recipe
 *  sheet and the cooking screen share this, so the heart means the same
 *  thing in both. Saved recipes stay on the device, and follow the account
 *  when there is one. */
export function useSave(recipe: Recipe | null) {
  const token = useSessionToken()
  const favorites = useFavorites()
  useEffect(() => { ensureFavoritesLoaded(token) }, [token])
  const saved = recipe ? (favorites?.some((f) => f.id === recipe.id) ?? false) : false

  async function toggle(as?: Recipe) {
    const r = as ?? recipe
    if (!r) return
    if (saved) {
      if (!(await removeFavorite(token, r.id))) toast.error("Couldn't remove that. Try again.")
      return
    }
    // The photo you took stays on this device: only the recipe (and the
    // dish picture it already has) is kept.
    if (await saveFavorite(token, { ...r, isFavorite: true })) { haptic('done'); toast.success('Saved') }
    else toast.error("Couldn't save that. Try again.")
  }

  return { saved, toggle }
}
