# Deploying FeedMe AI

There are three things to deploy, and they deploy separately.

## 1. The site and the web app

Pushing to `main` runs `.github/workflows/deploy.yml`: lint, type-check, unit tests, the end-to-end test,
then a build that is published to GitHub Pages. A failure at any step stops the deploy and the live site
stays as it was.

One build makes both:

- the product site at the root (`index.html`, `privacy/`, `support/`, `credits/`, `404.html`);
- the app at `/app/` (`app/index.html`), with its service worker at `/app/sw.js`.

The address is `feedmeai.victorsaly.com`, set by `public/CNAME`.

**GitHub Pages setting:** Settings, Pages, Source must be **GitHub Actions**. If it is "Deploy from a
branch", GitHub also publishes the repository as it is on every push, and the two race.

To check a build locally before pushing:

```bash
npm run build && npm run preview   # http://localhost:4173, the app at /app/
npm test && npm run test:e2e
```

## 2. The Workers

Pushing does **not** deploy them. From each folder:

```bash
cd worker && npx wrangler deploy                 # feedmeai-api: AI, recipes, shop prices, list, plans, reports
cd workers/favorites-api && npx wrangler deploy  # saved recipes
```

Secrets are set once per Worker and are not in the repository:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SPOONACULAR_KEY
npx wrangler secret put SEARCHAPI_KEY
npx wrangler secret put YOUTUBE_API_KEY   # optional
```

Settings that are in `worker/wrangler.toml`: `ALLOWED_ORIGINS` (the site, the iPhone app's
`capacitor://localhost`, and local development) and, to grant Plus by hand for testing, `PLUS_USERS`
(a comma-separated list of account ids). The plan limits are in `worker/src/plan.js`.

The app and the Worker can be deployed in either order: the app only uses what the Worker says it supports.

To try a change to the Worker against the real services without affecting the live one:

```bash
cd worker && npx wrangler dev --remote --port 8799
```

To see why a request failed on the live Worker: `npx wrangler tail`.

## 3. The iPhone app

```bash
npm run ios   # builds the web app, copies it into ios/, opens Xcode
```

In Xcode: choose the signing team, then Product, Archive, and Distribute App. The listing text, privacy
answers, review notes and screenshots are in `store/`. `store/listing.md` ends with the steps in order.
