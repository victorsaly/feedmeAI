import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// kitchen.ts remembers whether the Worker has a model behind it, so each test
// gets a fresh copy of the module.
let kitchen: typeof import('@/lib/kitchen')
beforeEach(async () => { vi.resetModules(); kitchen = await import('@/lib/kitchen') })
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear() })

/** The Worker, answering each /v1/ai/<path> with a status and a body. */
function worker(routes: Record<string, { status?: number; body: unknown }>) {
  const seen: { path: string; body: unknown; auth: string | null; device: string | null }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname.replace('/v1/ai/', '')
    seen.push({ path, body: init?.body ? JSON.parse(String(init.body)) : null, auth: (init?.headers as Record<string, string> | undefined)?.authorization ?? null, device: (init?.headers as Record<string, string> | undefined)?.['x-feedme-device'] ?? null })
    const hit = routes[path]
    if (!hit) return new Response('{}', { status: 404 })
    return new Response(JSON.stringify(hit.body), { status: hit.status ?? 200 })
  }))
  return seen
}

describe('mealForNow', () => {
  const at = (h: number) => new Date(2026, 10, 21, h)
  it.each([[4, 'breakfast'], [10, 'breakfast'], [11, 'lunch'], [16, 'lunch'], [17, 'dinner'], [23, 'dinner'], [2, 'dinner']] as const)(
    '%i:00 is %s', (h, meal) => expect(kitchen.mealForNow(at(h))).toBe(meal),
  )

  it('never guesses dessert, and a saved choice beats the clock', () => {
    for (let h = 0; h < 24; h++) expect(kitchen.mealForNow(at(h))).not.toBe('dessert')
    kitchen.saveMeal('dessert')
    expect(kitchen.loadMeal()).toBe('dessert')
  })
})

describe('the built-in recipes', () => {
  it('ranks by how much of your fridge each uses, and names what is missing without staples', () => {
    const ideas = kitchen.localIdeas(['spaghetti', 'garlic', 'parmesan'], 'dinner')
    expect(ideas.length).toBeGreaterThan(0)
    expect(ideas.length).toBeLessThanOrEqual(5)
    const uses = ideas.map((i) => i.uses.length)
    expect(uses).toEqual([...uses].sort((a, b) => b - a))
    expect(ideas[0].uses.length).toBeGreaterThan(0)
    for (const i of ideas) {
      expect(i.source).toBe('local')
      expect(i.missing.length).toBeLessThanOrEqual(3)
      for (const m of i.missing) expect(m).not.toMatch(/\b(salt|olive oil|butter)\b/)
    }
  })

  it('falls back to every recipe when none is tagged for the meal', () => {
    expect(kitchen.recipesForMeal('dessert')).toEqual([])
    expect(kitchen.localIdeas(['eggs'], 'dessert').length).toBeGreaterThan(0)
  })

  it('searches by word and by category, and browsing shows the meal\'s own', () => {
    expect(kitchen.localSearch('', undefined, 'dinner').map((i) => i.id)).toEqual(kitchen.recipesForMeal('dinner').map((r) => r.id))
    expect(kitchen.localSearch('salmon', undefined, 'dinner').every((i) => /salmon/i.test(i.title))).toBe(true)
    expect(kitchen.localSearch('no such dish', undefined, 'dinner')).toEqual([])
    const quick = kitchen.CATEGORIES.find((c) => c.kind === 'quick')!
    for (const i of kitchen.localSearch('', quick, 'dinner')) expect(i.minutes).toBeLessThanOrEqual(Number(quick.value))
  })
})

describe('identify', () => {
  it('cleans what the model read: lower case, no blanks, no repeats, confidence within 0 to 1', async () => {
    const seen = worker({ identify: { body: { ingredients: [
      { name: ' Red Cabbage ', confidence: 0.9, amount: 'plenty' },
      { name: 'red cabbage', confidence: 0.5 },
      { name: '', confidence: 1 },
      { name: 'carrots', confidence: 7, amount: '   ' },
    ] } } })
    const { items, source } = await kitchen.identify('data:image/jpeg;base64,AAAA', 'tok')

    expect(source).toBe('ai')
    expect(items).toEqual([
      { name: 'red cabbage', confidence: 0.9, amount: 'plenty' },
      { name: 'carrots', confidence: 1, amount: undefined },
    ])
    expect(seen[0]).toMatchObject({ path: 'identify', auth: 'Bearer tok' })
  })

  it('passes on what the photo showed instead, when it had no food in it', async () => {
    worker({ identify: { body: { ingredients: [], seen: 'a shopping list interface' } } })
    expect(await kitchen.identify('data:image/jpeg;base64,AAAA')).toEqual({ items: [], source: 'ai', seen: 'a shopping list interface' })
    worker({ identify: { body: { ingredients: [{ name: 'eggs', confidence: 0.9 }] } } })
    expect((await kitchen.identify('data:image/jpeg;base64,AAAA')).seen).toBeUndefined()
  })

  it('shows the demo list, with no AI, when the Worker has no model', async () => {
    vi.useFakeTimers()
    worker({ identify: { status: 503, body: { error: 'off' } } })
    const first = await kitchen.identify('data:image/jpeg;base64,AAAA')
    expect(first.source).toBe('local')
    expect(first.items.length).toBeGreaterThan(0)
    expect(kitchen.hasKey()).toBe(false)
  })

  it('raises a used-up allowance as a plan limit, not an error, and names the device', async () => {
    const seen = worker({ identify: { status: 429, body: { error: "You've used today's 3 free photos. They come back tomorrow.", limit: 'photos', tier: 'free', used: 3, allowed: 3, per: 'day', resets: '2026-11-22T00:00:00.000Z' } } })
    const { PlanLimit, setPlansLive } = await import('@/lib/plan')
    setPlansLive(true)
    const err = await kitchen.identify('data:image/jpeg;base64,AAAA').catch((e) => e)
    expect(err).toBeInstanceOf(PlanLimit)
    expect(err.hit).toMatchObject({ limit: 'photos', used: 3, allowed: 3 })
    expect(kitchen.explain(err, 'fallback')).toBe("You've used today's 3 free photos. They come back tomorrow.")
    expect(seen[0].device).toMatch(/^[a-f0-9-]{16,}$/)
  })

  it('learns from the Worker whether it counts by plan, and only then names the device', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ready: true, plans: true })))
    const { planHeaders } = await import('@/lib/plan')
    expect(planHeaders()).toEqual({})
    await kitchen.probeAI()
    expect(planHeaders()['x-feedme-device']).toMatch(/^[a-f0-9-]{16,}$/)
  })

  it('says so in plain words when the daily limit is reached', async () => {
    worker({ identify: { status: 429, body: { error: 'limit for today' } } })
    const err = await kitchen.identify('data:image/jpeg;base64,AAAA').catch((e) => e)
    expect(err).toBeInstanceOf(kitchen.KitchenError)
    expect(err.kind).toBe('busy')
    expect(kitchen.explain(err, 'fallback')).toBe('limit for today')
    expect(kitchen.explain(new Error('x'), 'fallback')).toBe('fallback')
  })
})

