---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# The app: the main path (first screen, results, recipe, cooking)

Scope: `src/App.tsx` and the components it renders on the Fridge tab. Mode: Operate. Code-led.
Audience and job: someone at an open fridge deciding dinner, one hand free. Task: photo, pick a dinner,
see what is missing, cook.
Constraints: no AI call without a tap; works at 375 px; 44 pt targets; the fridge logo and Denim stay.
Built since: List, Recipes with Saved inside, three tabs, the wide-screen layout, Account. Still to do:
Sign in with Apple, Delete account and "Report this recipe" (they need backend work); Denim app icons.

## Direction contract

THESIS: The photo is the fridge door. What you photographed stays on screen, large, with what was read in it
stuck on as magnets and dinner directly beneath. It refuses the recipe-app default: a title over a white list
of text rows.

OWN-WORLD: Cold enamel ground, white panels, Denim `#3667c9` for the one action and every selected state, a
pale interior-light glow, and an amber shelf tag on anything you have to buy. Bricolage Grotesque, bold, for
headings, dish names and numbers; the phone's own sans for everything read or tapped. Pill magnets with a
small lift and a slight tilt.

STORY: A newcomer sees a real result before giving a photo. After a photo they see their own food and their
dinners in one view, open one, see what is missing first, add it all with one tap, and cook step by step.

FIRST VIEWPORT: Results, 390 x 844. The photo as a 16:9 band under the header, the count ("10 things in") in
display type over its lower left. Magnets in two rows overlapping the photo's bottom edge, ending in
"+5 · Edit". One segmented meal control. Then idea rows, each with a picture, at least two visible above the
tab bar. Primary action: the first idea row. Signature interaction: "Edit" unfolds the door into the full
editable set of magnets. Motion: magnets snap on once, 150 to 250 ms elsewhere.

FORM: seed: none (pinned). Pinned by the approved review page and Victor's words: "Cold Store look with Denim
blue", "ideas above the fold, missing ingredients first in the recipe, cooking screen with step ingredients
and wake lock", and "Type lacks character, More food on screen, Too plain".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
