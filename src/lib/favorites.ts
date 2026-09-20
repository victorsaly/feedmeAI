/**
 * Saved recipes, kept server-side under whichever account is signed in —
 * a sibling to todos.ts, talking to its own small worker
 * (workers/favorites-api in this repo) on the same feedmeai D1 database.
 * Every call needs a session token from `@/lib/account`; there is no
 * offline/local fallback here on purpose — Saved is a signed-in feature
 * (see SavedList.tsx and the Save button in IdeaSheet.tsx), so once you
 * have a token this is the only copy of the truth.
 */
import { useSyncExternalStore } from 'react'
import type { Recipe } from './kitchen'

const API = import.meta.env.VITE_FEEDME_FAVORITES_API ?? 'https://feedmeai-favorites-api.still-union-ef8a.workers.dev'

async function call<T>(path: string, token: string, opts: { method?: string; body?: unknown } = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      method: opts.method ?? 'GET',
      cache: 'no-store',
      headers: {
        authorization: `Bearer ${token}`,
        ...(opts.body ? { 'content-type': 'application/json' } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/* ---------- a small reactive cache, one fetch per session ---------- */

let cache: Recipe[] | null = null
let cacheToken: string | null = null
let inFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}
function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function snapshot() {
  return cache
}

/** null while nothing has loaded yet (or no one is signed in); [] once
 *  loaded with nothing saved. Reactive — updates after save/remove. */
export function useFavorites(): Recipe[] | null {
  return useSyncExternalStore(subscribe, snapshot, () => null)
}

/** Load once per token; a stale token (signed out, or a different account)
 *  clears the cache instead of showing someone else's saves. */
export function ensureFavoritesLoaded(token: string | null): void {
  if (!token) {
    if (cache !== null) {
      cache = null
      cacheToken = null
      notify()
    }
    return
  }
  if (cacheToken === token && cache !== null) return
  if (inFlight) return
  inFlight = call<{ favorites: Recipe[] }>('/v1/favorites', token)
    .then((data) => {
      cache = data?.favorites ?? []
      cacheToken = token
      notify()
    })
    .finally(() => {
      inFlight = null
    })
}

export function isFavoriteCached(id: string): boolean {
  return cache?.some((r) => r.id === id) ?? false
}

export async function saveFavorite(token: string, recipe: Recipe): Promise<boolean> {
  const data = await call<{ ok: boolean }>('/v1/favorites', token, { method: 'POST', body: recipe })
  const ok = Boolean(data?.ok)
  if (ok) {
    cache = [recipe, ...(cache ?? []).filter((r) => r.id !== recipe.id)]
    cacheToken = token
    notify()
  }
  return ok
}

export async function removeFavorite(token: string, id: string): Promise<boolean> {
  const data = await call<{ ok: boolean }>(`/v1/favorites/${encodeURIComponent(id)}`, token, { method: 'DELETE' })
  const ok = Boolean(data?.ok)
  if (ok && cache) {
    cache = cache.filter((r) => r.id !== id)
    notify()
  }
  return ok
}
