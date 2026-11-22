# FeedMe AI: where it is

Updated 22 November 2026. The plan is `docs/product-plan.md`; why each thing was decided is in
`docs/history.md`.

## Live

- **The product site** at https://feedmeai.victorsaly.com, with Privacy, Support and Photo credits pages
  and the 20-second film.
- **The web app** at https://feedmeai.victorsaly.com/app/, in the new design: the photo as the fridge door,
  three tabs, a list that needs no account, the sample photo, the first-photo question.
- **The Worker**, with the plan limits (3 free photos a day, 2 price checks a week), report a recipe,
  delete my data, and the corrected instructions to the AI. A real photo ran end to end on 21 November.
- **The page on victorsaly.com**, with the new screenshot, the film and the updated story.

## Steps of the plan

| Step | State |
| --- | --- |
| 1 Clear the ground | Done |
| 2 Full review: five fridges, a real phone, a real account | **Not done.** Needs Victor and a phone. |
| 3 Sample photo | Done. All five recipes are the AI's own. |
| 4 New design | Done, phones and wide screens. Reviewed twice by an independent design review. |
| 5 Tests | Done: 85 unit tests, 7 end-to-end tests, run before every deploy. |
| 6 Native shell | Built. Launches in the simulator. **Never run on a real iPhone.** |
| 7 Native reasons | Built: camera, timer notification, screen awake, haptics, share sheet. Untested on a phone. |
| 8 Accounts for the store | Report a recipe and Delete my data are live. Sign in with Apple is not started. |
| 8b Free and Plus | Limits are live. Nothing sells Plus; no price is shown anywhere. |
| 9 TestFlight | **Not started.** |
| 10 Product site | Done and live. |
| 11 Film | Done. Only looked at as stills; nobody has watched it through with sound. |
| 12 Submit | Listing, screenshots, privacy answers and review notes are in `store/`. **Not submitted.** |

## What only Victor can do

1. Choose the signing team in Xcode. This is the seller decision.
2. Run the app on an iPhone: the camera, a timer ringing while locked, the screen staying on, the list in
   flight mode.
3. Archive, upload, and fill App Store Connect from `store/listing.md`.
4. A week on TestFlight, then submit.

## Decisions still open

- **The limits and the price.** 3 photos a day and 2 price checks a week are live but were proposed, not
  confirmed. £0.99 a month for Plus is a proposal and appears nowhere in the app.
- **Whether Plus includes generated pictures**, the one cost that can sink that price.
- **The seller name**, and Android (after iOS).

## Known gaps

- **Version 1.0 on iPhone has no sign-in**, so no shop prices and no sync there. Sign in with Apple and
  full account deletion need `arcade-api`, which is another repository.
- **"Delete my data" removes this app's data, not the shared sign-in** itself.
- **Nobody is told when a recipe is reported.** Reports are rows in the Worker's `reports` table.
- **Signing in on the web now returns to `/app/`.** Untested: it depends on what `arcade-api` accepts.
- **The Privacy page was written from the code** and has not been read by Victor. Support has no contact
  address, only GitHub issues.
- **The hero photo is a bowl of vegetables** under "What's in the fridge?". A real fridge photo means
  re-recording the sample.
- **The sample's stir-fry still says 25 minutes and 420 kcal**, the figures the AI used to copy. The
  tests, site screenshots and film are built on that recording.
- **GitHub Pages is still set to deploy from the `main` branch** as well as from the workflow, so two
  deploys race on every push. Settings, Pages, Source: "GitHub Actions".
- **`workers/favorites-api`** still answers any origin. Fold it into the main Worker.
- **Leftover styles and scripts**: rules in `flow.css` for parts that no longer exist, and unused scripts
  in `scripts/`.
- **`brag-output/`**, which holds the film and the scripts that make it, is not committed.
