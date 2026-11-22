import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendFeedback } from '@/lib/feedback'
import type { Recipe } from '@/lib/kitchen'

const recipe: Recipe = { id: 'ai-1', title: 'Vegetable Stir-Fry', description: '', cookingTime: '25 minutes', difficulty: 'Easy', ingredients: ['150g broccoli'], instructions: ['Chop.'], createdAt: '2026-11-22T00:00:00Z' }
afterEach(() => vi.unstubAllGlobals())

describe('saying how a recipe turned out', () => {
  it('sends the verdict, what was missing, a trimmed note and the recipe as cooked', async () => {
    const fetch = vi.fn(async () => Response.json({ ok: true }, { status: 201 }))
    vi.stubGlobal('fetch', fetch)
    expect(await sendFeedback(null, recipe, 'missed', ['ingredient', 'timing'], `  ${'x'.repeat(600)} `)).toBe('ok')
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/v1/feedback')
    const sent = JSON.parse(String(init.body))
    expect(sent).toMatchObject({ recipeId: 'ai-1', title: 'Vegetable Stir-Fry', verdict: 'missed', missed: ['ingredient', 'timing'], steps: ['Chop.'] })
    expect(sent.note).toHaveLength(500)
  })

  it('tells a daily limit apart from a failure, and never claims either was sent', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({}, { status: 429 })))
    expect(await sendFeedback(null, recipe, 'good')).toBe('limit')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await sendFeedback(null, recipe, 'good')).toBe('failed')
  })
})
