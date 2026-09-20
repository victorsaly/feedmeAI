/**
 * Where to buy what's still missing. Goes through feedmeai-api so the
 * SearchAPI key never reaches the browser — the same reason the OpenAI key
 * currently does (see the README note), just not fixed yet for that one.
 */

const API = import.meta.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'
const COUNTRY_KEY = 'feedme-country'

export interface Country {
  code: string
  label: string
}

/** Short and deliberately not exhaustive — SearchAPI takes any ISO country,
 *  but a long list is worse UX than "Other" for the rare visitor outside it. */
export const COUNTRIES: Country[] = [
  { code: 'gb', label: 'United Kingdom' },
  { code: 'us', label: 'United States' },
  { code: 'ie', label: 'Ireland' },
  { code: 'ca', label: 'Canada' },
  { code: 'au', label: 'Australia' },
  { code: 'de', label: 'Germany' },
  { code: 'fr', label: 'France' },
  { code: 'es', label: 'Spain' },
  { code: 'it', label: 'Italy' },
  { code: 'nl', label: 'Netherlands' },
]

/** A guess from the browser's own locale (`en-GB` → `gb`) — a starting
 *  point to preselect, never applied silently without the person seeing it. */
export function guessCountry(): string | undefined {
  const region = navigator.language?.split('-')[1]?.toLowerCase()
  return region && COUNTRIES.some((c) => c.code === region) ? region : undefined
}

export function loadCountry(): string | undefined {
  try {
    return localStorage.getItem(COUNTRY_KEY) ?? guessCountry()
  } catch {
    return guessCountry()
  }
}

export function saveCountry(code: string): void {
  try {
    localStorage.setItem(COUNTRY_KEY, code)
  } catch {
    // ignore — the choice still applies for this visit
  }
}

export interface ShoppingResult {
  title: string
  price: string | null
  link: string | null
  source: string | null
  thumbnail: string | null
}

export async function searchShopping(token: string, query: string, country: string): Promise<ShoppingResult[]> {
  try {
    const params = new URLSearchParams({ q: query, country })
    const res = await fetch(`${API}/v1/shopping/search?${params}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = (await res.json()) as { items?: ShoppingResult[] }
    return data.items ?? []
  } catch {
    return []
  }
}
