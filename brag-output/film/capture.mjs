/*
 * Record the real app doing the real flow, with the recorded API answers
 * replayed so every take is identical. Output: video/*.webm and marks.json.
 * Needs the built app served on :5198 (npx vite preview --port 5198).
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const W = new URL('.', import.meta.url).pathname
const J = (f) => JSON.parse(fs.readFileSync(`${W}${f}.json`, 'utf8'))
const identify = J('identify'), suggest = J('suggest'), expand = J('expand'), shopping = J('shopping')
const find = (q) => shopping[Object.keys(shopping).find((k) => q.toLowerCase().includes(k.split(' ').pop()))] ?? { items: [], shops: [] }
const later = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block',
})
const t0 = Date.now()
const page = await context.newPage()
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))

// The browser's own screencast hands over every painted frame (390 x 844,
// the size the phone is shown at on the stage), each stamped with when it was
// painted; they are laid onto a 30 fps timeline below, so timing is exact.
fs.rmSync(`${W}raw`, { recursive: true, force: true }); fs.mkdirSync(`${W}raw`)
const cdp = await context.newCDPSession(page)
const shots = []
cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
  const at = Date.now() - t0
  fs.writeFileSync(`${W}raw/${String(shots.length).padStart(5, '0')}.jpg`, Buffer.from(data, 'base64'))
  shots.push(at)
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 })
const todos = []
await page.route(/workers\.dev|api\.victorsaly\.com/, async (r) => {
  const u = new URL(r.request().url()), p = u.pathname, m = r.request().method()
  if (p === '/v1/ai') return r.fulfill({ json: { ready: true, plans: true } })
  if (p === '/v1/me') return r.fulfill({ json: { id: 'demo', name: 'Victor' } })
  if (p === '/v1/ai/identify') { await later(1100); return r.fulfill({ json: identify }) }
  if (p === '/v1/ai/suggest') { await later(500); return r.fulfill({ json: suggest }) }
  if (p === '/v1/ai/expand') return r.fulfill({ json: expand })
  if (p === '/v1/ai/image') return r.fulfill({ status: 403, json: { error: 'off' } })
  if (p.startsWith('/v1/recipes')) return r.fulfill({ json: { items: [], video: null, image: null } })
  if (p.startsWith('/v1/favorites')) return r.fulfill({ json: { favorites: [] } })
  if (p === '/v1/todos') { if (m === 'POST') { const t = { id: `t${todos.length + 1}`, recipeId: null, recipeName: null, ...r.request().postDataJSON(), checked: false }; todos.unshift(t); return r.fulfill({ status: 201, json: t }) } return r.fulfill({ json: { todos } }) }
  if (p === '/v1/shopping/compare') { await later(700); return r.fulfill({ json: { results: r.request().postDataJSON().items.map(find) } }) }
  return r.fulfill({ status: 404, json: {} })
})
await page.addInitScript(() => { localStorage.setItem('feedme-session', 'demo.token'); localStorage.setItem('feedme-country', 'gb') })

const marks = {}
const mark = (name) => { marks[name] = Date.now() - t0 }
const wait = (ms) => page.waitForTimeout(ms)

await page.goto('http://localhost:5198/app/', { waitUntil: 'networkidle' })
await wait(1300); mark('home')
await page.locator('input[type="file"]').last().setInputFiles(`${W}fridge.jpg`); mark('photoIn')
await page.waitForSelector('.door.is-folded'); mark('magnets')
await page.locator('.idea-btn').first().waitFor(); mark('ideas')
await wait(2800)
await page.locator('.idea-btn', { hasText: 'Stir-Fry' }).click(); mark('sheetOpen')
await page.waitForSelector('.sheet-buy'); await wait(2600)
await page.locator('.sheet-buy-all').click(); mark('added')
await wait(1500); mark('addedHeld')
await wait(3400)                       // the confirmation toast leaves before the list is shown
await page.keyboard.press('Escape'); await wait(800)
await page.locator('nav.tabs button', { hasText: 'List' }).click(); mark('listTab')
await page.waitForSelector('.list-item'); await wait(1500)
await page.locator('.shops-ask .btn').click(); mark('compare')
await page.waitForSelector('.shops-best'); mark('prices')
await wait(1700)
await page.locator('.shops-more').click(); mark('allShops')
await wait(2400); mark('end')

await cdp.send('Page.stopScreencast').catch(() => {})
// A still screen paints nothing, so each 30 fps slot shows the last frame painted before it.
fs.rmSync(`${W}appframes`, { recursive: true, force: true }); fs.mkdirSync(`${W}appframes`)
const total = Math.ceil(marks.end * 30 / 1000) + 2
for (let f = 0, k = 0; f < total; f++) {
  const t = f * 1000 / 30
  while (k + 1 < shots.length && shots[k + 1] <= t) k++
  fs.copyFileSync(`${W}raw/${String(k).padStart(5, '0')}.jpg`, `${W}appframes/${String(f + 1).padStart(4, '0')}.jpg`)
}
console.log('painted frames', shots.length, 'timeline frames', total)
fs.writeFileSync(`${W}marks.json`, JSON.stringify(marks, null, 1))
console.log('MARKS', JSON.stringify(marks)); console.log('ERRORS', JSON.stringify(errors))
await context.close(); await browser.close()
