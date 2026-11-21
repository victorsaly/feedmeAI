import { afterEach, describe, expect, it, vi } from 'vitest'
import { COMPARE_CAP, compareShops, loadCountry, saveCountry, type ShoppingSearch } from '@/lib/shopping'

const item = (source: string, title: string, price: string | null) => ({ title, price, link: null, source, thumbnail: null, delivery: null })

/** Answer each search from a table keyed by the query. */
function answer(table: Record<string, ShoppingSearch>) {
  const asked: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const q = new URL(url).searchParams.get('q') ?? ''
    asked.push(q)
    return new Response(JSON.stringify(table[q] ?? { items: [], shops: [] }), { status: 200 })
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
