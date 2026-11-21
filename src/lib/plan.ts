/**
 * Free and Plus, as the app sees them: what this person has used and may
 * use, and what to do when the Worker says an allowance has run out. The
 * rules themselves live in the Worker (worker/src/plan.js); nothing here
 * decides a limit.
 */

import { deviceId } from '@/lib/device'

const API = import.meta.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'

export type Feature = 'photos' | 'compares' | 'pictures'

export interface Allowance {
  used: number
  allowed: number
  per: 'day' | 'week' | 'month'
  /** when the count goes back to nothing, ISO */
  resets: string
}

export type Plan = { tier: 'free' | 'plus' } & Record<Feature, Allowance>

/** The Worker's answer when an allowance has run out. `message` is its own
 *  sentence, written to be shown: what ran out and when it comes back. */
export interface LimitHit extends Allowance {
  limit: Feature
  tier: 'free' | 'plus'
  message: string
}

/** Thrown by a call the plan refused, so a screen can show the limit as a
 *  state of its own rather than as an error. */
export class PlanLimit extends Error {
  constructor(public hit: LimitHit) { super(hit.message) }
}

/** Read a refusal, if that is what this response is. */
export async function limitFrom(res: Response): Promise<LimitHit | null> {
  if (res.status !== 429 && res.status !== 403) return null
  const body = (await res.clone().json().catch(() => null)) as (Partial<LimitHit> & { error?: string }) | null
  if (!body?.limit || typeof body.allowed !== 'number') return null
  return { limit: body.limit, tier: body.tier ?? 'free', used: body.used ?? body.allowed, allowed: body.allowed, per: body.per ?? 'day', resets: body.resets ?? '', message: body.error ?? '' }
}

/** Every request that the plan counts says which device it is from. */
export const planHeaders = (token?: string | null): Record<string, string> => ({
  'x-feedme-device': deviceId(),
  ...(token ? { authorization: `Bearer ${token}` } : {}),
})

/** Null when the Worker cannot say (offline, or an older Worker). */
export async function fetchPlan(token: string | null): Promise<Plan | null> {
  try {
    const res = await fetch(`${API}/v1/plan`, { headers: planHeaders(token), cache: 'no-store' })
    if (!res.ok) return null
    const plan = (await res.json()) as Plan
    return plan?.photos && plan.compares ? plan : null
  } catch {
    return null
  }
}

const EVERY = { day: 'today', week: 'this week', month: 'this month' } as const

/** "1 of 3 today" */
export const used = (a: Allowance) => `${Math.min(a.used, a.allowed)} of ${a.allowed} ${EVERY[a.per]}`
