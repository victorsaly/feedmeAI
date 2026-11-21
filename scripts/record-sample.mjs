/*
 * Replace the sample's hand-written recipes with the model's own.
 *
 *   node scripts/record-sample.mjs
 *
 * Asks the Worker to write out every sample idea not yet marked `recorded`
 * and saves the answers into src/data/sample.json. Costs one AI call each.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = new URL('../src/data/sample.json', import.meta.url).pathname
const API = process.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'
const sample = JSON.parse(readFileSync(FILE, 'utf8'))
const items = sample.items.map((i) => ({ name: i.name, amount: i.amount }))

for (const idea of sample.ideas.filter((i) => !i.recorded)) {
  const res = await fetch(`${API}/v1/ai/expand`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ title: idea.title, blurb: idea.blurb, items, uses: idea.uses, missing: idea.missing }),
  })
  if (!res.ok) { console.log(`${idea.title}: ${res.status} ${await res.text()}`); continue }
  idea.recipe = await res.json()
  idea.recorded = true
  console.log(`${idea.title}: recorded`)
}
writeFileSync(FILE, JSON.stringify(sample, null, 2) + '\n')
