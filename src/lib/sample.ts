/**
 * One run, kept: a photo, what was read in it, the ideas drawn from it and
 * every recipe written out. It is a `Haul`, the same shape history keeps, so
 * opening it is the same code path as reopening an earlier photo — and like
 * that, it makes no network call. It shows a newcomer a result before they
 * spend a photo, and gives the film and the tests a run that never changes.
 *
 * Every recipe is the model's own words (`recorded` in the data says so);
 * `scripts/record-sample.mjs` records any that are not.
 */

import data from '@/data/sample.json'
import type { Haul } from '@/lib/history'
import type { Idea, Meal, Recipe } from '@/lib/kitchen'

const ID = 'sample'
const WHEN = '2026-09-26T18:00:00.000Z'

export const isSample = (id: string | undefined) => id === ID || Boolean(id?.startsWith(`${ID}-`))

const ideas: Idea[] = data.ideas.map((i, n) => ({
  id: `${ID}-${n}`,
  title: i.title,
  blurb: i.blurb,
  minutes: i.recipe.minutes, // the written recipe's time, so the row and the sheet agree
  uses: i.uses,
  missing: i.missing,
  source: 'ai',
}))

const recipes: Record<string, Recipe> = Object.fromEntries(
  data.ideas.map((i, n) => [`${ID}-${n}`, {
    id: `${ID}-${n}`,
    title: i.title,
    description: i.recipe.description,
    cookingTime: `${i.recipe.minutes} minutes`,
    difficulty: i.recipe.difficulty as Recipe['difficulty'],
    ingredients: i.recipe.ingredients,
    instructions: i.recipe.steps,
    nutrition: i.recipe.nutrition,
    video: null, // looked, nothing: so opening one never goes looking
    createdAt: WHEN,
  }]),
)

export const SAMPLE: Haul = {
  id: ID,
  createdAt: WHEN,
  meal: data.meal as Meal,
  photo: data.photo,
  photoLarge: data.photo,
  items: data.items,
  ideas,
  source: 'ai',
  recipes,
}
