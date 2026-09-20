/**
 * Real recipes, with a real photo and often a video of someone making it —
 * from Spoonacular, through feedmeai-api so the key never reaches the
 * browser. Every call needs a session token and fails soft: an empty
 * result, never a thrown error, because these only ever add to what the
 * model or the built-in recipes already give.
 */

import type { Category, Idea, Meal, Nutrition, Recipe } from '@/lib/kitchen'

const API = import.meta.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'

const ID_PREFIX = 'sp-'

export interface Video {
  youtubeId: string
  title: string
  thumbnail: string | null
  seconds: number | null
}

interface FoundRecipe {
  id: number
  title: string
  image: string | null
  minutes: number | null
  uses: string[]
  missing: string[]
}

interface FullRecipe {
  id: number
  title: string
  image: string | null
  minutes: number | null
  servings: number | null
  summary: string
  ingredients: string[]
  steps: string[]
  nutrition: Nutrition | null
  sourceName: string | null
  sourceUrl: string | null
}

async function get<T>(path: string, token: string, params: Record<string, string>): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}?${new URLSearchParams(params)}`, {
      headers: { authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export const isSpoonacular = (id: string) => id.startsWith(ID_PREFIX)

/** Up to three real dishes that use the most of what's listed. `uses` is
 *  matched back to the person's own item names so the list reads the same
 *  as the model's ideas. */
export async function findRecipes(token: string, names: string[], meal: Meal): Promise<Idea[]> {
  if (!names.length) return []
  const data = await get<{ items: FoundRecipe[] }>('/v1/recipes/by-ingredients', token, {
    ingredients: names.join(','),
    meal,
    number: '3',
  })
  const have = names.map((n) => n.toLowerCase())
  return (data?.items ?? []).map((r) => ({
    id: `${ID_PREFIX}${r.id}`,
    title: r.title,
    blurb: r.uses.length
      ? `A real recipe that uses your ${r.uses.slice(0, 3).join(', ')}.`
      : 'A real recipe, with a photo of the finished dish.',
    minutes: r.minutes ?? 30,
    uses: have.filter((h) => r.uses.some((u) => u.includes(h) || h.includes(u))),
    missing: r.missing.slice(0, 3),
    source: 'spoonacular' as const,
    image: r.image ?? undefined,
  }))
}

/** Free-text search with an optional category, for the Recipes tab. The
 *  meal only narrows a browse (no words typed) — a typed search should
 *  find soup at dinner time. */
export async function searchRecipes(token: string, q: string, category: Category | undefined, meal: Meal): Promise<Idea[]> {
  const params: Record<string, string> = { number: '12' }
  if (q) params.q = q
  if (category?.kind === 'cuisine') params.cuisine = category.value
  if (category?.kind === 'type') params.type = category.value
  if (category?.kind === 'diet') params.diet = category.value
  if (category?.kind === 'quick') params.maxReadyTime = category.value
  if (category?.kind === 'query') params.q = [category.value, q].filter(Boolean).join(' ')
  if (!q && category?.kind !== 'type') params.meal = meal
  const data = await get<{ items: FoundRecipe[] }>('/v1/recipes/search', token, params)
  return (data?.items ?? []).map((r) => ({
    id: `${ID_PREFIX}${r.id}`,
    title: r.title,
    blurb: r.minutes ? `A published recipe, about ${r.minutes} minutes.` : 'A published recipe.',
    minutes: r.minutes ?? 30,
    uses: [],
    missing: [],
    source: 'spoonacular' as const,
    image: r.image ?? undefined,
  }))
}

/** The full recipe, as the site that published it wrote it. */
export async function fetchRecipe(token: string, idea: Idea): Promise<Recipe | null> {
  const data = await get<{ recipe: FullRecipe }>(`/v1/recipes/${idea.id.slice(ID_PREFIX.length)}`, token, {})
  const r = data?.recipe
  if (!r || !r.ingredients.length || !r.steps.length) return null
  const minutes = r.minutes ?? idea.minutes
  return {
    id: idea.id,
    title: r.title || idea.title,
    description: r.summary || idea.blurb,
    cookingTime: `${minutes} minutes`,
    difficulty: minutes <= 25 ? 'Easy' : minutes <= 50 ? 'Medium' : 'Hard',
    ingredients: r.ingredients,
    instructions: r.steps,
    nutrition: r.nutrition ?? undefined,
    image: r.image ?? idea.image,
    credit: r.sourceUrl ? { name: r.sourceName ?? 'the original recipe', url: r.sourceUrl } : undefined,
    createdAt: new Date().toISOString(),
  }
}

/** A photo of a published dish by that name, for an idea that has none. */
export async function findImage(token: string, title: string): Promise<string | undefined> {
  const data = await get<{ image: string | null }>('/v1/recipes/image', token, { q: title })
  return data?.image ?? undefined
}

/** One video of the dish being made, or null when nothing matches. */
export async function findVideo(token: string, title: string): Promise<Video | null> {
  const data = await get<{ video: Video | null }>('/v1/recipes/videos', token, { q: title })
  return data?.video ?? null
}
