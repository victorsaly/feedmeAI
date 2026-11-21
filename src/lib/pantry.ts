/**
 * Reading a recipe's ingredient lines against what is in the fridge: which
 * you have, which you must buy, which are cupboard staples nobody shops for;
 * and, while cooking, which lines one step is talking about and whether it
 * names a time. Plain string work, no network, so it can be tested.
 */

const CUPBOARD = ['salt', 'pepper', 'oil', 'butter', 'sugar', 'flour', 'water', 'vinegar', 'garlic powder', 'onion powder', 'dried herbs']

const UNIT = /^(?:a |an |the |of |about |juice of |small handful of |handful of |pinch of |small piece of |piece of |slices? of |\d+(?:[.,/]\d+)?\s*|[½¼¾]\s*|(?:kg|g|ml|l|tbsp|tsp|tablespoons?|teaspoons?|cups?|cloves?|cans?|tins?|bunch(?:es)?|small|medium|large)\b\s*)/

/** "2 tablespoons soy sauce" -> "soy sauce"; "1 avocado, sliced" -> "avocado" */
export function nameOf(line: string): string {
  let name = line.toLowerCase().split(',')[0].replace(/\(.*?\)/g, '').trim()
  for (let prev = ''; prev !== name;) { prev = name; name = name.replace(UNIT, '') }
  return name.trim()
}

/** describing words that say nothing about which ingredient is meant */
const PLAIN = new Set(['fresh', 'grated', 'green', 'dried', 'chopped', 'ground', 'whole', 'sliced', 'light', 'dark'])

const word = (term: string) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
const stem = (w: string) => w.replace(/(?:es|s)$/, '')

export interface Sorted {
  /** in the fridge already */
  have: string[]
  /** to buy: the idea said so, or nothing in the cupboard covers it */
  buy: string[]
  /** staples: salt, oil and the like */
  cupboard: string[]
}

export function sortIngredients(lines: string[], have: string[], missing: string[] = []): Sorted {
  const haveWords = have.map((h) => h.toLowerCase())
  const wanted = missing.flatMap((m) => m.toLowerCase().split(/\s+or\s+|,\s*/)).map((m) => m.trim()).filter(Boolean)
  const out: Sorted = { have: [], buy: [], cupboard: [] }
  for (const line of lines) {
    const low = line.toLowerCase()
    if (haveWords.some((h) => low.includes(h) || low.includes(stem(h)))) out.have.push(line)
    else if (wanted.some((m) => low.includes(m))) out.buy.push(line)
    else if (CUPBOARD.some((c) => word(c).test(nameOf(line)))) out.cupboard.push(line)
    else out.buy.push(line)
  }
  return out
}

/** The ingredient lines a step is about. A name of two words or more must
 *  appear whole, or as two words together ("bell pepper"); its last word
 *  alone counts only when no other line shares it, so "salt and pepper"
 *  does not light up the green pepper. */
export function forStep(step: string, lines: string[]): string[] {
  const text = step.toLowerCase()
  const names = lines.map(nameOf)
  return lines.filter((_, i) => {
    const name = names[i]
    if (!name) return false
    if (text.includes(name) || text.includes(stem(name))) return true
    const words = name.split(' ')
    if (words.length > 3) return false // a phrase ("salt and pepper to taste") matches whole or not at all
    for (let w = 0; w < words.length - 1; w++) if (text.includes(`${words[w]} ${stem(words[w + 1])}`)) return true
    // one word of the name is enough when no other line could mean it
    return words.some((w) => {
      const s = stem(w)
      if (s.length < 4 || PLAIN.has(w)) return false
      return !names.some((n, j) => j !== i && word(s).test(n)) && word(s).test(text)
    })
  })
}

/** The time a step names, in seconds: the upper end of "3-4 minutes". */
export function timeIn(step: string): number | null {
  const m = step.match(/(\d+)(?:\s*(?:-|–|to)\s*(\d+))?\s*(minutes?|mins?|seconds?|secs?)\b/i)
  if (!m) return null
  const n = Number(m[2] ?? m[1])
  const seconds = /^s/i.test(m[3]) ? n : n * 60
  return seconds > 0 && seconds <= 3 * 60 * 60 ? seconds : null
}
