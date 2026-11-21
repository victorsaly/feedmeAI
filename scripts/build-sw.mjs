/*
 * Writes dist/app/sw.js with the list of files to warm on install, and a
 * version derived from their contents. The worker lives with the app, under
 * /app/, so it answers for the app and not for the product site beside it.
 *
 * It also writes dist/sw.js, which exists only to retire the worker that
 * older copies of the app registered at the root before the app moved.
 *
 * The script and style names carry a content hash, so the list cannot be kept
 * by hand — and a worker that only caches what you happen to visit is no use
 * to someone who installs the app and then walks into a shop. The version
 * changing is what evicts the last build's cache.
 */

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname
const TEMPLATE = new URL('./sw.js', import.meta.url).pathname

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

/* CNAME is for Pages, sw.js is this file, and the generator page is a dev tool */
const SKIP = new Set(['sw.js', 'app/sw.js', 'CNAME', '.DS_Store', '404.html'])
/* the product site's own pages and pictures: the app never shows them */
const SITE = [/^\/index\.html$/, /^\/privacy\//, /^\/support\//, /^\/site\//, /^\/assets\/(site|privacy|support)-/]

const files = walk(DIST)
  .map((f) => '/' + relative(DIST, f).split(sep).join('/'))
  .filter((p) => !SKIP.has(p.slice(1)) && !SITE.some((re) => re.test(p)))
  .sort()

if (!files.includes('/app/index.html')) throw new Error('no app/index.html in dist — did the build run?')

const stamp = createHash('sha256')
files.forEach((p) => stamp.update(p).update(readFileSync(join(DIST, p.slice(1)))))
const version = stamp.digest('hex').slice(0, 12)

writeFileSync(
  join(DIST, 'app', 'sw.js'),
  readFileSync(TEMPLATE, 'utf8')
    .replace('"__VERSION__"', JSON.stringify(version))
    .replace('__SHELL__', JSON.stringify(files, null, 2))
)

/* Before the product site took the home page, the app registered /sw.js for
   the whole site. That worker would go on answering "/" with the old app when
   offline. This one replaces it, removes itself, and reloads any open page. */
writeFileSync(
  join(DIST, 'sw.js'),
  `self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => clients.forEach((c) => c.navigate(c.url)))
  );
});
`,
)
console.log(`app/sw.js  ${files.length} files  v${version}`)
