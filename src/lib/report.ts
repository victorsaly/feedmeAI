/**
 * Telling us a recipe is wrong. The recipes are written by a model, so the
 * app has to offer this (and the App Store requires it). It goes to
 * feedmeai-api, which keeps the recipe as shown, the reason and the note.
 * It needs no account.
 */

import type { Recipe, Source } from '@/lib/kitchen'

const API = import.meta.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'

export const REASONS = [
  { id: 'unsafe', label: 'Unsafe', hint: 'It could hurt someone: raw meat, a dangerous method, an allergen passed off as safe.' },
  { id: 'wrong', label: 'Wrong', hint: 'It does not work: amounts, times or steps that make no sense.' },
  { id: 'other', label: 'Something else', hint: '' },
] as const
export type Reason = (typeof REASONS)[number]['id']

export type Sent = 'ok' | 'limit' | 'failed'

export async function sendReport(token: string | null, recipe: Recipe, source: Source | undefined, reason: Reason, note: string): Promise<Sent> {
  try {
    const res = await fetch(`${API}/v1/reports`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ title: recipe.title, reason, note: note.trim().slice(0, 500), source, ingredients: recipe.ingredients, steps: recipe.instructions }),
    })
    if (res.status === 429) return 'limit'
    return res.ok ? 'ok' : 'failed'
  } catch {
    return 'failed'
  }
}
