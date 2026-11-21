import { describe, expect, it } from 'vitest'
import { PLANS, callerKey, decide, periodKey, periodStart, resetsAt, sentence, tierOf, usageKey } from './plan.js'

const at = (iso) => new Date(iso)

describe('periods', () => {
  it('a day runs midnight to midnight, UTC', () => {
    expect(periodKey('day', at('2026-11-21T23:59:59Z'))).toBe('2026-11-21')
    expect(resetsAt('day', at('2026-11-21T10:00:00Z')).toISOString()).toBe('2026-11-22T00:00:00.000Z')
  })

  it('a week starts on Monday', () => {
    // 21 November 2026 is a Saturday; its week began on Monday the 16th
    expect(periodStart('week', at('2026-11-21T10:00:00Z')).toISOString()).toBe('2026-11-16T00:00:00.000Z')
    expect(periodKey('week', at('2026-11-16T00:00:00Z'))).toBe(periodKey('week', at('2026-11-22T23:59:59Z')))
    expect(periodKey('week', at('2026-11-23T00:00:00Z'))).not.toBe(periodKey('week', at('2026-11-22T23:59:59Z')))
    expect(resetsAt('week', at('2026-11-21T10:00:00Z')).toISOString()).toBe('2026-11-23T00:00:00.000Z')
  })

  it('a month resets on the first, across a year end', () => {
    expect(periodKey('month', at('2026-12-31T23:00:00Z'))).toBe('2026-12m')
    expect(resetsAt('month', at('2026-12-31T23:00:00Z')).toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })
})

describe('who is counted', () => {
  it('the account first, then a well-formed device id, then the address', () => {
    expect(callerKey({ id: 'u1' }, 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '1.2.3.4')).toBe('u:u1')
    expect(callerKey(null, 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE', '1.2.3.4')).toBe('d:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    expect(callerKey(null, 'x', '1.2.3.4')).toBe('ip:1.2.3.4')
    expect(callerKey(null, "'; drop table usage; --", null)).toBe('ip:unknown')
  })

  it('counts each feature, caller and period separately', () => {
    const d = at('2026-11-21T10:00:00Z')
    expect(usageKey('photos', 'u:u1', 'day', d)).toBe('photos:u:u1:2026-11-21')
    expect(usageKey('compares', 'u:u1', 'week', d)).toBe('compares:u:u1:2026-11-16w')
  })
})

describe('free or Plus', () => {
  const now = 1_800_000_000
  it('is free unless granted by hand or holding a purchase that has not run out', () => {
    expect(tierOf({}, { id: 'u1' }, null, now)).toBe('free')
    expect(tierOf({ PLUS_USERS: 'u9, u1' }, { id: 'u1' }, null, now)).toBe('plus')
    expect(tierOf({ PLUS_USERS: 'u9' }, null, null, now)).toBe('free')
    expect(tierOf({}, { id: 'u1' }, { expires_at: now + 60 }, now)).toBe('plus')
    expect(tierOf({}, { id: 'u1' }, { expires_at: now - 60 }, now)).toBe('free')
  })
})

describe('the limits', () => {
  const d = at('2026-11-21T10:00:00Z')
  it('lets the third free photo through and stops the fourth', () => {
    expect(decide('free', 'photos', 2, d).ok).toBe(true)
    expect(decide('free', 'photos', 3, d)).toMatchObject({ ok: false, used: 3, allowed: 3, per: 'day', resets: '2026-11-22T00:00:00.000Z' })
    expect(decide('plus', 'photos', 3, d).ok).toBe(true)
  })

  it('gives the free tier no generated pictures at all', () => {
    expect(decide('free', 'pictures', 0, d).ok).toBe(false)
    expect(decide('plus', 'pictures', 9, d).ok).toBe(true)
    expect(decide('plus', 'pictures', 10, d).ok).toBe(false)
  })

  it('gives Plus at least as much as free, of everything', () => {
    for (const f of Object.keys(PLANS.free)) expect(PLANS.plus[f].allowed).toBeGreaterThanOrEqual(PLANS.free[f].allowed)
  })

  it('says what ran out and when it comes back', () => {
    expect(sentence(decide('free', 'photos', 3, d))).toBe("You've used today's 3 free photos. They come back tomorrow.")
    expect(sentence(decide('free', 'compares', 2, d))).toBe("You've used this week's 2 free price checks. They come back on Monday.")
    expect(sentence(decide('plus', 'pictures', 10, d))).toBe("You've used this month's 10 generated pictures. They come back next month.")
    expect(sentence(decide('free', 'pictures', 0, d))).toBe('Generated pictures come with Plus.')
  })
})
