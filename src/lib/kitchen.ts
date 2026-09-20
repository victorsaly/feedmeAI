/*
 * The three calls behind the flow: photo → what you've got → draft ideas →
 * one idea expanded into a recipe. Each goes to OpenAI when a key is set and
 * falls back to the bundled recipes (scored by ingredient overlap) when it is
 * not, so the app still does something honest offline. Every result says
 * which it was via `source`.
 */
import { recipes as localRecipes } from '@/data'

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
  createdAt: string
  isFavorite?: boolean
}

export interface Ingredient {
  name: string
  /** 0–1 from the vision model; undefined when the user typed it */
  confidence?: number
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
  source: 'ai' | 'local'
  /** a representative photo of the finished dish, for a built-in recipe */
  image?: string
}

export type Source = 'ai' | 'local'

const API = 'https://api.openai.com/v1/chat/completions'
const IMAGES_API = 'https://api.openai.com/v1/images/generations'
const MODEL = 'gpt-4o-mini'

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

export function hasKey(): boolean {
  return Boolean(import.meta.env.VITE_OPENAI_API_KEY)
}

async function chatJSON<T>(system: string, user: unknown[], maxTokens: number): Promise<T> {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (res.status === 401) throw new KitchenError('auth', 'The AI key was rejected. Check VITE_OPENAI_API_KEY.')
  if (res.status === 429) throw new KitchenError('busy', 'The AI is rate-limited right now. Try again in a moment.')
  if (!res.ok) throw new KitchenError('http', `OpenAI answered ${res.status}.`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response')
  return JSON.parse(content) as T
}

/* ---------- 1. what's in the photo ---------- */

export async function identify(imageDataUrl: string): Promise<{ items: Ingredient[]; source: Source }> {
  if (!hasKey()) {
    await wait(900)
    return { items: DEMO_ITEMS, source: 'local' }
  }
  const out = await chatJSON<{ ingredients: { name: string; confidence: number }[] }>(
    'You list the food ingredients visible in a photo of a fridge, cupboard, or worktop. ' +
      'Be specific ("red bell pepper", "cheddar"), skip kitchenware and packaging you cannot read, ' +
      'merge duplicates, and give each a confidence from 0.5 to 1. Lowercase names. ' +
      'Reply with JSON: {"ingredients":[{"name":"...","confidence":0.9}]}',
    [
      { type: 'text', text: 'What food is in this photo?' },
      { type: 'image_url', image_url: { url: imageDataUrl, detail: 'low' } },
    ],
    500,
  )
  const items = (out.ingredients ?? [])
    .filter((i) => i && typeof i.name === 'string' && i.name.trim())
    .map((i) => ({ name: i.name.trim().toLowerCase(), confidence: clamp(i.confidence) }))
  return { items: dedupe(items), source: 'ai' }
}

/* ---------- 2. draft ideas from the list ---------- */

export async function suggest(items: Ingredient[], meal: Meal = 'dinner'): Promise<{ ideas: Idea[]; source: Source }> {
  const names = items.map((i) => i.name)
  if (!hasKey()) {
    await wait(700)
    return { ideas: localIdeas(names, meal), source: 'local' }
  }
  const phrase = MEAL_PHRASE[meal]
  const out = await chatJSON<{ ideas: Omit<Idea, 'id' | 'source'>[] }>(
    `You are a practical home cook. Given what someone has in, propose 5 ${phrase} they could make. ` +
      'Prefer dishes that use several of their items and need at most 2–3 extras beyond pantry staples ' +
      '(salt, pepper, oil, butter, sugar, flour, vinegar, soy sauce, stock, dried herbs and spices). ' +
      'Mix quick and slower, plain and interesting. "uses" must repeat their item names exactly. ' +
      'Reply with JSON: {"ideas":[{"title":"...","blurb":"one sentence, why it suits what they have",' +
      '"minutes":25,"uses":["..."],"missing":["..."]}]}',
    [{ type: 'text', text: `They have: ${names.join(', ')}.` }],
    900,
  )
  const ideas = (out.ideas ?? []).slice(0, 6).map((i, n) => ({
    id: `ai-${Date.now()}-${n}`,
    title: str(i.title),
    blurb: str(i.blurb),
    minutes: Number(i.minutes) || 30,
    uses: arr(i.uses).filter((u) => names.includes(u)),
    missing: arr(i.missing),
    source: 'ai' as const,
  }))
  return { ideas, source: 'ai' }
}

/* ---------- 3. one idea, written out ---------- */

export async function expand(idea: Idea, items: Ingredient[]): Promise<Recipe> {
  const local = localRecipes.find((r) => r.id === idea.id)
  if (local || !hasKey()) {
    await wait(local ? 300 : 700)
    const r = local ?? localRecipes[0]
    return toRecipe(r)
  }
  const out = await chatJSON<{
    description: string
    minutes: number
    difficulty: 'Easy' | 'Medium' | 'Hard'
    ingredients: string[]
    steps: string[]
    nutrition?: { calories: number; protein: string; carbs: string; fat: string }
  }>(
    'Write a clear, reliable home recipe. Metric and imperial quantities where useful. ' +
      'Short numbered steps, each one action, with the timing or cue for doneness inside the step. ' +
      'Also estimate the nutrition per serving as best you reasonably can from the ingredients — ' +
      'say so is an estimate, not a lab figure. ' +
      'Reply with JSON: {"description":"two sentences","minutes":25,"difficulty":"Easy|Medium|Hard",' +
      '"ingredients":["quantity + item", ...],"steps":["...", ...],' +
      '"nutrition":{"calories":420,"protein":"18g","carbs":"52g","fat":"14g"}}',
    [
      {
        type: 'text',
        text:
          `Recipe: ${idea.title}. ${idea.blurb}\n` +
          `They have: ${items.map((i) => i.name).join(', ')}.\n` +
          `Build it around: ${idea.uses.join(', ')}. Extras allowed: ${idea.missing.join(', ') || 'pantry staples only'}.`,
      },
    ],
    1200,
  )
  return {
    id: idea.id,
    title: idea.title,
    description: str(out.description) || idea.blurb,
    cookingTime: `${Number(out.minutes) || idea.minutes} minutes`,
    difficulty: (['Easy', 'Medium', 'Hard'] as const).includes(out.difficulty) ? out.difficulty : 'Easy',
    ingredients: arr(out.ingredients),
    instructions: arr(out.steps),
    nutrition: toNutrition(out.nutrition),
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

const MEAL_PHRASE: Record<Meal, string> = {
  breakfast: 'breakfast dishes',
  lunch: 'lunches',
  dinner: 'dinners',
  dessert: 'desserts',
}

/** The built-in recipes tagged for one meal — for browsing, not scoring. */
export function recipesForMeal(meal: Meal): LocalRecipe[] {
  return localRecipes.filter((r) => r.meal?.includes(meal))
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
 *  stand-in photo passed off as the real thing. */
export async function generateDishImage(idea: Idea): Promise<string | undefined> {
  if (!hasKey() || idea.source !== 'ai') return undefined
  try {
    const res = await fetch(IMAGES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt:
          `A simple, appetising photo of the finished dish "${idea.title}" — ${idea.blurb} ` +
          'Natural light, on a plate, shot from above. No text, no hands, no branding.',
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    })
    if (!res.ok) return undefined
    const data = await res.json()
    return data.data?.[0]?.url as string | undefined
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
  { name: 'tomatoes', confidence: 0.92 },
  { name: 'red onion', confidence: 0.88 },
  { name: 'garlic', confidence: 0.85 },
  { name: 'bell pepper', confidence: 0.79 },
  { name: 'eggs', confidence: 0.76 },
  { name: 'parmesan', confidence: 0.64 },
  { name: 'spaghetti', confidence: 0.58 },
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
const clamp = (n: unknown) => (typeof n === 'number' ? Math.min(1, Math.max(0, n)) : undefined)
const str = (s: unknown) => (typeof s === 'string' ? s.trim() : '')
const arr = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : [])
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
