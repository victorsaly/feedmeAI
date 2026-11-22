# FeedMe AI — launch video plan

**Angle.** Every recipe app starts from a dish and hands you a shopping list. This one
starts from the photo and finishes at the till. The video follows one unbroken thread —
one real photo, all the way to "which shop has it, and for how much" — because that
through-line *is* the product, and no competitor's demo can follow it that far.

**Hook (first 2s).** The photo lands and the question everyone actually has lands on top
of it: *You have this. Now what?* No logo first, no tagline first.

**Punchline.** "One photo. Dinner sorted, down to the till." Then the URL.

- **Tone:** default — punchy, playful, clean. 6 scenes, soft transitions, no shouting.
- **Format:** landscape 1920×1080, 30fps, ~20.5s.
- **Identity:** the app's own Cold Store palette — ground `#f2f6f9`, white cards, ink
  `#0f1620`, one cobalt action `#1f57ff`, tint `#eaf0ff`. System font (SF Pro), the same
  face the app renders in.

## Everything on screen is real

No mock-ups and no invented numbers. The footage is the real app, driven live in a
browser; the data behind it came from the live Worker and the live SearchAPI earlier
today, captured to `work/` and replayed so the render is deterministic:

| On screen | Where it came from |
|---|---|
| The photo | `example-images.json` — the app's own "spread ingredients out clearly" example |
| 10 ingredients + amounts | real `POST /v1/ai/identify` on that photo |
| 5 dinner ideas | real `POST /v1/ai/suggest` |
| Vegetable Stir-Fry, 25 min, Easy, 420 kcal, 7 steps | real `POST /v1/ai/expand` |
| Soy sauce £0.90 · ginger £1.25, by shop | real SearchAPI Google Shopping, `gl=gb`, through the Worker's own supermarket mapping |

The only staging is timing: API responses are replayed from those captures so each take
is identical.

## Storyboard

| # | t | Length | Beat | On screen | Caption |
|---|---|---|---|---|---|
| 1 | 0.0 | 2.6s | Hook | The photo lands, tilted, on the cold ground | **You have this.** → **Now what?** |
| 2 | 2.6 | 3.4s | Reveal | Real app: photo goes in, ingredients snap on as magnets one by one | One photo. Ten ingredients. |
| 3 | 6.0 | 4.0s | Highlight 1 | Real ideas list → recipe sheet opens: Vegetable Stir-Fry, 25 min, Easy | Dinner from what's **actually** in there. |
| 4 | 10.0 | 3.5s | Highlight 2 | Tap `+` on soy sauce and ginger → they fly to the List tab | The two things you're missing, on a list. |
| 5 | 13.5 | 4.0s | Highlight 3 | Compare shops: Iceland 2/2 £2.25, Morrisons 2/2 £2.45, Ocado, Sainsbury's | Which shop has them. And for how much. |
| 6 | 17.5 | 3.0s | Punchline | Mark + wordmark, URL | One photo. Dinner sorted, down to the till. |

Total **20.5s**.

## Sound

One piece, not music-plus-effects: a warm major-key bed at ~100bpm in the app's own
register — soft marimba-ish plucks, light brush percussion, a bass that enters on the
reveal. The interface sounds are written into the same key: a small tick as each magnet
lands (scale degrees, so the list *plays a phrase*), a softer one per list item, and a
single resolved chord under the price reveal. Effects sit under the music, nothing spiky,
the repeated ticks kept low and back in the mix. It lifts at scene 5 and lands on the
outro.

## Build

1. Drive the real app (`npm run dev`, phone viewport) in Playwright with the captured
   responses stubbed; record video → extract PNG frames.
2. Compose in a single HTML stage where every frame is a pure function of `t`: the app
   frames inside a phone shell, type and background animated in CSS.
3. Capture 615 frames at 1920×1080, check stills mid-transition, render with ffmpeg.
4. Poster = strongest settled frame, baked in as frame 0.
