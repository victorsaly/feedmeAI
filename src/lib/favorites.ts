/**
 * Saved recipes. Without an account they are kept on this device; with one
 * they live under it, in a small worker of their own (workers/favorites-api
 * in this repo) on the same feedmeai D1 database, and anything saved here
 * before signing in is sent up the first time the account's list loads.
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

/* ---------- a small reactive cache ---------- */

const KEY = 'feedme-saved'

function readLocal(): Recipe[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list) ? (list as Recipe[]) : []
  } catch {
    return []
  }
}
function writeLocal(list: Recipe[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* full or private: kept for this visit */ }
}
/** a photo as a data URL is too big to keep twenty of in this browser */
const light = (r: Recipe): Recipe => ({ ...r, originalImageBase64: undefined, previewImage: r.previewImage?.startsWith('data:') ? undefined : r.previewImage })

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

/** null while an account's list is still loading; [] when nothing is saved.
 *  Reactive — updates after save/remove. */
export function useFavorites(): Recipe[] | null {
  return useSyncExternalStore(subscribe, snapshot, () => null)
}

/** Signed out: what this device holds. Signed in: the account's list, once
 *  per token, after sending up anything saved here beforehand. */
export function ensureFavoritesLoaded(token: string | null): void {
  if (!token) {
    if (cache === null || cacheToken !== null) {
      cache = readLocal()
      cacheToken = null
      notify()
    }
    return
  }
  if (cacheToken === token && cache !== null) return
  if (inFlight) return
  cache = null
  notify()
  inFlight = (async () => {
    const mine = readLocal()
    const sent = await Promise.all(mine.map((r) => call<{ ok: boolean }>('/v1/favorites', token, { method: 'POST', body: r })))
    if (mine.length && sent.every((d) => d?.ok)) writeLocal([])
    const data = await call<{ favorites: Recipe[] }>('/v1/favorites', token)
    cache = data?.favorites ?? mine
    cacheToken = token
    notify()
  })().finally(() => {
    inFlight = null
  })
}

/** Forget what is saved on this device as well: for deleting an account's data. */
export function clearFavorites(): void {
  writeLocal([])
  cache = []
  cacheToken = null
  notify()
}

export function isFavoriteCached(id: string): boolean {
  return cache?.some((r) => r.id === id) ?? false
}

export async function saveFavorite(token: string | null, recipe: Recipe): Promise<boolean> {
  if (token) {
    const data = await call<{ ok: boolean }>('/v1/favorites', token, { method: 'POST', body: recipe })
    if (!data?.ok) return false
  }
  cache = [token ? recipe : light(recipe), ...(cache ?? []).filter((r) => r.id !== recipe.id)]
  cacheToken = token
  if (!token) writeLocal(cache)
  notify()
  return true
}

export async function removeFavorite(token: string | null, id: string): Promise<boolean> {
  if (token) {
    const data = await call<{ ok: boolean }>(`/v1/favorites/${encodeURIComponent(id)}`, token, { method: 'DELETE' })
    if (!data?.ok) return false
  }
  cache = (cache ?? []).filter((r) => r.id !== id)
  if (!token) writeLocal(cache)
  notify()
  return true
}
