# 🍳 FeedmeAI

Transform your ingredients into delicious meals with AI-powered recipe suggestions. Upload a photo, get instant cooking ideas, and enjoy step-by-step guided cooking.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-feedmeai.victorsaly.com-orange?style=for-the-badge&logo=react)](https://feedmeai.victorsaly.com)

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **OpenAI API Key** - [Get yours here](https://platform.openai.com/api-keys)

### Setup
```bash
# Quick setup with our script
./scripts/setup.sh

# Or manually:
git clone https://github.com/victorsaly/food-inventory-recip.git
cd food-inventory-recip
npm install
cp .env.example .env
# Add your OpenAI API key to .env
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

## Built with

**React 19** • **TypeScript** • **Vite** • **Tailwind CSS** (for the remaining ui primitives) • **OpenAI gpt-4o-mini** (vision + JSON mode)

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

> **Note on the API key.** `VITE_OPENAI_API_KEY` is compiled into the public bundle, so anyone can read it from the deployed site. Put a usage cap on the key, and plan to move the calls behind a small proxy (e.g. a Cloudflare Worker).

## 📖 Documentation

- **[Product Requirements](./docs/PRD.md)** - Full feature specifications
- **[Deployment Guide](./docs/deployment.md)** - How to deploy to production
- **[Security Guidelines](./docs/SECURITY.md)** - Security best practices

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.
