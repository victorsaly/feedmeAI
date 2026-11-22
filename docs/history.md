# FeedMe AI: decisions

Each decision, with its date and why. Newest first.

## 22 November 2026

- **The iPhone app is signed with Victor's own team** ("Victor Saly", `Z452L5C5VZ`), not the client
  company whose distribution certificate is also on this machine. A development build was installed on
  his iPhone 16, and a distribution-signed build was exported. Signing registered the bundle ID
  `com.victorsaly.feedmeai` with that team. Nothing has been uploaded to App Store Connect.

- **The leftovers are gone.** Dead style rules, 56 unused colour palettes, an old warm-cream theme that a
  duplicate import had been hiding, the old Tailwind config and theme file, nine unused scripts, the
  component-generator config and an unused data file. The app's stylesheet went from 237 kB to 72 kB.
  Every screen was captured before and after and compared byte for byte; none changed.
- **Old documents replaced.** `docs/PRD.md` described a different product ("Smart Kitchen Assistant") and
  was removed. `docs/deployment.md` and `docs/SECURITY.md` were generic templates (the security policy was
  GitHub's own, pointing reports at GitHub) and were rewritten for this project.

- **These documents are committed**, at Victor's request. Until now `product-plan.md` and `kickoff.md` were
  kept out of git on purpose.
- **The FeedMe page on victorsaly.com is updated** (its pull request 9): new screenshot, the film, the
  story brought up to date.

## 21 November 2026

- **Version 1.0 of the iPhone app has no sign-in and no purchases, on purpose.** With no third-party
  sign-in, Apple's rules on Sign in with Apple and in-app account deletion do not apply; with nothing to
  buy, neither do the payment rules. The cost is that the iPhone app has no shop prices or sync until a
  later version. The app no longer shows a shop-price button or a "signing in is not here yet" line: it
  simply does not offer what it cannot do.
- **The app asks once before sending the first photo to OpenAI.** Apple requires explicit permission
  before personal data goes to a third-party AI, and a photo of your kitchen can be personal. It applies
  on the web too. Nothing is sent until the person taps "Send my photo".
- **The iPhone app is iPhone only**, not iPad: the layout is a phone layout. It carries a privacy manifest.
- **The store listing, privacy answers, review notes and five screenshots are in `store/`.**
- **The page on victorsaly.com was not touched.** That repository is on another branch with work in
  progress. It needs the new screenshot, the film, and the two addresses (site and `/app/`).

- **All five sample recipes are now the model's own.** The four hand-written ones were replaced once the
  AI answered again. The stir-fry keeps its September recording, because the tests, the site and the film
  are built on it.
- **The model was copying its example numbers.** The Worker's instructions showed `"minutes":25` and
  `"calories":420` as the shape to reply in, and every recipe came back as 25 minutes and 420 kcal (the
  stir-fry's recording has exactly those figures). The instructions now describe each figure instead of
  giving one. Checked on a preview of the Worker: the same salad went from 25 minutes and 420 kcal to 10
  minutes and 150 kcal. The four new sample recipes were recorded with the corrected instructions.
- **The AI's refusals stopped on their own** on the evening of 21 November; the cause was never seen. The
  Worker now logs the reason for any refusal.

- **The film is re-recorded from the finished app**: 20.5 seconds, 1920 x 1080, with the same six scenes as
  the storyboard and the same synthesised music. It is `brag-output/feedme-ai-film.mp4`, and on the site.
  It is filmed from the real app replaying the answers and UK prices recorded in September 2026. The
  scripts that make it are in `brag-output/film/` and, like the rest of `brag-output/`, are not committed.
- **The site review asked for eight fixes and they were made**: the photo and phone straightened so only
  magnets tilt; the magnets recomposed along the photo's lower edge at every width; a shelf tag at reading
  size in the first screen; a caption saying the hero is the recorded sample; a Photo credits page linked
  from every footer; alignment of the two bands; a different screenshot for step 1; "Try a sample photo"
  beside the closing button.

- **The product site is the home page and the app is at `/app/`**, on the same address, so nothing people
  have stored is lost. One build makes both; the site is plain HTML and CSS, not Astro, because the shared
  template the plan refers to does not exist yet. If it is built later, these pages are its first content.
- **The site has no store badge, no film and no price**, because none of those exist yet. It has real
  screenshots of the app on the sample, the sample photo, and the six licensed recipe photos.
- **Installed copies of the app are moved on.** The home page sends a copy opened from a home screen to
  `/app/`, and a small worker at the old address retires the one that used to answer for the whole site.
- **The home page carried a made-up rating** ("4.8 from 150 ratings") in its search-engine data. Removed.
- **Privacy and Support pages were written from what the code does.** They are drafts for Victor to read:
  they are the addresses Apple will ask for. Support points to GitHub issues because no contact address
  has been given.
- **The iPhone app starts at `/app/`** inside its bundle (`appStartPath`), so it never shows the site.

- **The Worker counts by plan, not by raw AI calls.** Free: 3 photos a day, 2 shop price checks a week, no
  generated pictures. Plus: 30 photos a day, 10 price checks a day, 10 generated pictures a month. These
  are the proposed numbers from step 8b and are **not confirmed**; they live in one file,
  `worker/src/plan.js`. A photo or a price check is only counted when it succeeds.
- **A price check is one request for the whole list** (`POST /v1/shopping/compare`), so "2 a week" means
  two lists, not two items.
- **Someone with no account is counted by device**, using a random id the app makes once, so people on one
  network do not share an allowance. The old cap of 40 AI calls a day per address still stands behind it,
  because a device id can be thrown away.
- **Generated pictures are now Plus only.** They were open to anyone signed in, at about 4 US cents each.
- **Nobody can buy Plus yet, and the app does not mention a price.** Purchases need products in App Store
  Connect and a way for the Worker to check a receipt. Until then `PLUS_USERS` in the Worker's settings
  (a list of account ids) grants Plus by hand, for testing.

- **"Report this recipe" is at the foot of every recipe**, needs no account, and goes to the Worker
  (`POST /v1/reports`): the recipe as shown, one of three reasons, an optional note. Capped at 20 a day per
  person. Nobody is notified yet; reports are rows in the `reports` table to be read.
- **"Delete my data" is in Account** for someone signed in: two taps, then the Worker deletes the shopping
  list, saved recipes and usage counts (`DELETE /v1/account`), the device is cleared and they are signed
  out. The screen only says "deleted" when the server confirms it.
- **It is called "Delete my data", not "Delete account", on purpose.** The sign-in identity is in
  `arcade-api` and shared with the other victorsaly.com sites, so this app cannot remove it. Apple's rule
  (5.1.1) asks for the account itself to be deletable, so this is not enough for review on its own.
- **Sign in with Apple is not started.** It lives in `arcade-api`, which is not on this machine, and needs
  the Apple Developer account. The iPhone app also needs a way for sign-in to return to it.

- **What the iPhone app does that a browser tab does not** (Apple's guideline 4.2): the system camera; a
  cooking timer that rings when the phone is locked or the app is behind another (a local notification,
  asked for the first time a timer is started); the screen held awake while cooking; taps you can feel when
  ticking the list, adding to it and when a timer ends; the system share sheet for the list; and a list
  that opens with no signal. A daily "what's for dinner" reminder was left out: it is optional in the plan
  and a second permission prompt.
- **An offline note on the first screen**, in the web app and the iPhone app, so nobody spends a photo on a
  request that cannot leave the phone.

- **The iPhone shell is Capacitor 8, bundle ID `com.victorsaly.feedmeai`**, as the shared plan says. The
  project uses Swift packages, not CocoaPods. iOS 15 and up, portrait only.
- **The app icon is the Denim fridge on enamel**, and every icon and the share image are now drawn from the
  logo by a script (`npm run icons`), so they cannot drift from it again.
- **Signing in is switched off inside the iPhone app for now.** It is a trip to Google and back to a web
  address, and the app has no address to come back to. It returns with Sign in with Apple in step 8. Until
  then the app has no shop prices and no sync; everything on the phone works.
- **The Worker's allowed origins include `capacitor://localhost`** in `worker/wrangler.toml`. It is not
  deployed. Until it is, the iPhone app cannot reach the AI.

- **The list and saved recipes live on the device first.** Neither needs an account any more. Signed in,
  each change is also sent to the account, and anything that could not be sent (no signal in the shop) is
  sent the next time the list loads. Signing out leaves the list on the phone.
- **Shop prices still need an account**, because the Worker only answers a signed-in search. The list says
  so on the button instead of hiding the feature.
- **Three tabs: Fridge, List, Recipes.** Saved is a switch inside Recipes. Signed out, the filters shown are
  only the ones the built-in recipes can answer (10 of 21).
- **Account is a sheet behind the person icon**: sign in, the country for shop prices, sign out. Sign in
  with Apple and Delete account are not in it yet; both need `arcade-api` (step 8).
- **Wide screens:** tabs sit in the header, the first screen and the results are two columns, and a recipe
  opens as a panel beside the page.
- **An independent design review asked for eight fixes** after the first build of the main path, and all
  eight were made: headings in the display face instead of small grey capitals, no eyebrow over the cooking
  step, a fuller cooking screen with the food on it, one description in the recipe, one blue action per
  view, matching times on the row and the recipe, and two edge details.

- **The look gets a voice, and food.** Victor said the proposals were too plain, that the type lacked
  character and that he wanted more food on screen. So: headings, dish names and numbers are set in
  Bricolage Grotesque (self-hosted, so it works offline); the photo you took is a large band at the top of
  the results with the ingredients stuck to its lower edge as magnets; every idea row has a picture; and
  anything to buy carries an amber shelf tag. Everything read or tapped stays in the phone's own typeface.
- **An idea with no dish picture shows a piece of your own photo.** It puts food on every row at no cost. A
  real dish picture replaces it when one is found. A recipe never opens on the raw-ingredient photo.
- **Ideas do not refresh by themselves.** Changing the list or the meal still needs a tap on "Update ideas",
  because each refresh is a paid AI call. The button now stays on screen as a bar instead of scrolling away.
- **The back button closes layers** (cooking, then the recipe, then the results) through the browser's
  history, with no router added.
- **PRODUCT.md and a surface brief** were added for the design workflow (`.impeccable/surfaces/`).

- **The blue is Denim, `#3667c9`.** Victor's choice, over today's cobalt `#1f57ff`, which he found too
  strong. It goes into the app with the new design (step 4), with the icon and share image.
- **The sample is a `Haul`.** "Try a sample photo" opens a bundled history entry, so it uses the same code
  as reopening an earlier photo and makes no network call. It is never written into Recent.
- **Four of the five sample recipes are hand-written, not recorded.** Only Vegetable Stir-Fry is the
  model's own answer. The Worker returned "the AI is rate-limited right now" (429) on every attempt to
  record the others. `node scripts/record-sample.mjs` replaces them once the AI answers again.

- **The plan is approved.** Victor reviewed the visual (https://claude.ai/artifact/RuSofHez7cmS3r8rYMyqfs)
  and said he is happy with the plan. Recorded as accepting its recommendations: the Cold Store look, three
  tabs (Fridge, List, Recipes, with Saved inside Recipes), List and Saved working without an account, the
  name "FeedMe AI", UK first, the web app at `/app`. He did not name each one, so check any of these with
  him before work that depends on it is hard to undo.
- **A free tier and a paid tier at the lowest sensible price.** Victor's decision. Why a paid tier at all:
  shop prices and generated pictures cost money on every use. Proposed and not yet confirmed: free is 3
  photos a day and 2 shop comparisons a week; Plus is £0.99 a month or £9.99 a year. Why £0.99: after VAT
  and Apple's 15% it leaves about £0.70, and a heavy month costs about £0.65 to serve; below that a heavy
  user costs more than they pay.
- **Still Victor's to decide:** the seller name on the App Store, and Android (after iOS is live).
