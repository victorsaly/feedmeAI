/*
 * The three calls behind the flow: photo → what you've got → draft ideas →
 * one idea expanded into a recipe. Each goes to the model through
 * feedmeai-api (which holds the key and meters the calls) and falls back to
 * the bundled recipes (scored by ingredient overlap) when the worker says
 * no model is configured, so the app still does something honest offline.
 * Signed in, real recipes from Spoonacular join the draft alongside the
 * model's, and open as the published site wrote them. Every result says
 * which it was via `source`.
 */
import { recipes as localRecipes, categories } from '@/data'
import { fetchRecipe, findRecipes, isSpoonacular, type Video } from '@/lib/spoonacular'

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'dessert'

export const MEALS: { id: Meal; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'dessert', label: 'Dessert' },
]

const MEAL_STORAGE_KEY = 'feedme-meal'

/** Breakfast till 11, lunch till 5, dinner the rest. Dessert is never guessed
 *  for you — it's a craving, not a time of day. */
export function mealForNow(date = new Date()): Meal {
  const h = date.getHours()
  if (h >= 4 && h < 11) return 'breakfast'
  if (h >= 11 && h < 17) return 'lunch'
  return 'dinner'
}

/** The meal you picked last time, or the one the clock suggests. */
export function loadMeal(): Meal {
  try {
    const stored = localStorage.getItem(MEAL_STORAGE_KEY)
    if (stored && MEALS.some((m) => m.id === stored)) return stored as Meal
  } catch {
    // storage blocked — fall through to the time-based guess
  }
  return mealForNow()
}

export function saveMeal(meal: Meal): void {
  try {
    localStorage.setItem(MEAL_STORAGE_KEY, meal)
  } catch {
    // ignore — the picker still works for this visit
  }
}

export interface Nutrition {
  /** per serving; estimated, never a lab measurement */
  calories: number
  protein: string
  carbs: string
  fat: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  cookingTime: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  ingredients: string[]
  instructions: string[]
  /** per serving, estimated — from the built-in data or asked of the model */
  nutrition?: Nutrition
  /** the photo it came from, kept with a saved recipe */
  originalImageBase64?: string
  /** a representative photo of the finished dish, for a built-in recipe */
  image?: string
  /** a generated look at a genuinely new AI idea, fetched once, lazily */
  previewImage?: string
  /** who published it, for a real recipe — shown and linked, as its licence asks */
  credit?: { name: string; url: string }
  /** someone making it; undefined = not looked yet, null = looked, nothing */
  video?: Video | null
  createdAt: string
  isFavorite?: boolean
}

export interface Ingredient {
  name: string
  /** 0–1 from the vision model; undefined when the user typed it */
  confidence?: number
  /** a rough visual guess — "a small piece", "plenty" — never a measurement;
   *  undefined when the user typed the item in themselves */
  amount?: string
}

export interface Idea {
  id: string
  title: string
  /** one line on why this works with what you have */
  blurb: string
  minutes: number
  /** detected items this idea uses, by name */
  uses: string[]
  /** things you would still need (pantry staples excluded) */
  missing: string[]
  source: Source
  /** a representative photo of the finished dish, for a built-in or real recipe */
  image?: string
}

/** `ai` the model wrote it; `spoonacular` a published recipe; `local` bundled. */
export type Source = 'ai' | 'spoonacular' | 'local'

const API = import.meta.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'

const PANTRY = [
  'salt', 'pepper', 'oil', 'olive oil', 'butter', 'sugar', 'flour', 'water',
  'vinegar', 'soy sauce', 'garlic powder', 'onion powder', 'dried herbs',
]

export class KitchenError extends Error {
  constructor(public kind: 'auth' | 'busy' | 'http', message: string) {
    super(message)
  }
}

/** What to tell the person when a call fails. */
export function explain(err: unknown, fallback: string): string {
  return err instanceof KitchenError ? err.message : fallback
}

/** Whether the worker has a model behind it. Assumed until the worker
 *  says otherwise — either from `probeAI()` at startup or a 503 on any
 *  call — so a cold start still tries the real thing first. */
let aiReady = true

export function hasKey(): boolean {
  return aiReady
}

