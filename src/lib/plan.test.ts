import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPlan, limitFrom, used } from '@/lib/plan'
import { deviceId } from '@/lib/device'

afterEach(() => vi.unstubAllGlobals())

describe('the device id', () => {
  it('is made once and kept', () => {
    const first = deviceId()
    expect(first).toMatch(/^[a-f0-9-]{36}$/)
    expect(deviceId()).toBe(first)
    expect(localStorage.getItem('feedme-device')).toBe(first)
  })
})

describe('reading a refusal', () => {
  it('recognises a plan limit by its fields, on 429 or 403', async () => {
    const body = { error: 'Generated pictures come with Plus.', limit: 'pictures', tier: 'free', used: 0, allowed: 0, per: 'month', resets: '2026-12-01T00:00:00.000Z' }
    expect(await limitFrom(Response.json(body, { status: 403 }))).toMatchObject({ limit: 'pictures', allowed: 0, message: 'Generated pictures come with Plus.' })
    expect(await limitFrom(Response.json(body, { status: 429 }))).not.toBeNull()
  })

  it('is not fooled by an ordinary "busy" or a success', async () => {
    expect(await limitFrom(Response.json({ error: 'the AI is rate-limited right now' }, { status: 429 }))).toBeNull()
    expect(await limitFrom(Response.json({ limit: 'photos', allowed: 3 }, { status: 200 }))).toBeNull()
    expect(await limitFrom(new Response('not json', { status: 429 }))).toBeNull()
  })
})

describe('the plan', () => {
  const plan = { tier: 'free', photos: { used: 1, allowed: 3, per: 'day', resets: '' }, compares: { used: 0, allowed: 2, per: 'week', resets: '' }, pictures: { used: 0, allowed: 0, per: 'month', resets: '' } }

  it('asks with the device id, and the account when there is one', async () => {
    const fetch = vi.fn(async () => Response.json(plan))
    vi.stubGlobal('fetch', fetch)
    expect(await fetchPlan('tok')).toEqual(plan)
    const headers = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>
    expect(headers.authorization).toBe('Bearer tok')
    expect(headers['x-feedme-device']).toBe(deviceId())
  })

  it('is null, not a guess, when the Worker cannot say', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })))
    expect(await fetchPlan(null)).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await fetchPlan(null)).toBeNull()
  })

  it('says where you stand in a few words', () => {
    expect(used(plan.photos as never)).toBe('1 of 3 today')
    expect(used(plan.compares as never)).toBe('0 of 2 this week')
    expect(used({ used: 5, allowed: 3, per: 'day', resets: '' })).toBe('3 of 3 today')
  })
})
