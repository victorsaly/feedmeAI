import { afterEach, describe, expect, it, vi } from 'vitest'
import { COMPARE_CAP, compareShops, loadCountry, saveCountry, type ShoppingSearch } from '@/lib/shopping'
import { PlanLimit } from '@/lib/plan'

const item = (source: string, title: string, price: string | null) => ({ title, price, link: null, source, thumbnail: null, delivery: null })

/** The Worker: one request carries the whole list; answer each item from a table. */
function answer(table: Record<string, ShoppingSearch>) {
  const asked: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    expect(new URL(url).pathname).toBe('/v1/shopping/compare')
    const { items } = JSON.parse(String(init?.body)) as { items: string[] }
    asked.push(...items)
    return Response.json({ results: items.map((q) => table[q] ?? { items: [], shops: [] }) })
  }))
  return asked
}

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })

describe('compareShops', () => {
  it('regroups the results by shop and keeps each shop\'s cheapest listing', async () => {
    answer({
      'Soy sauce': { items: [item('Iceland', 'Tiger Tiger Dark Soy', '£1.00'), item('Iceland', 'Posh Soy', '£3.50'), item('Ocado', 'Kikkoman', '£2.00')], shops: [{ key: 'iceland', label: 'Iceland', link: 'https://iceland.example/s' }] },
      Ginger: { items: [item('Iceland', 'Chopped Ginger', '£1.25'), item('Ocado', 'Root Ginger', '£1.00')], shops: [] },
    })
    const { groups, unfound, searched } = await compareShops('t', ['Soy sauce', 'Ginger'], 'gb')

    expect(searched).toBe(2)
    expect(unfound).toEqual([])
    expect(groups.map((g) => [g.label, g.total, g.currency])).toEqual([['Iceland', 2.25, '£'], ['Ocado', 3, '£']])
    expect(groups[0].lines.map((l) => l.item.title)).toEqual(['Tiger Tiger Dark Soy', 'Chopped Ginger'])
    expect(groups[0].link).toBe('https://iceland.example/s')
  })

  it('puts a shop with the whole list above a cheaper shop with part of it', async () => {
    answer({
      a: { items: [item('Full', 'a', '£5.00'), item('Part', 'a', '£1.00')], shops: [] },
      b: { items: [item('Full', 'b', '£5.00')], shops: [] },
    })
    const { groups } = await compareShops('t', ['a', 'b'], 'gb')
    expect(groups.map((g) => [g.label, g.lines.length])).toEqual([['Full', 2], ['Part', 1]])
  })

  it('reports what nothing was found for, and has no total when a price cannot be read', async () => {
    answer({ a: { items: [item('Shop', 'a', null)], shops: [] } })
    const { groups, unfound } = await compareShops('t', ['a', 'nowhere'], 'gb')
    expect(unfound).toEqual(['nowhere'])
    expect(groups[0].total).toBeNull()
  })

  it('ignores listings with no shop named', async () => {
    answer({ a: { items: [{ ...item('', 'a', '£1.00'), source: null }], shops: [] } })
    expect((await compareShops('t', ['a'], 'gb')).unfound).toEqual(['a'])
  })

  it(`searches at most ${COMPARE_CAP} items, so a long list is not a long bill`, async () => {
    const asked = answer({})
    const many = Array.from({ length: COMPARE_CAP + 5 }, (_, n) => `item ${n}`)
    expect((await compareShops('t', many, 'gb')).searched).toBe(COMPARE_CAP)
    expect(asked).toHaveLength(COMPARE_CAP)
  })

  it('is one request however long the list, so a plan can count it as one price check', async () => {
    const fetch = vi.fn(async () => Response.json({ results: [{ items: [], shops: [] }, { items: [], shops: [] }] }))
    vi.stubGlobal('fetch', fetch)
    await compareShops('t', ['a', 'b'], 'gb')
    expect(fetch).toHaveBeenCalledTimes(1)
    const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect(JSON.parse(String(init.body))).toEqual({ items: ['a', 'b'], country: 'gb' })
    expect((init.headers as Record<string, string>)['x-feedme-device']).toMatch(/^[a-f0-9-]{16,}$/)
  })

  it('raises a plan limit as its own thing, carrying the Worker\'s sentence', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      { error: "You've used this week's 2 free price checks. They come back on Monday.", limit: 'compares', tier: 'free', used: 2, allowed: 2, per: 'week', resets: '2026-11-23T00:00:00.000Z' },
      { status: 429 },
    )))
    const err = await compareShops('t', ['a'], 'gb').catch((e) => e)
    expect(err).toBeInstanceOf(PlanLimit)
    expect(err.message).toBe("You've used this week's 2 free price checks. They come back on Monday.")
    expect(err.hit).toMatchObject({ limit: 'compares', allowed: 2, per: 'week' })
  })

  it('still works against an older Worker, one search per item', async () => {
    const asked: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = new URL(url)
      if (u.pathname === '/v1/shopping/compare') return new Response('{}', { status: 404 })
      asked.push(u.searchParams.get('q') ?? '')
      return Response.json({ items: [item('Shop', 'x', '£1.00')], shops: [] })
    }))
    const { groups } = await compareShops('t', ['a', 'b'], 'gb')
    expect(asked).toEqual(['a', 'b'])
    expect(groups[0]).toMatchObject({ label: 'Shop', total: 2 })
  })

  it('treats a failed search as nothing found, not as an error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    await expect(compareShops('t', ['a'], 'gb')).resolves.toMatchObject({ groups: [], unfound: ['a'] })
  })
})

describe('country', () => {
  it('is the UK until the person chooses, whatever the browser\'s language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US')
    expect(loadCountry()).toBe('gb')
  })

  it('remembers a choice', () => {
    saveCountry('ie')
    expect(loadCountry()).toBe('ie')
  })
})
