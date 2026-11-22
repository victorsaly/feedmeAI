import { afterEach, describe, expect, it, vi } from 'vitest'
import { isIllustrated, stepPicture } from '@/lib/steps'
import { PlanLimit } from '@/lib/plan'
import type { Recipe } from '@/lib/kitchen'

const recipe: Recipe = { id: 'r1', title: 'Vegetable Stir-Fry', description: '', cookingTime: '25 minutes', difficulty: 'Easy', ingredients: [], instructions: ['Chop.', 'Fry.'], createdAt: '2026-11-22T00:00:00Z' }
afterEach(() => vi.unstubAllGlobals())

describe('step pictures', () => {
  it('asks for one step of the whole recipe, and returns the lasting address', async () => {
    const fetch = vi.fn(async () => Response.json({ url: 'https://w.example/v1/pictures/abc' }))
    vi.stubGlobal('fetch', fetch)
    expect(await stepPicture('tok', recipe, 1)).toBe('https://w.example/v1/pictures/abc')
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/v1/ai/step-picture')
    expect(JSON.parse(String(init.body))).toEqual({ title: 'Vegetable Stir-Fry', steps: ['Chop.', 'Fry.'], n: 1 })
  })

  it('raises a used-up allowance as a plan limit, and a failure as no picture', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: "You've used this week's 1 free recipe with step pictures. It comes back on Monday.", limit: 'illustrated', tier: 'free', used: 1, allowed: 1, per: 'week', resets: '' }, { status: 429 })))
    await expect(stepPicture(null, recipe, 0)).rejects.toBeInstanceOf(PlanLimit)
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'no' }, { status: 502 })))
    expect(await stepPicture(null, recipe, 0)).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await stepPicture(null, recipe, 0)).toBeNull()
  })

  it('knows a recipe is illustrated once any step has a picture', () => {
    expect(isIllustrated(recipe)).toBe(false)
    expect(isIllustrated({ ...recipe, stepImages: [null, 'u'] })).toBe(true)
  })
})
