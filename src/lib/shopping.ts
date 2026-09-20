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
  /** the supermarket's own search for this product where we know the store;
   *  otherwise Google's shopping page (SearchAPI never gives retailer URLs) */
  link: string | null
  /** "Tesco", "Ocado" … for a known store; the raw seller otherwise */
  source: string | null
  thumbnail: string | null
  delivery: string | null
}

/** One supermarket the API knows for this country, with a search for the query. */
export interface Shop {
  key: string
  label: string
  link: string
}

export interface ShoppingSearch {
  items: ShoppingResult[]
  /** empty when the country has no supermarket shortlist yet */
  shops: Shop[]
}

export async function searchShopping(token: string, query: string, country: string): Promise<ShoppingSearch> {
  try {
    const params = new URLSearchParams({ q: query, country })
    const res = await fetch(`${API}/v1/shopping/search?${params}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return { items: [], shops: [] }
    const data = (await res.json()) as Partial<ShoppingSearch>
    return { items: data.items ?? [], shops: data.shops ?? [] }
  } catch {
    return { items: [], shops: [] }
  }
}

/* ---------- the whole list at once, regrouped by shop ---------- */

/** What one shop has for one ingredient: its cheapest matching listing. */
export interface ShopLine {
  ingredient: string
  item: ShoppingResult
  /** parsed from the price string; null when it couldn't be read */
  amount: number | null
}

export interface ShopGroup {
  label: string
  /** the shop's own search page, when the API knows the shop */
  link: string | null
  lines: ShopLine[]
  /** sum of the parsed prices; null if any line's price couldn't be read */
  total: number | null
  /** currency symbol seen on the prices, e.g. "£" */
  currency: string
}

export interface Comparison {
  groups: ShopGroup[]
  /** ingredients nothing was found for */
  unfound: string[]
  /** how many were searched — capped, so a long list isn't a long wait or a big bill */
  searched: number
}

export const COMPARE_CAP = 10

const priceOf = (price: string | null): number | null => {
  const m = price?.replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}
const currencyOf = (price: string | null): string => price?.match(/^[^\d\s]+/)?.[0] ?? ''

/**
 * One search per ingredient, in parallel, then turned inside out: not "for
 * eggs, these shops" but "at Tesco, these of your things" — the question
 * you actually have when deciding where to do the shop. Per shop and
 * ingredient only the cheapest listing is kept; shops are ordered by how
 * much of the list they cover, then by price.
 */
export async function compareShops(token: string, ingredients: string[], country: string): Promise<Comparison> {
  const queries = ingredients.slice(0, COMPARE_CAP)
  const results = await Promise.all(queries.map((q) => searchShopping(token, q, country)))

  const groups = new Map<string, ShopGroup>()
  const unfound: string[] = []
  const shopLinks = new Map(results.flatMap((r) => r.shops).map((s) => [s.label, s.link]))

  queries.forEach((ingredient, i) => {
    const items = results[i].items.filter((it) => it.source)
    if (items.length === 0) { unfound.push(ingredient); return }
    const best = new Map<string, ShoppingResult>()
    for (const it of items) {
      const cur = best.get(it.source!)
      const a = priceOf(it.price)
      const b = cur ? priceOf(cur.price) : null
      if (!cur || (a !== null && (b === null || a < b))) best.set(it.source!, it)
    }
    for (const [label, item] of best) {
      const group = groups.get(label) ?? { label, link: shopLinks.get(label) ?? null, lines: [], total: 0, currency: '' }
      const amount = priceOf(item.price)
      group.lines.push({ ingredient, item, amount })
      group.total = group.total === null || amount === null ? null : group.total + amount
      group.currency ||= currencyOf(item.price)
      groups.set(label, group)
    }
  })

  const sorted = [...groups.values()].sort(
    (a, b) => b.lines.length - a.lines.length || (a.total ?? Infinity) - (b.total ?? Infinity),
  )
  return { groups: sorted, unfound, searched: queries.length }
}
