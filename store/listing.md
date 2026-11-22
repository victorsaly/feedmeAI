# FeedMe AI: App Store listing

Everything App Store Connect asks for, ready to paste. Written 21 November 2026 for version 1.0 of the
iPhone app. Character limits are Apple's; counts are given where a field is close to its limit.

Version 1.0 on iPhone has **no sign-in and no purchases**. That is deliberate: it means the rules on Sign in
with Apple, in-app account deletion and in-app purchase do not apply to this version. It also means the
iPhone app has no shop prices yet, so nothing below mentions them.

## App information

| Field | Value |
| --- | --- |
| Name (30) | FeedMe AI |
| Subtitle (30) | Dinner from your fridge photo (29) |
| Bundle ID | com.victorsaly.feedmeai |
| SKU | feedmeai-ios |
| Primary category | Food & Drink |
| Secondary category | Lifestyle |
| Price | Free |
| Availability | United Kingdom first |
| Content rights | Contains third-party content (recipe photos under Creative Commons licences, credited at https://feedmeai.victorsaly.com/credits/) |

## Version information

**Promotional text (170)**

One photo of what you have. Dinner from it, and the two or three missing things on a list you can read in the shop. No account needed.

**Description**

It's six o'clock and the fridge is open. FeedMe AI answers the question you're actually asking: what can I make from this?

Take one photo of the fridge, or of everything laid out on the worktop. The app lists what it can see, with rough amounts, and you correct anything it got wrong. Then it suggests dinners made from what you already have, and tells you what each one still needs.

Open a recipe and the missing things come first, with one button to put them on your shopping list. What you already have is ticked off underneath.

Then cook. One step at a time, in type you can read from the hob, with the amounts that step needs right under it. Where a step names a time, there's a timer that rings even if your phone is locked. The screen stays on while you cook.

Your shopping list is kept on your phone, so it opens in the shop with no signal. It names what to look for on the shelf, and you can share it.

No photo? Six recipes come with the app and need nothing: no photo, no account, no connection.

Good to know:
• No account. Nothing to sign up for.
• Free, with a daily limit on photos.
• Your photo is sent to an AI service to be read and is not stored. The app asks before sending your first one.
• Recipes made from your photo are written by AI and can be wrong. Every recipe has a "Report this recipe" link, and a person reads each report.
• Nutrition figures are estimates, not measurements.

**Keywords (100)**

recipes,fridge,ingredients,dinner,cooking,shopping list,leftovers,meal ideas,cook,pantry,photo (92)

**URLs**

| Field | Value |
| --- | --- |
| Support URL | https://feedmeai.victorsaly.com/support/ |
| Marketing URL | https://feedmeai.victorsaly.com/ |
| Privacy Policy URL | https://feedmeai.victorsaly.com/privacy/ |

**What's New** (not needed for a first version)

**Copyright:** 2026 Victor Saly *(or the company, once the seller is decided)*

## Screenshots

6.9-inch iPhone, 1320 × 2868, in `store/screenshots/`, in this order:

1. `1-results.png`: the photo, what was read in it, and dinner ideas
2. `2-recipe.png`: a recipe leading with what to buy
3. `3-cooking.png`: a cooking step with its amounts and a running timer
4. `4-list.png`: the shopping list
5. `5-start.png`: the first screen

They are captures of the app's real screens on the bundled sample, rendered as the iPhone app renders them.
They have no iOS status bar, because they were taken from the web build. Apple accepts that; screenshots
taken on a real phone would look more at home in the store, and should replace these once the app runs on one.

The App preview video slot can take the 20-second film, but Apple wants it at the phone's own size and
showing only the app. The existing film is landscape with captions, so it is for the site, not this slot.

## Age rating

Answer "None" or "No" to every content question. Result: **4+**.

The one to think about: "Unrestricted web access" is **No** (links open Safari for the privacy, support and
credits pages only).

## App privacy ("nutrition label")

Data collected, all **not linked to the user** and **not used for tracking**:

| Data type | Why | Purpose |
| --- | --- | --- |
| Photos or Videos | The photo you take is sent to be read into a list of ingredients. It is not stored. | App Functionality |
| Device ID | A random number the app makes, used to count the daily photo allowance. | App Functionality |
| Other User Content | A recipe you report, with your reason and note. | App Functionality |

Not collected: contact info, location, identifiers tied to a person, usage analytics, diagnostics, purchases.
The same answers are in the app's privacy manifest, `ios/App/App/PrivacyInfo.xcprivacy`.

Check before submitting: these describe the iPhone app as it is at 1.0, with no sign-in. When sign-in is
added, "User ID" and "Other User Content" (the list and saved recipes) become **linked** data.

## Export compliance

The app uses only standard HTTPS. `ITSAppUsesNonExemptEncryption` is already set to `false` in `Info.plist`,
so App Store Connect should not ask.

## Notes for App Review

No account or sign-in is needed, and there is nothing to purchase.

To see the whole app without taking a photo: on the first screen tap "Try a sample photo". This opens a
recorded example (one photo, the ingredients read from it, five dinner ideas and their recipes) and makes no
network request. From there open any recipe, tap "Add ... to the list", then "Cook step by step".

To test with the camera: tap "Photograph it". The first time, the app explains that the photo is sent to
OpenAI to be read and asks for agreement before sending anything. There is a limit of 3 photos a day.

Generated content: recipes made from a photo are written by an AI model (OpenAI, through our own server).
Every recipe has "Report this recipe" at its foot; reports are read by a person. The six built-in recipes
and the sample are not generated at request time.

Native features: the system camera and photo library; a cooking timer that rings through a local
notification when the phone is locked; the screen kept awake while cooking; haptics; the system share
sheet for the shopping list; the shopping list works with no connection.

Contact: *(your name, phone and email for App Review go here; they are not published)*

## Before you can submit

Done on 22 November 2026: the project is signed with the "Victor Saly" team (`Z452L5C5VZ`), a development
build is installed on an iPhone 16, and a distribution-signed build exports with `npm run ios:ipa`
(to `ios/App/build/export/App.ipa`).

1. Try it on the iPhone. Check: the camera, the first-photo question, a timer ringing with the phone
   locked, the screen staying on while cooking, the list with flight mode on.
2. In App Store Connect, create the app: platform iOS, name "FeedMe AI", bundle ID
   `com.victorsaly.feedmeai`, SKU `feedmeai-ios`. This is where the seller becomes fixed: the team's name
   is what the store shows as the developer.
3. Upload the build: open `ios/App/build/FeedMeAI.xcarchive` in Xcode's Organizer and choose Distribute
   App, or drag `App.ipa` into the Transporter app.
4. Paste this file's fields, upload the five screenshots, fill the privacy answers, and add yourself as a
   TestFlight tester.
5. Cook from the TestFlight build for a week (step 9 of the plan), then submit for review.
