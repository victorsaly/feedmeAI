import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// list.ts reads this browser's copy when it loads, so each test loads it fresh.
let list: typeof import('@/lib/list')
const load = async () => { vi.resetModules(); list = await import('@/lib/list') }
const stored = () => JSON.parse(localStorage.getItem('feedme-list') ?? '[]') as { id: string; ingredient: string; checked: boolean }[]

/** A stand-in account: holds the todos, and can be switched offline. */
function server() {
  const state = { todos: [] as { id: string; ingredient: string; recipeId: string | null; recipeName: string | null; checked: boolean }[], online: true, calls: [] as string[] }
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname, method = init?.method ?? 'GET'
    state.calls.push(`${method} ${path}`)
    if (!state.online) throw new Error('offline')
    const body = init?.body ? JSON.parse(String(init.body)) : {}
    const id = path.split('/')[3]
    if (path === '/v1/todos' && method === 'GET') return Response.json({ todos: state.todos })
    if (path === '/v1/todos' && method === 'POST') {
      const todo = { id: `s${state.todos.length + 1}`, ingredient: body.ingredient, recipeId: body.recipeId ?? null, recipeName: body.recipeName ?? null, checked: false }
      state.todos.unshift(todo)
      return Response.json(todo, { status: 201 })
    }
    if (method === 'PATCH') { state.todos = state.todos.map((t) => (t.id === id ? { ...t, checked: body.checked } : t)); return Response.json({ ok: true }) }
    if (method === 'DELETE') { state.todos = state.todos.filter((t) => t.id !== id); return Response.json({ ok: true }) }
    return new Response('{}', { status: 404 })
  }))
  return state
}

beforeEach(async () => { localStorage.clear(); await load() })
afterEach(() => vi.unstubAllGlobals())

describe('without an account', () => {
  it('keeps the list in this browser and makes no request', async () => {
    const s = server()
    const soy = await list.addItem(null, '2 tablespoons soy sauce', { id: 'r1', name: 'Vegetable Stir-Fry' })
    await list.addItem(null, 'milk')
    await list.checkItem(null, soy.id, true)

    expect(stored().map((i) => [i.ingredient, i.checked])).toEqual([['milk', false], ['2 tablespoons soy sauce', true]])
    expect(s.calls).toEqual([])
  })

  it('is still there after the app is closed and opened again', async () => {
    await list.addItem(null, 'ginger')
    await load()
    const seen: string[] = []
    // the store hands the same list to any screen that asks
    seen.push(...stored().map((i) => i.ingredient))
    expect(seen).toEqual(['ginger'])
  })

  it('removes an item', async () => {
    const a = await list.addItem(null, 'a')
    await list.addItem(null, 'b')
    await list.removeItem(null, a.id)
    expect(stored().map((i) => i.ingredient)).toEqual(['b'])
  })
})

describe('damaged storage', () => {
  it('opens with an empty list rather than failing, and keeps what is still sound', async () => {
    localStorage.setItem('feedme-list', '{"not":"a list"}')
    localStorage.setItem('feedme-list-pending', '"nonsense"')
    await load()
    await list.addItem(null, 'milk')
    expect(stored().map((i) => i.ingredient)).toEqual(['milk'])

    localStorage.setItem('feedme-list', JSON.stringify([{ id: 'local-1', ingredient: 'eggs', checked: false }, null, { id: 7 }]))
    await load()
    await list.addItem(null, 'bread')
    expect(stored().map((i) => i.ingredient)).toEqual(['bread', 'eggs'])
  })
})

describe('with an account', () => {
  it('sends each change to the account as well', async () => {
    const s = server()
    const item = await list.addItem('tok', 'soy sauce')
    await list.checkItem('tok', item.id, true)

    expect(item.id).toBe('s1')
    expect(s.todos).toEqual([{ id: 's1', ingredient: 'soy sauce', recipeId: null, recipeName: null, checked: true }])
    expect(stored()[0]).toMatchObject({ id: 's1', checked: true })
  })

  it('on signing in, sends up what was only on this device, ticks included, then takes the account\'s list', async () => {
    const s = server()
    const mine = await list.addItem(null, 'ginger')
    await list.checkItem(null, mine.id, true)
    s.todos.push({ id: 'old', ingredient: 'rice', recipeId: null, recipeName: null, checked: false })

    await list.syncList('tok')

    expect(s.todos.map((t) => [t.ingredient, t.checked])).toEqual([['ginger', true], ['rice', false]])
    expect(stored().map((i) => i.ingredient)).toEqual(['ginger', 'rice'])
    expect(stored().every((i) => !i.id.startsWith('local-'))).toBe(true)
  })

  it('keeps working in the shop with no signal, and catches the account up afterwards', async () => {
    const s = server()
    const soy = await list.addItem('tok', 'soy sauce')
    const rice = await list.addItem('tok', 'rice')

    s.online = false
    await list.checkItem('tok', soy.id, true)
    await list.removeItem('tok', rice.id)
    const late = await list.addItem('tok', 'limes')
    expect(late.id.startsWith('local-')).toBe(true)
    expect(stored().map((i) => [i.ingredient, i.checked])).toEqual([['limes', false], ['soy sauce', true]])

    // a sync with no signal changes nothing on screen
    await list.syncList('tok')
    expect(stored().map((i) => i.ingredient)).toEqual(['limes', 'soy sauce'])

    // back online, even after the app was closed in between
    await load()
    s.online = true
    await list.syncList('tok')
    expect(s.todos.map((t) => [t.ingredient, t.checked]).sort()).toEqual([['limes', false], ['soy sauce', true]])
    expect(stored().map((i) => [i.ingredient, i.checked]).sort()).toEqual([['limes', false], ['soy sauce', true]])
  })

  it('leaves the list on the device when signing out', async () => {
    server()
    await list.addItem('tok', 'soy sauce')
    list.keepLocally()
    expect(stored().map((i) => [i.ingredient, i.id.startsWith('local-')])).toEqual([['soy sauce', true]])
  })
})
