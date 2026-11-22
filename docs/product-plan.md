# FeedMe AI: product plan

Written 21 November 2026. The shared rules are in the portfolio repository:
`victorsaly.com/docs/product-core.md` (what every app shares, Apple's rules, the order of work). Read that
first. This file is only what is particular to FeedMe AI. `docs/PRD.md` here is older; where they disagree,
decide and update one of them.

## The brief (a draft for Victor to correct)

- **For:** whoever is standing at an open fridge at six o'clock.
- **The one job:** one photo of what you have, then dinner from it, then the two or three missing things on a
  list you can read in the shop.
- **What it has:** photo to ingredients (with amounts) to ideas to a recipe to step-by-step cooking; a
  shopping list that compares shops; sign-in; a Worker holding the keys with a daily cap; installs and works
  offline.
- **What is missing to be a product:** a first screen that shows a real result; a desktop layout; a Recipes
  tab with more than four recipes; anything to see in Saved and List before signing in; one name (four
  spellings are in use); a mobile app; a site that explains it; a current video.
- **Done is:** on the App Store, with a product site and a 21-second video.
- **Not building:** meal plans, macros, a social feed.

## Where it stands

This one needs the most work, and the work is design, not code. The app code is small and typed. Around it
sits dead weight: 43 of 46 UI files are never imported, about 30 packages are unused, the lint script has no
config, and there are no tests. The audit did not upload a photo or sign in, so the screens after the photo
and the signed-in list have not been reviewed.

## The work

1. **S — Clear the ground.** Delete the unused UI files, `AnimatedFoodBackground` and the unused packages; add
   an ESLint config; choose one name and use it everywhere; decide what `workers/favorites-api` is for.
2. **M — A full review, with real photos and a signed-in account.** Five fridges, the whole path to the shop
   list, on a phone. This is the review the audit could not do. Its findings feed step 4.
3. **M — "Try with a sample photo."** A recorded run replayed with no AI call, and a real result on the first
   screen. It gives newcomers proof, lets the video be recorded for nothing, and gives tests a path to run.
4. **L — A new design, phone first.** Decide it before building: the look, the tabs, the first screen. Then:
   the tab bar that covers the "How it works" picture; a designed desktop (tabs in the header, two columns,
   a recipe grid); Saved and List with something to show when signed out; Recipes either filled (20 to 30)
   or its 23 filters cut to match.
5. **M — Tests.** One end-to-end test over the sample path; unit tests for `kitchen.ts` and `shopping.ts`.
6. **M — Native shell.** Capacitor, icon, splash, the native camera, screen stays awake while cooking.
7. **M — The native reasons** (Apple rejects a wrapped website): the camera; the shopping list offline in the
   shop; the share sheet for a list; a reminder is optional.
8. **M — Accounts for the store.** Sign in with Apple beside Google; delete-my-account inside the app; a way
   to report a bad recipe, since the content is generated. Depends on `arcade-api`.
8b. **L — Free and Plus.** Decided 21 November 2026: a free tier and one paid tier at the lowest sensible
   price. Proposed, for Victor to confirm: free is 3 photos a day, 2 shop comparisons a week, everything else
   included; Plus is £0.99 a month or £9.99 a year for 30 photos a day, shop prices whenever, and up to 10
   generated dish pictures a month. The work: the purchase screen, Apple's purchase and "Restore purchases",
   the Worker counting photos, comparisons and generated pictures separately (it counts 40 or 250 AI calls a
   day today), and the Paid Apps agreement, tax and bank details in App Store Connect. The web app stays on
   the free tier at launch.
9. **S — TestFlight**, then cook from it for a week. Measure the real cost of a dinner here before the
   limits are final.
10. **M — Product site**, from the shared template.
11. **M — Video**, re-recorded from the finished app. `brag-output/` already holds a video, a storyboard and
    a capture script that replays saved responses; they are not committed. Shot list, 21s: the fridge photo
    ("You have this. Now what?") → ingredients appear → ideas, a recipe opens → missing items go to the list
    → shop prices → logo.
12. **S — Submit**, then update the page on victorsaly.com.

## Open questions

- **Cost and price: decided, numbers to confirm.** Free tier plus one paid tier at the lowest sensible
  price (step 8b). Still open: the exact limits, whether Plus includes generated pictures (about 4 US cents
  each, the one cost that can sink a £0.99 price), and enrolment in Apple's Small Business Program (15%
  instead of 30%).
- **Which countries?** The shop comparison depends on the country. The store listing should only promise the
  ones that work.
- **Pending from before:** `ALLOWED_ORIGINS` and `SEARCHAPI_KEY` for the Worker. The app build adds a new
  origin (`capacitor://localhost`) that the Worker must allow.
