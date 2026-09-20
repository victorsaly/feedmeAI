# 🍳 FeedmeAI

Transform your ingredients into delicious meals with AI-powered recipe suggestions. Upload a photo, get instant cooking ideas, and enjoy step-by-step guided cooking.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-feedmeai.victorsaly.com-orange?style=for-the-badge&logo=react)](https://feedmeai.victorsaly.com)

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **An OpenAI API key** on the worker (`worker/`), or run without one in demo mode

### Setup
```bash
# Quick setup with our script
./scripts/setup.sh

# Or manually:
git clone https://github.com/victorsaly/food-inventory-recip.git
cd food-inventory-recip
npm install
# No .env needed: the deployed worker does the AI. To use your own,
# see worker/wrangler.toml for the secrets and `npx wrangler deploy`.
```

### Development
```bash
# Start dev server
./scripts/dev.sh
# Or: npm run dev

# Build for production  
./scripts/deploy.sh
# Or: npm run build
```

## What it does

One photo of the fridge → the list of what's in it (editable) → a short draft of dinners you could make tonight → any one written out in full, with a step-by-step cook mode. Saved recipes live in local storage.

Without an OpenAI key the app still runs: the photo step shows a sample list and ideas come from the bundled recipes, labelled as such.

## Design

**Cold Store** — the fridge is the interface. Cold-white ground, pure-white grouped lists, one glacier-blue interior light behind the single cobalt action, ingredients stuck to the door as magnets. System font so it feels installed; large-title hierarchy; a bottom sheet (vaul) for the recipe. All of it lives in `src/styles/flow.css`.

## Meal and nutrition

A picker (Breakfast / Lunch / Dinner / Dessert) sits above the ideas list on both the Fridge and
Recipes tabs. It defaults to whatever the clock suggests (`mealForNow` in `kitchen.ts`) and then
remembers your last choice in `localStorage`. Changing it while ideas are already showing marks
them stale, the same pattern used when you edit the ingredient list &mdash; a tap on "Update ideas"
redraws them for the new meal. Recipes tab is a strict filter over the six built-ins (a meal with
none yet says so honestly); the Fridge tab's AI suggestions ask the model for that meal directly,
and its local/offline fallback prefers a meal match but still shows something rather than nothing
if none exists.

Every recipe carries an estimated per-serving nutrition figure (calories, protein, carbs, fat) &mdash;
authored by hand for the six built-ins, asked of the model (and labelled as an estimate) for a
genuinely new AI idea.

## Images

The six built-in recipes carry a real photo of the dish (`public/food/`, credits in
`public/food/CREDITS.md`). Opening a recipe from the Recipes or Saved tab shows that photo.
Opening an idea generated from your own fridge photo always shows **your photo** as the source
instead, labelled as such, even if that idea happens to also have a stock photo.

A genuinely new AI-suggested dish (no stock photo, no upload precedent) can also get a small "suggested look" image, generated once the recipe is written out and cached alongside it &mdash; best-effort: no key, no network, or a failed generation all just mean no image, never a stand-in photo passed off as the real thing.

## Real recipes and videos

Signed in, [Spoonacular](https://spoonacular.com/food-api) joins the draft: up to three published
recipes that use the most of what's in the photo, each with a real photo of the dish, alternating
with the model's own ideas (a title both sides suggest keeps the real one). Opening one shows it as
the publishing site wrote it, credited and linked, with nutrition from its ingredient data rather
than the model's estimate. Every recipe &mdash; real, AI or built-in &mdash; also looks for a video
of it being made (Spoonacular first, then YouTube itself if the worker has a `YOUTUBE_API_KEY`),
shown as a still that becomes the player on tap, and kept with a saved recipe.

The key lives in the worker (`npx wrangler secret put SPOONACULAR_KEY`, in `worker/`), behind the
same sign-in as the shopping search, because the free tier is 150 points a day. Signed out, without
the secret, or over the limit, the app is exactly what it was before.

## Recent, and the Recipes tab

Every fridge photo you run is kept on the device (`src/lib/history.ts`, `localStorage`, newest
twenty): a thumbnail (the newest three keep a 640px copy too), the list it produced, the ideas,
and every recipe you opened &mdash; with its video and picture. "Recent" on the start screen
brings one back exactly as it was, with no network call; the bin forgets it.

The Recipes tab browses the built-ins by meal as before, and now also searches: type anything,
or tap a chip (`src/data/categories.json` &mdash; time, diet, dish type, cuisine). Matching
built-ins come first; signed in, Spoonacular's results follow. Each search is remembered for the
session, so flicking between chips is free &mdash; and the last twelve, results included, are kept
on the device under "Recent searches" so they come back without a call.

## Saved, on the server

Saved recipes live under the signed-in account, not this device &mdash; a small sibling worker
(`workers/favorites-api/`, its own `wrangler.toml`) with a `favorites` table on the same D1
database `worker/` already uses for the shopping list, keyed by account id so nothing crosses
between people. `src/lib/favorites.ts` is the client: one fetch per session, cached and reactive,
so the heart on a recipe and the badge on the Saved tab agree instantly after a save or remove.

The photo you took stays on this device &mdash; only the recipe itself (its own photo, if it has
one) goes to the server, so a save never uploads what's actually in your fridge. Signed out, Saved
still asks you to sign in, same as before; there's no local fallback left, since the feature only
ever appears once you have an account.

## Built with

**React 19** • **TypeScript** • **Vite** • **Tailwind CSS** (for the remaining ui primitives) • **Cloudflare Workers + D1** (`worker/`) • **OpenAI gpt-4o-mini** (vision + JSON mode, behind the worker)

## Project structure

```
├── src/
│   ├── App.tsx                  # the one page and its stages (start → haul → sheet → cook / saved)
│   ├── components/
│   │   ├── PhotoPicker.tsx      # the fridge: camera / library / drop
│   │   ├── HaulList.tsx         # what you've got, as magnets, editable
│   │   ├── IdeaList.tsx         # draft ideas (and the built-in list)
│   │   ├── IdeaSheet.tsx        # one idea written out; save / cook
│   │   ├── CookScreen.tsx       # one step at a time
│   │   └── SavedList.tsx
│   ├── lib/
│   │   ├── kitchen.ts           # identify → suggest → expand, with the offline fallback
│   │   ├── image-optimizer.ts   # 768px JPEG for the vision call
│   │   └── favorites-storage.ts
│   ├── data/recipes.json        # the built-in recipes
│   └── styles/flow.css          # the whole look
```

> **No keys in the page.** Every call that needs a secret &mdash; OpenAI, Spoonacular, SearchAPI, YouTube &mdash; goes through the worker in `worker/`, which holds the keys and meters the AI calls per address (more when signed in; the generated "suggested look" image is signed-in only, since it costs real money). `GET /v1/ai` tells the app whether a model is configured; without one it runs in its built-in demo mode.

## 📖 Documentation

- **[Product Requirements](./docs/PRD.md)** - Full feature specifications
- **[Deployment Guide](./docs/deployment.md)** - How to deploy to production
- **[Security Guidelines](./docs/SECURITY.md)** - Security best practices

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.
