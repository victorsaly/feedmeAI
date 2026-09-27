/*
 * FeedmeAI, offline.
 *
 * The shopping list is the reason this exists. It is held in this browser and
 * read in a supermarket, which is exactly where the signal goes — so the app
 * has to open and the list has to be there with no network at all. The whole
 * shell is warmed on install rather than gathered as you browse, because
 * someone who installs this and then walks into a shop has browsed nothing.
 *
 * What it never touches is anything live: the recipe and favourites workers,
 * the identity service, Unsplash, YouTube. Every one of those is a question
 * whose answer changes, and a stale answer is a wrong answer. Those requests
 * are left alone to succeed or fail on their own.
 *
 * SHELL and VERSION are written by scripts/build-sw.mjs at build time — the
 * asset names carry a content hash, so they cannot be listed by hand.
 */

const VERSION = "__VERSION__";
const SHELL = __SHELL__;

const CORE = `feedme-core-${VERSION}`;
const KEEP = [CORE];

const INDEX = "/index.html";

/*
 * Match on the URL alone.
 *
 * A server that answers `Vary: Origin` (vite preview) or `Vary:
 * Accept-Encoding` (GitHub Pages) makes the cache compare headers too, and
 * install stored these with a plain same-origin fetch that carries neither.
 * A `type="module"` script request does send Origin, so every asset missed
 * and the app opened to a blank page offline. These files are content-hashed
 * and immutable; there is nothing for them to vary by.
 */
const MATCH = { ignoreVary: true };

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CORE)
      /* one miss must not fail the whole install, or a single renamed file
         leaves the app with no offline copy at all */
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => !KEEP.includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  /* anything not ours is live: workers, identity, photos, video */
  if (url.origin !== self.location.origin) return;

  /*
   * Navigations: the network first, so a deploy is picked up on the next
   * launch, falling back to the shell we hold. This is a single-page app, so
   * any path in scope is answered by the one page.
   */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CORE).then((c) => c.put(INDEX, copy));
          return res;
        })
        .catch(async () => (await caches.match(INDEX, MATCH)) || Response.error())
    );
    return;
  }

  /*
   * Everything else same-origin is the built shell: script and style names
   * carry a content hash and the pictures never change, so what we have is
   * always right. Anything missed is fetched and kept for next time.
   */
  event.respondWith(
    caches.match(request, MATCH).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CORE).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => hit || Response.error())
    )
  );
});