describe('suggest', () => {
  const items = [{ name: 'broccoli', amount: 'a small piece' }, { name: 'spinach' }]

  it('keeps only "uses" that are really in the fridge, and sends the amounts', async () => {
    const seen = worker({ suggest: { body: { ideas: [{ title: 'Stir-Fry', blurb: 'Quick.', minutes: 20, uses: ['broccoli', 'unicorn'], missing: ['soy sauce'] }] } } })
    const { ideas, source } = await kitchen.suggest(items, 'dinner')

    expect(source).toBe('ai')
    expect(ideas).toHaveLength(1)
    expect(ideas[0]).toMatchObject({ title: 'Stir-Fry', minutes: 20, uses: ['broccoli'], missing: ['soy sauce'], source: 'ai' })
    expect(seen[0].body).toEqual({ items: [{ name: 'broccoli', amount: 'a small piece' }, { name: 'spinach' }], meal: 'dinner' })
  })

  it('shows at most six ideas', async () => {
    worker({ suggest: { body: { ideas: Array.from({ length: 9 }, (_, n) => ({ title: `Idea ${n}`, blurb: '', minutes: 10, uses: [], missing: [] })) } } })
    expect((await kitchen.suggest(items, 'lunch')).ideas).toHaveLength(6)
  })

  it('falls back to the built-in recipes when the Worker has no model', async () => {
    vi.useFakeTimers()
    worker({ suggest: { status: 503, body: {} } })
    const { ideas, source } = await kitchen.suggest([{ name: 'spaghetti' }], 'dinner')
    expect(source).toBe('local')
    expect(ideas.length).toBeGreaterThan(0)
  })

  it('passes a real failure on, so the screen can say what went wrong', async () => {
    worker({ suggest: { status: 500, body: { error: 'kitchen on fire' } } })
    await expect(kitchen.suggest(items, 'dinner')).rejects.toThrow('kitchen on fire')
  })
})

describe('expand', () => {
  const idea = { id: 'ai-1', title: 'Stir-Fry', blurb: 'Quick.', minutes: 20, uses: ['broccoli'], missing: ['soy sauce'], source: 'ai' as const }

  it('turns the model\'s answer into a recipe, trusting its time over the idea\'s', async () => {
    worker({ expand: { body: { description: 'A stir-fry.', minutes: 25, difficulty: 'Easy', ingredients: ['150g broccoli', 2], steps: ['Chop.', 'Fry.'], nutrition: { calories: 419.6, protein: '18g', carbs: '52g', fat: '14g' } } } })
    const recipe = await kitchen.expand(idea, [{ name: 'broccoli' }])

    expect(recipe).toMatchObject({
      id: 'ai-1',
      title: 'Stir-Fry',
      cookingTime: '25 minutes',
      difficulty: 'Easy',
      ingredients: ['150g broccoli'],
      instructions: ['Chop.', 'Fry.'],
      nutrition: { calories: 420, protein: '18g' },
    })
  })

  it('fills the gaps when the model leaves them: the idea\'s time and blurb, Easy, no nutrition', async () => {
    worker({ expand: { body: { difficulty: 'Impossible', ingredients: [], steps: [] } } })
    const recipe = await kitchen.expand(idea, [])
    expect(recipe).toMatchObject({ description: 'Quick.', cookingTime: '20 minutes', difficulty: 'Easy' })
    expect(recipe.nutrition).toBeUndefined()
  })

  it('opens a built-in recipe with no call at all', async () => {
    vi.useFakeTimers()
    const seen = worker({})
    const local = kitchen.recipesForMeal('dinner')[0]
    const pending = kitchen.expand(kitchen.ideaFromLocal(local), [])
    await vi.runAllTimersAsync()
    expect((await pending).title).toBe(local.title)
    expect(seen).toEqual([])
  })
})
