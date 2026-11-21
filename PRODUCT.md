# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Whoever is standing at an open fridge at six o'clock, phone in hand, deciding what to cook tonight. Later the
same person is in a supermarket aisle, often with no signal, buying the two or three things they were missing.

## Product Purpose

One photo of what you have, then dinner from it, then the missing things on a list you can read in the shop.
Done is: on the App Store, with a product site and a 21-second film. The web app stays, and stays installable.

## Positioning

It starts from the food you already have, in a photo, and ends at the shop with only what is missing and
where it is cheapest. Recipe apps start from a recipe; this starts from the fridge.

## Operating Context

- A kitchen, one hand busy, the phone propped up while cooking.
- A supermarket, reading the list offline.
- A phone first. The same web app also runs on a desktop and will be wrapped with Capacitor for iPhone.

## Capabilities and Constraints

- Photo to ingredients (with rough amounts), to ideas, to a written recipe, to step-by-step cooking.
- A shopping list that compares shops. UK first; other countries are untested.
- A recorded sample run that needs no AI and no network.
- Sign-in is optional (Google today; Sign in with Apple to come). The list and saved recipes are to work on
  the phone without an account.
- Free tier and one paid tier, "Plus". Proposed limits and price are in `docs/product-plan.md`; not final.
- Every AI call, shop search and generated picture costs money, so screens never make one by surprise.
- Not building: meal plans, macros, a social feed.
- Generated recipes need a way to report them before the App Store (not built yet).

## Brand Commitments

- The name is "FeedMe AI".
- The fridge logo stays.
- The look is "Cold Store" with the Denim blue `#3667c9`, chosen by Victor over the earlier cobalt.
- Victor's standing notes on the look: headings need more character, more food on screen, less plain.

## Evidence on Hand

- Six built-in recipes with licensed photos (`public/food/`, credits in `public/food/CREDITS.md`).
- One recorded sample run (`src/data/sample.json`). Only its stir-fry recipe is the model's own answer.
- Real UK shop prices recorded once, in `brag-output/work/` (not committed).
- No testimonials, ratings, user counts or press. Do not invent any.

## Product Principles

1. Dinner first. Whatever the person came for is in the first view, not a scroll below it.
2. Show what is missing. The gap between what you have and what you need is the product.
3. Works with one hand and a bad signal.
4. Never spend the person's daily allowance, or the owner's money, without a clear tap.
5. Nothing forced: no account needed to get dinner.

## Accessibility & Inclusion

Tap targets of at least 44 points, text contrast of 4.5 to 1, and reduced motion honoured.
