/**
 * A picture for each step of a recipe, asked of the Worker one step at a
 * time. The Worker keeps every picture it makes, so asking for one it has
 * already made costs nothing, and a recipe is only counted against the
 * allowance the first time any of its steps is pictured.
 */

import type { Recipe } from '@/lib/kitchen'
import { PlanLimit, limitFrom, planHeaders } from '@/lib/plan'

const API = import.meta.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'

/** The picture's lasting address, or null when it could not be made.
 *  Throws PlanLimit when the allowance for step pictures is used up. */
export async function stepPicture(token: string | null, recipe: Recipe, n: number): Promise<string | null> {
  let res: Response
  try {
    res = await fetch(`${API}/v1/ai/step-picture`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...planHeaders(token) },
      body: JSON.stringify({ title: recipe.title, steps: recipe.instructions, n }),
    })
  } catch {
    return null
  }
  const hit = await limitFrom(res)
  if (hit) throw new PlanLimit(hit)
  if (!res.ok) return null
  const url = ((await res.json().catch(() => null)) as { url?: unknown } | null)?.url
  return typeof url === 'string' ? url : null
}

/** Whether a recipe has had any of its steps pictured. */
export const isIllustrated = (r: Recipe) => Boolean(r.stepImages?.some(Boolean))
