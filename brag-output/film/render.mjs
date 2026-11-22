/* Render the stage frame by frame: every frame is a pure function of t. */
import { chromium } from '@playwright/test'
const W = new URL('.', import.meta.url).pathname
const FPS = 30, DUR = 20.5, only = process.argv.slice(2).map(Number)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(`file://${W}stage.html`)
await page.evaluate(() => document.fonts.ready)
const frames = only.length ? only.map((t) => Math.round(t * FPS)) : Array.from({ length: Math.round(DUR * FPS) }, (_, i) => i)
for (const i of frames) {
  await page.evaluate((t) => window.seek(t), i / FPS)
  await page.screenshot({ path: `${W}${only.length ? 'still' : 'out/'}${only.length ? '-' + (i / FPS).toFixed(2) : String(i + 1).padStart(4, '0')}.png` })
}
await browser.close(); console.log('rendered', frames.length)