export async function probeAI(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/v1/ai`, { cache: 'no-store' })
    if (res.ok) aiReady = Boolean(((await res.json()) as { ready?: boolean }).ready)
  } catch {
    // unreachable: leave the assumption; a call will settle it
  }
  return aiReady
}

class NotConfigured extends Error {}

async function ask<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await fetch(`${API}/v1/ai/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  if (res.status === 503) { aiReady = false; throw new NotConfigured() }
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T
  if (res.status === 401) throw new KitchenError('auth', 'Sign in to do that.')
  if (res.status === 429) throw new KitchenError('busy', data.error ?? 'The AI is busy right now. Try again in a moment.')
  if (!res.ok) throw new KitchenError('http', data.error ?? `The kitchen answered ${res.status}.`)
  return data
}

/* ---------- 1. what's in the photo ---------- */

export async function identify(imageDataUrl: string, token?: string | null): Promise<{ items: Ingredient[]; source: Source }> {
  if (!hasKey()) {
    await wait(900)
    return { items: DEMO_ITEMS, source: 'local' }
  }
  let out: { ingredients: { name: string; confidence: number; amount?: string }[] }
  try {
    out = await ask('identify', { image: imageDataUrl }, token)
  } catch (err) {
    if (!(err instanceof NotConfigured)) throw err
    return { items: DEMO_ITEMS, source: 'local' }
  }
  const items = (out.ingredients ?? [])
    .filter((i) => i && typeof i.name === 'string' && i.name.trim())
    .map((i) => ({ name: i.name.trim().toLowerCase(), confidence: clamp(i.confidence), amount: cleanAmount(i.amount) }))
  return { items: dedupe(items), source: 'ai' }
}

/* ---------- 2. draft ideas from the list ---------- */

/** The model's ideas (or the built-in ones without a key), with real
 *  recipes from Spoonacular woven in when signed in. The two run at once;
 *  a Spoonacular miss costs nothing, and a model failure still shows the
 *  real recipes rather than an error when there are any. `source` names
 *  the list's lead voice, which is what the heading note reports. */
export async function suggest(items: Ingredient[], meal: Meal = 'dinner', token?: string | null): Promise<{ ideas: Idea[]; source: Source }> {
  const names = items.map((i) => i.name)
  const real = token ? findRecipes(token, names, meal) : Promise.resolve<Idea[]>([])

  let drafted: Idea[]
  let source: Source
  try {
    if (hasKey()) {
      drafted = await aiIdeas(items, meal, token)
      source = 'ai'
    } else {
      await wait(700)
      drafted = localIdeas(names, meal)
      source = 'local'
    }
  } catch (err) {
    if (err instanceof NotConfigured) {
      drafted = localIdeas(names, meal)
      source = 'local'
    } else {
      const found = await real
      if (!found.length) throw err
      return { ideas: found, source: 'spoonacular' }
    }
  }

  const found = await real
  if (!found.length) return { ideas: drafted, source }
  // Same dish from both sides: keep the real one, it has the photo. Then
  // real recipes lead a built-in list; with the model they alternate so a
  // photo sits in every other row rather than all at the bottom.
  const fresh = drafted.filter((d) => !found.some((f) => sameTitle(f.title, d.title)))
  const merged = source === 'local' ? [...found, ...fresh] : interleave(fresh, found)
  return { ideas: merged, source: source === 'local' ? 'spoonacular' : 'ai' }
}

async function aiIdeas(items: Ingredient[], meal: Meal, token?: string | null): Promise<Idea[]> {
  const names = items.map((i) => i.name)
  const payload = items.map((i) => ({ name: i.name, amount: i.amount }))
  const out = await ask<{ ideas: Omit<Idea, 'id' | 'source'>[] }>('suggest', { items: payload, meal }, token)
  return (out.ideas ?? []).slice(0, 6).map((i, n) => ({
    id: `ai-${Date.now()}-${n}`,
    title: str(i.title),
    blurb: str(i.blurb),
    minutes: Number(i.minutes) || 30,
    uses: arr(i.uses).filter((u) => names.includes(u)),
    missing: arr(i.missing),
    source: 'ai' as const,
  }))
}

/* ---------- 3. one idea, written out ---------- */

/** A real recipe comes back as published — the model never rewrites it. If
 *  that fetch fails (quota, signed out since) the model writes it from the
 *  title instead, and without a key the sheet says so. */
