/*
 * Draw every icon and the share image from the one logo, in the app's own
 * colours, so they can never drift from it again.
 *
 *   node scripts/make-icons.mjs
 *
 * Writes the web icons and og-image into public/, and the two sources the
 * native project is generated from into assets/ (then: npm run ios:assets).
 */
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const root = new URL('..', import.meta.url).pathname
const DENIM = '#3667c9', ENAMEL = '#f2f6f9', INK = '#0f1620', INK2 = '#4b5665'
const font = readFileSync(`${root}public/fonts/bricolage-grotesque-latin.woff2`).toString('base64')
const img = (name) => `data:image/jpeg;base64,${readFileSync(`${root}public/food/${name}`).toString('base64')}`

/** The fridge: freezer over fridge, two handles. Same drawing as Logo.tsx. */
const fridge = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <rect x="5" y="1.5" width="22" height="29" rx="6" fill="${DENIM}"/>
  <rect x="5" y="1.5" width="22" height="29" rx="6" fill="url(#g)"/>
  <path d="M5 12.5h22" stroke="#fff" stroke-width="1.75"/>
  <rect x="20.5" y="5" width="2.5" height="4.5" rx="1.25" fill="#fff"/>
  <rect x="20.5" y="16" width="2.5" height="7" rx="1.25" fill="#fff"/>
</svg>`

/** The fridge centred on a square: `fill` is how much of the square it takes. */
const tile = (px, fill, background) => `
<body style="margin:0;width:${px}px;height:${px}px;display:grid;place-items:center;background:${background}">${fridge(Math.round(px * fill))}</body>`

const share = `
<style>
  @font-face { font-family: B; src: url(data:font/woff2;base64,${font}); font-weight: 200 800; }
  body { margin: 0; width: 1200px; height: 630px; background: ${ENAMEL}; color: ${INK}; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; display: grid; grid-template-columns: 600px 1fr; align-items: center; overflow: hidden; }
  .l { padding-left: 72px; }
  .brand { display: flex; align-items: center; gap: 14px; font: 700 40px B; letter-spacing: -.02em; }
  .brand span { font: 700 22px -apple-system, system-ui, sans-serif; letter-spacing: .04em; color: ${DENIM}; margin-left: -4px; }
  h1 { font: 700 104px/0.96 B; letter-spacing: -.03em; margin: 34px 0 26px; }
  p { font-size: 30px; line-height: 1.35; color: ${INK2}; margin: 0; max-width: 430px; }
  .r { position: relative; height: 630px; }
  .r img { position: absolute; object-fit: cover; border-radius: 28px; border: 6px solid #fff; box-shadow: 0 2px 4px rgba(15,22,32,.08), 0 30px 60px -30px rgba(15,22,32,.45); }
  .tag { position: absolute; left: 150px; top: 500px; background: #ffe7a3; color: #5c3b00; font: 700 26px -apple-system, system-ui, sans-serif; padding: 10px 18px; border-radius: 12px; rotate: -3deg; box-shadow: 0 8px 20px -10px rgba(15,22,32,.4); }
</style>
<div class="l">
  <div class="brand">${fridge(64)}FeedMe <span>AI</span></div>
  <h1>What's in the fridge?</h1>
  <p>One photo. Dinner from what you have, and the missing things on a list.</p>
</div>
<div class="r">
  <img src="${img('sample-fridge.jpg')}" style="left:40px;top:70px;width:330px;height:420px;rotate:-4deg">
  <img src="${img('pasta-aglio-olio.jpg')}" style="left:300px;top:60px;width:250px;height:220px;rotate:3deg">
  <img src="${img('teriyaki-salmon.jpg')}" style="left:320px;top:320px;width:240px;height:230px;rotate:-2deg">
  <div class="tag">needs soy sauce, ginger</div>
</div>`

const browser = await chromium.launch()
async function draw(html, width, height, file, transparent = false) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${root}${file}`, omitBackground: transparent })
  await page.close()
  console.log(file)
}

// the web: a bare mark where the browser supplies the ground, a padded one where the system crops
await draw(tile(192, 1, 'transparent'), 192, 192, 'public/icon-192.png', true)
await draw(tile(512, 1, 'transparent'), 512, 512, 'public/icon-512.png', true)
await draw(tile(512, 0.62, ENAMEL), 512, 512, 'public/icon-maskable-512.png')
await draw(tile(180, 0.72, ENAMEL), 180, 180, 'public/apple-touch-icon.png')
await draw(tile(32, 1, 'transparent'), 32, 32, 'public/favicon-32x32.png', true)
await draw(tile(16, 1, 'transparent'), 16, 16, 'public/favicon-16x16.png', true)
await draw(share, 1200, 630, 'public/og-image.png')
// the native app: iOS wants an opaque square and rounds it itself
await draw(tile(1024, 0.7, ENAMEL), 1024, 1024, 'assets/icon-only.png')
await draw(tile(2732, 0.16, ENAMEL), 2732, 2732, 'assets/splash.png')
await draw(tile(2732, 0.16, ENAMEL), 2732, 2732, 'assets/splash-dark.png')
await browser.close()
