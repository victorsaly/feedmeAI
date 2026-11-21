import { describe, expect, it } from 'vitest'
import sample from '@/data/sample.json'
import { forStep, nameOf, sortIngredients, timeIn } from '@/lib/pantry'

const have = sample.items.map((i) => i.name)
const idea = (title: string) => sample.ideas.find((i) => i.title === title)!

describe('nameOf', () => {
  it.each([
    ['2 tablespoons soy sauce', 'soy sauce'],
    ['150g broccoli', 'broccoli'],
    ['1 avocado, sliced', 'avocado'],
    ['1/4 red cabbage, finely shredded', 'red cabbage'],
    ['A small handful of fresh herbs, chopped', 'fresh herbs'],
    ['Juice of 1 lime or lemon', 'lime or lemon'],
    ['Salt and pepper to taste', 'salt and pepper to taste'],
  ])('%s -> %s', (line, name) => expect(nameOf(line)).toBe(name))
})

describe('sortIngredients', () => {
  it('splits the stir-fry into what you have, what to buy and the cupboard', () => {
    const { recipe, missing } = idea('Vegetable Stir-Fry')
    expect(sortIngredients(recipe.ingredients, have, missing)).toEqual({
      have: ['150g broccoli', '50g green bell pepper', '200g spinach'],
      buy: ['2 tablespoons soy sauce', '1 teaspoon grated ginger'],
      cupboard: ['1 tablespoon vegetable oil', 'Salt and pepper to taste'],
    })
  })

  it('matches "lime or lemon juice" to a line that names either', () => {
    const lines = ['200g red cabbage, shredded', 'Juice of 1 lime or lemon', '1 lemon, juiced', 'Salt to taste']
    expect(sortIngredients(lines, ['red cabbage'], ['lime or lemon juice']).buy).toEqual(['Juice of 1 lime or lemon', '1 lemon, juiced'])
    // and in the recorded sample, whatever words the model chose for it
    const { recipe, missing } = idea('Cabbage and Carrot Slaw with Avocado')
    expect(sortIngredients(recipe.ingredients, have, missing).buy.join(' ')).toMatch(/lime|lemon/)
  })

  it('treats a staple as something to buy when the idea says it is missing', () => {
    expect(sortIngredients(['300g carrots', '2 tablespoons olive oil', 'Salt to taste'], ['carrots'], ['olive oil'])).toEqual({
      have: ['300g carrots'], buy: ['2 tablespoons olive oil'], cupboard: ['Salt to taste'],
    })
  })

  it('finds a plural in the fridge for a singular in the recipe', () => {
    expect(sortIngredients(['1 carrot, grated'], ['carrots']).have).toEqual(['1 carrot, grated'])
  })

  it('buys anything unknown when there is no missing list', () => {
    expect(sortIngredients(['200g halloumi', 'Salt'], ['spinach'])).toEqual({ have: [], buy: ['200g halloumi'], cupboard: ['Salt'] })
  })

  it('leaves every line in exactly one group, for every sample recipe', () => {
    for (const i of sample.ideas) {
      const s = sortIngredients(i.recipe.ingredients, have, i.missing)
      expect([...s.have, ...s.buy, ...s.cupboard].sort()).toEqual([...i.recipe.ingredients].sort())
    }
  })
})

describe('forStep', () => {
  const lines = idea('Vegetable Stir-Fry').recipe.ingredients
  const steps = idea('Vegetable Stir-Fry').recipe.steps

  it('names the ingredients a step uses, with their amounts', () => {
    expect(forStep(steps[3], lines)).toEqual(['150g broccoli', '50g green bell pepper'])
    expect(forStep(steps[5], lines)).toEqual(['200g spinach', '2 tablespoons soy sauce'])
  })

  it('does not light up the green pepper for "salt and pepper"', () => {
    expect(forStep(steps[6], lines)).toEqual(['Salt and pepper to taste'])
  })

  it('finds an ingredient by one distinctive word', () => {
    expect(forStep('Crumble the feta over the top.', ['60g feta cheese, crumbled', '100g spinach'])).toEqual(['60g feta cheese, crumbled'])
  })

  it('returns nothing for a step about no ingredient', () => {
    expect(forStep('Heat the oven to 200°C (180°C fan).', lines)).toEqual([])
  })
})

describe('timeIn', () => {
  it.each([
    ['stir-fry for 3-4 minutes until soft', 240],
    ['Roast for another 12–15 minutes', 900],
    ['over medium-high heat (about 2 minutes)', 120],
    ['Rest for 30 seconds', 30],
    ['Simmer for 5 to 10 mins', 600],
  ])('%s -> %i seconds', (step, seconds) => expect(timeIn(step)).toBe(seconds))

  it('is null when a step names no time, or an oven temperature', () => {
    expect(timeIn('Season with salt and pepper to taste before serving.')).toBeNull()
    expect(timeIn('Heat the oven to 200°C (180°C fan).')).toBeNull()
  })
})
