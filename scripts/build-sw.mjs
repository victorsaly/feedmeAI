/*
 * Writes dist/sw.js with the list of files to warm on install, and a version
 * derived from their contents.
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
const SKIP = new Set(['sw.js', 'CNAME', '.DS_Store', 'favicon-generator.html'])

const files = walk(DIST)
  .map((f) => '/' + relative(DIST, f).split(sep).join('/'))
  .filter((p) => !SKIP.has(p.slice(1)))
  .sort()

if (!files.includes('/index.html')) throw new Error('no index.html in dist — did the build run?')

const stamp = createHash('sha256')
files.forEach((p) => stamp.update(p).update(readFileSync(join(DIST, p.slice(1)))))
const version = stamp.digest('hex').slice(0, 12)

writeFileSync(
  join(DIST, 'sw.js'),
  readFileSync(TEMPLATE, 'utf8')
    .replace('"__VERSION__"', JSON.stringify(version))
    .replace('__SHELL__', JSON.stringify(files, null, 2))
)
console.log(`sw.js  ${files.length} files  v${version}`)
