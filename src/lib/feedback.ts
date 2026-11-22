/**
 * How a cooked recipe turned out: good, or something was missing. It goes
 * to feedmeai-api, which keeps it with the recipe as cooked so a person can
 * read it. No account needed, and no photo is sent.
 */

import type { Recipe } from '@/lib/kitchen'
import { planHeaders } from '@/lib/plan'

const API = import.meta.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'

export const MISSED = [
  { id: 'ingredient', label: 'An ingredient' },
  { id: 'step', label: 'A step' },
  { id: 'timing', label: 'The timing' },
  { id: 'amounts', label: 'The amounts' },
  { id: 'other', label: 'Something else' },
] as const
export type Missed = (typeof MISSED)[number]['id']

export type Sent = 'ok' | 'limit' | 'failed'

export async function sendFeedback(token: string | null, recipe: Recipe, verdict: 'good' | 'missed', missed: Missed[] = [], note = ''): Promise<Sent> {
  try {
    const res = await fetch(`${API}/v1/feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...planHeaders(token) },
      body: JSON.stringify({
        recipeId: recipe.id,
        title: recipe.title,
        verdict,
        missed,
        note: note.trim().slice(0, 500),
        ingredients: recipe.ingredients,
        steps: recipe.instructions,
      }),
    })
    if (res.status === 429) return 'limit'
    return res.ok ? 'ok' : 'failed'
  } catch {
    return 'failed'
  }
}
