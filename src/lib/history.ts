/**
 * What you looked up before, kept on this device: the photo (as a small
 * thumbnail), the list it produced, the ideas drawn from it and every
 * recipe you opened — enough to bring the whole screen back without a
 * single network call. Newest first, capped, and dropped oldest-first if
 * the browser's storage runs out.
 */

import type { Idea, Ingredient, Meal, Recipe, Source } from '@/lib/kitchen'

const KEY = 'feedme-history'
const MAX = 20
const THUMB = 240
/** the newest few also keep a photo big enough to look at */
export const LARGE = 640
const KEEP_LARGE = 3

const SEARCH_KEY = 'feedme-searches'
const MAX_SEARCHES = 12

export interface Haul {
  id: string
  createdAt: string
  meal: Meal
  /** a small copy of the photo, or none if it couldn't be made */
  photo?: string
  /** a bigger copy, kept only for the newest few */
  photoLarge?: string
  items: Ingredient[]
  ideas: Idea[]
  source?: Source
  /** the ones written out, by idea id */
  recipes: Record<string, Recipe>
}

export function loadHauls(): Haul[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list) ? list.filter(isHaul) : []
  } catch {
    return []
  }
}

/** Insert or replace by id, newest first. Older entries lose their large
 *  photo so the whole list stays a few hundred KB. */
export function saveHaul(haul: Haul): Haul[] {
  const rest = loadHauls().filter((h) => h.id !== haul.id)
  const next = [haul, ...rest].slice(0, MAX).map((h, n) => (n < KEEP_LARGE || !h.photoLarge ? h : { ...h, photoLarge: undefined }))
  write(next)
  return next
}

export function removeHaul(id: string): Haul[] {
  const next = loadHauls().filter((h) => h.id !== id)
  write(next)
  return next
}

function write(list: Haul[]) {
  for (let keep = list.length; keep >= 0; keep--) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, keep)))
      return
    } catch {
      // quota or blocked storage: try with one fewer, down to nothing
    }
  }
}

function isHaul(h: unknown): h is Haul {
  if (!h || typeof h !== 'object') return false
  const x = h as Record<string, unknown>
  return typeof x.id === 'string' && typeof x.createdAt === 'string' && Array.isArray(x.items) && Array.isArray(x.ideas)
}

/* ---------- searches on the Recipes tab ---------- */

export interface Search {
  id: string
  createdAt: string
  q: string
  categoryId?: string
  meal: Meal
  ideas: Idea[]
}

export function loadSearches(): Search[] {
  try {
    const raw = localStorage.getItem(SEARCH_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list) ? list.filter(isSearch) : []
  } catch {
    return []
  }
}

/** The same words and chip again just moves that search to the top. */
export function saveSearch(search: Omit<Search, 'id' | 'createdAt'>): Search[] {
  const same = (s: Search) => s.q.toLowerCase() === search.q.toLowerCase() && s.categoryId === search.categoryId && s.meal === search.meal
  const rest = loadSearches().filter((s) => !same(s))
  const next = [{ ...search, id: `s-${Date.now()}`, createdAt: new Date().toISOString() }, ...rest].slice(0, MAX_SEARCHES)
  try {
    localStorage.setItem(SEARCH_KEY, JSON.stringify(next))
  } catch {
    // not remembered past this visit
  }
  return next
}

export function removeSearch(id: string): Search[] {
  const next = loadSearches().filter((s) => s.id !== id)
  try {
    localStorage.setItem(SEARCH_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
  return next
}

function isSearch(s: unknown): s is Search {
  if (!s || typeof s !== 'object') return false
  const x = s as Record<string, unknown>
  return typeof x.id === 'string' && typeof x.q === 'string' && typeof x.meal === 'string' && Array.isArray(x.ideas)
}

/* ---------- pictures ---------- */

/** A JPEG no wider than `max` px, from any image data URL. At 240 it's a
 *  few KB, so twenty of them fit comfortably beside everything else. */
export function thumbnail(dataUrl: string, max = THUMB): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', max > THUMB ? 0.78 : 0.7))
      } catch {
        resolve(undefined)
      }
    }
    img.onerror = () => resolve(undefined)
    img.src = dataUrl
  })
}