export async function expand(idea: Idea, items: Ingredient[], token?: string | null): Promise<Recipe> {
  if (isSpoonacular(idea.id)) {
    const real = token ? await fetchRecipe(token, idea) : null
    if (real) return real
    if (!hasKey()) throw new KitchenError('http', 'Sign in to open this recipe.')
  }
  const local = localRecipes.find((r) => r.id === idea.id)
  if (local || !hasKey()) {
    await wait(local ? 300 : 700)
    const r = local ?? localRecipes[0]
    return toRecipe(r)
  }
  let out: {
    description: string
    minutes: number
    difficulty: 'Easy' | 'Medium' | 'Hard'
    ingredients: string[]
    steps: string[]
    nutrition?: { calories: number; protein: string; carbs: string; fat: string }
  }
  try {
    out = await ask('expand', {
      title: idea.title,
      blurb: idea.blurb,
      items: items.map((i) => ({ name: i.name, amount: i.amount })),
      uses: idea.uses,
      missing: idea.missing,
    }, token)
  } catch (err) {
    if (!(err instanceof NotConfigured)) throw err
    await wait(300)
    return toRecipe(localRecipes[0])
  }
  return {
    id: idea.id,
    title: idea.title,
    description: str(out.description) || idea.blurb,
    cookingTime: `${Number(out.minutes) || idea.minutes} minutes`,
    difficulty: (['Easy', 'Medium', 'Hard'] as const).includes(out.difficulty) ? out.difficulty : 'Easy',
    ingredients: arr(out.ingredients),
    instructions: arr(out.steps),
    nutrition: toNutrition(out.nutrition),
    image: idea.image,
    createdAt: new Date().toISOString(),
  }
}

function toNutrition(n: unknown): Nutrition | undefined {
  if (!n || typeof n !== 'object') return undefined
  const { calories, protein, carbs, fat } = n as Record<string, unknown>
  if (typeof calories !== 'number') return undefined
  return {
    calories: Math.round(calories),
    protein: typeof protein === 'string' ? protein : '—',
    carbs: typeof carbs === 'string' ? carbs : '—',
    fat: typeof fat === 'string' ? fat : '—',
  }
}

/* ---------- local fallback ---------- */

type LocalRecipe = (typeof localRecipes)[number]

function toRecipe(r: LocalRecipe): Recipe {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    cookingTime: r.totalTime,
    difficulty: (r.difficulty as Recipe['difficulty']) ?? 'Easy',
    ingredients: r.ingredients,
    instructions: r.instructions,
    image: r.heroImage,
    nutrition: r.nutrition,
    createdAt: new Date().toISOString(),
  }
}

/** The built-in recipes tagged for one meal — for browsing, not scoring. */
export function recipesForMeal(meal: Meal): LocalRecipe[] {
  return localRecipes.filter((r) => r.meal?.includes(meal))
}

/** A chip on the Recipes tab. `kind`/`value` is what Spoonacular is asked
 *  for; `tags` is what the built-in recipes are matched on without it. */
export interface Category {
  id: string
  name: string
  kind: 'cuisine' | 'type' | 'diet' | 'quick' | 'query'
  value: string
  tags: string[]
}

export const CATEGORIES: Category[] = categories as Category[]

/** The built-ins that fit some words and/or a category. Words match the
 *  title, tags and ingredients; a category matches its tags, its name as
 *  the recipe's own category, or (for "quick") the time. Only the meal is
 *  applied when there's nothing else to go on. */
export function localSearch(q: string, category: Category | undefined, meal: Meal): Idea[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const pool = words.length || category ? localRecipes : recipesForMeal(meal)
  return pool
    .filter((r) => {
      const hay = [r.title, r.category, ...(r.tags ?? []), ...r.ingredients].join(' ').toLowerCase()
      if (!words.every((w) => hay.includes(w))) return false
      if (!category) return true
      if (category.kind === 'quick') return (parseInt(r.totalTime) || 99) <= Number(category.value)
      const own = [r.category, ...(r.tags ?? [])].map((t) => t.toLowerCase())
      return category.tags.some((t) => own.includes(t))
    })
    .map(ideaFromLocal)
}

/** Score the bundled recipes by how many of the user's items they mention.
 *  Prefers the ones tagged for this meal; only six recipes exist in total,
 *  so an empty meal-matched set falls back to the full list rather than
 *  showing nothing. */
