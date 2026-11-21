import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendReport } from '@/lib/report'
import { deleteAccountData } from '@/lib/account'
import type { Recipe } from '@/lib/kitchen'

const recipe: Recipe = { id: 'r1', title: 'Vegetable Stir-Fry', description: '', cookingTime: '25 minutes', difficulty: 'Easy', ingredients: ['150g broccoli'], instructions: ['Chop.'], createdAt: '2026-11-21T00:00:00Z' }

function answer(status: number, body: unknown = {}) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fn)
  return fn
}
afterEach(() => vi.unstubAllGlobals())

describe('reporting a recipe', () => {
  it('sends the recipe as shown, the reason and a trimmed note, with no account needed', async () => {
    const fetch = answer(201, { ok: true })
    expect(await sendReport(null, recipe, 'ai', 'unsafe', `  ${'x'.repeat(600)}  `)).toBe('ok')

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/v1/reports')
    expect((init.headers as Record<string, string>).authorization).toBeUndefined()
    const sent = JSON.parse(String(init.body))
    expect(sent).toMatchObject({ title: 'Vegetable Stir-Fry', reason: 'unsafe', source: 'ai', ingredients: ['150g broccoli'], steps: ['Chop.'] })
    expect(sent.note).toHaveLength(500)
  })

  it('says who is reporting when signed in', async () => {
    const fetch = answer(201)
    await sendReport('tok', recipe, 'ai', 'wrong', '')
    expect(((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>).authorization).toBe('Bearer tok')
  })

  it('tells a daily limit apart from a failure, and never claims success on either', async () => {
    answer(429)
    expect(await sendReport(null, recipe, 'ai', 'other', '')).toBe('limit')
    answer(500)
    expect(await sendReport(null, recipe, 'ai', 'other', '')).toBe('failed')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await sendReport(null, recipe, 'ai', 'other', '')).toBe('failed')
  })
})

describe('deleting an account\'s data', () => {
  it('is true only when the server confirms it', async () => {
    const fetch = answer(200, { ok: true })
    expect(await deleteAccountData('tok')).toBe(true)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/v1/account')
    expect(init.method).toBe('DELETE')

    answer(200, {})
    expect(await deleteAccountData('tok')).toBe(false)
    answer(401, { error: 'sign in first' })
    expect(await deleteAccountData('tok')).toBe(false)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await deleteAccountData('tok')).toBe(false)
  })
})
