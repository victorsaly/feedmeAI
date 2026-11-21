"use client"

/**
 * Sign-in, borrowed rather than built.
 *
 * arcade-api (api.victorsaly.com) already runs Google OAuth for the other
 * victorsaly.com sites — one account, one name, across all of them. FeedMe AI
 * asks it for identity and nothing else: no email is ever requested, and no
 * session secret lives in this app. `src/lib/todos.ts` and
 * `src/lib/shopping.ts` send the token on here to feedmeai-api, which checks
 * it against arcade-api on every request instead of trusting it locally.
 */

import { useSyncExternalStore } from 'react'
import { isNative } from '@/lib/native'

const AUTH = 'https://api.victorsaly.com'
const TOKEN_KEY = 'feedme-session'

const SESSION_EVENT = 'feedme-session-change'

function subscribeSession(cb: () => void) {
  window.addEventListener(SESSION_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(SESSION_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function useSignedIn(): boolean {
  return useSyncExternalStore(subscribeSession, () => readToken() !== null, () => false)
}

export function useSessionToken(): string | null {
  return useSyncExternalStore(subscribeSession, readToken, () => null)
}

/** Safari private mode and blocked site data both throw on write — a
 *  session still works for the visit via this fallback, it just isn't
 *  remembered past it. */
let memoryToken: string | null = null

export const readToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

export const writeToken = (token: string | null) => {
  memoryToken = token
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // not remembered past this page load
  } finally {
    window.dispatchEvent(new Event(SESSION_EVENT))
  }
}

/** Signing in is a trip to Google and back to this page's address. The
 *  iPhone app has no address to come back to until Sign in with Apple and a
 *  return link are added (see docs/product-plan.md, step 8). */
export const canSignIn = !isNative

/** Send the browser to Google. It returns here with `?auth=`. */
export const signIn = () => {
  if (!canSignIn) return
  const back = `${window.location.origin}${window.location.pathname}`
  window.location.href = `${AUTH}/v1/auth/start?redirect=${encodeURIComponent(back)}`
}

export const signOut = () => writeToken(null)

async function call<T>(path: string, opts: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T | null> {
  try {
    const res = await fetch(`${AUTH}${path}`, {
      method: opts.method ?? 'GET',
      cache: 'no-store',
      headers: {
        ...(opts.body ? { 'content-type': 'application/json' } : {}),
        ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Spend the one-time code the callback handed back, if this load is that
 *  return trip. The code leaves the address bar either way — refreshing a
 *  spent one just fails quietly. */
export async function completeSignIn(): Promise<{ name: string } | null> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('auth') ?? url.searchParams.get('code')
  if (!code) return null

  url.searchParams.delete('auth')
  url.searchParams.delete('code')
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)

  const data = await call<{ token: string; name: string }>('/v1/auth/claim', { method: 'POST', body: { code } })
  if (!data?.token) return null
  writeToken(data.token)
  return { name: data.name }
}

export async function whoAmI(token: string): Promise<{ id: string; name: string } | null> {
  const data = await call<{ id: string; name: string }>('/v1/me', { token })
  if (!data) {
    // A refusal (not just a network hiccup) means the session is gone.
    const res = await fetch(`${AUTH}/v1/me`, { headers: { authorization: `Bearer ${token}` } }).catch(() => null)
    if (res?.status === 401) writeToken(null)
  }
  return data
}

const FEEDME = import.meta.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'

/** Delete everything FeedMe AI holds for this account on its servers: the
 *  shopping list, saved recipes and usage counts. True only when the server
 *  confirmed it, so the screen never says "deleted" on a guess. The sign-in
 *  identity itself is shared with the other victorsaly.com sites and lives
 *  in arcade-api; removing that is not something this app can do yet. */
export async function deleteAccountData(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${FEEDME}/v1/account`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
    if (!res.ok) return false
    return Boolean(((await res.json()) as { ok?: boolean }).ok)
  } catch {
    return false
  }
}