export function localIdeas(names: string[], meal: Meal = 'dinner'): Idea[] {
  const have = names.map((n) => n.toLowerCase())
  const matching = recipesForMeal(meal)
  const pool = matching.length > 0 ? matching : localRecipes
  return pool
    .map((r) => {
      const uses = have.filter((h) => r.ingredients.some((ing) => ing.toLowerCase().includes(h)))
      const missing = r.ingredients
        .filter((ing) => !have.some((h) => ing.toLowerCase().includes(h)))
        .filter((ing) => !PANTRY.some((p) => ing.toLowerCase().includes(p)))
        .map(shortName)
        .slice(0, 3)
      return {
        id: r.id,
        title: r.title,
        blurb: r.description,
        minutes: parseInt(r.totalTime) || 30,
        uses,
        missing,
        source: 'local' as const,
        image: r.heroImage,
      }
    })
    .sort((a, b) => b.uses.length - a.uses.length || a.minutes - b.minutes)
    .slice(0, 5)
}

/** A generated look at a novel AI idea. Decorative and best-effort: no key,
 *  no network, or a failed generation all just mean no image — never a
 *  stand-in photo passed off as the real thing. Costs real money per call,
 *  so the worker only does it for someone signed in. */
export async function generateDishImage(idea: Idea, token: string): Promise<string | undefined> {
  if (!hasKey() || idea.source !== 'ai') return undefined
  try {
    const { url } = await ask<{ url: string | null }>('image', { title: idea.title, blurb: idea.blurb }, token)
    return url ?? undefined
  } catch {
    return undefined
  }
}

/** A saved recipe as an Idea, so it opens in the same sheet. */
export function ideaFromRecipe(r: Recipe): Idea {
  return {
    id: r.id,
    title: r.title,
    blurb: r.description,
    minutes: parseInt(r.cookingTime) || 30,
    uses: [],
    missing: [],
    source: 'local',
    image: r.image,
  }
}

/** Turn a local recipe into an Idea so quick picks open in the same sheet. */
export function ideaFromLocal(r: LocalRecipe): Idea {
  return {
    id: r.id,
    title: r.title,
    blurb: r.description,
    minutes: parseInt(r.totalTime) || 30,
    uses: [],
    missing: [],
    source: 'local',
    image: r.heroImage,
  }
}

/* ---------- helpers ---------- */

const DEMO_ITEMS: Ingredient[] = [
  { name: 'tomatoes', confidence: 0.92, amount: 'a couple' },
  { name: 'red onion', confidence: 0.88, amount: 'one' },
  { name: 'garlic', confidence: 0.85, amount: 'a few cloves' },
  { name: 'bell pepper', confidence: 0.79, amount: 'one' },
  { name: 'eggs', confidence: 0.76, amount: 'half a dozen' },
  { name: 'parmesan', confidence: 0.64, amount: 'a small piece' },
  { name: 'spaghetti', confidence: 0.58, amount: 'one packet' },
]

/** "1/2 cup Parmesan cheese, grated" → "parmesan cheese" */
function shortName(line: string): string {
  return line
    .replace(/^[\d\s/.,-]+((?:oz|lbs?|kg|g|ml|l|cups?|tbsp|tsp|cloves?|slices?|cans?|large|medium|small|boneless|skinless)\b\.?\s*)*/i, '')
    .split(',')[0]
    .replace(/\s*\(.*?\)/g, '')
    .trim()
    .toLowerCase()
}

function dedupe(items: Ingredient[]): Ingredient[] {
  const seen = new Set<string>()
  return items.filter((i) => (seen.has(i.name) ? false : (seen.add(i.name), true)))
}

/** a, b, a, b … then whatever is left of the longer list */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = []
  for (let n = 0; n < Math.max(a.length, b.length); n++) {
    if (n < a.length) out.push(a[n])
    if (n < b.length) out.push(b[n])
  }
  return out
}

const sameTitle = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
const clamp = (n: unknown) => (typeof n === 'number' ? Math.min(1, Math.max(0, n)) : undefined)
/** A short, rough phrase ("a small piece") — never a fabricated measurement. */
function cleanAmount(a: unknown): string | undefined {
  if (typeof a !== 'string') return undefined
  const t = a.trim()
  return t ? t.slice(0, 40) : undefined
}
const str = (s: unknown) => (typeof s === 'string' ? s.trim() : '')
const arr = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : [])
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
