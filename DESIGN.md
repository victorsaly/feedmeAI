---
name: FeedMe AI
description: Cold Store. The photo of your fridge is the door, what was read in it is stuck on as magnets, and dinner sits under it.
colors:
  blue: "#3667c9"
  blue-deep: "#2b55ab"
  blue-tint: "#e8eefa"
  blue-ink: "#ffffff"
  tag: "#ffe7a3"
  tag-pale: "#fff6dc"
  tag-line: "#f0dc9c"
  tag-ink: "#5c3b00"
  amber: "#8a4d00"
  light: "#d9efff"
  light-2: "#a6d8fb"
  cold: "#f2f6f9"
  white: "#ffffff"
  ink: "#0f1620"
  ink-2: "#4b5665"
  ink-3: "#5f6a78"
  hairline: "#e3e9ef"
typography:
  display:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.3rem, 10vw, 2.9rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  step:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 7.8vw, 2.35rem)"
    fontWeight: 650
    lineHeight: 1.16
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  figure:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  title:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    letterSpacing: "-0.015em"
  dish:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.012em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Roboto, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Roboto, Segoe UI, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Roboto, Segoe UI, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    fontFeature: "tnum"
rounded:
  tag: "6px"
  control: "12px"
  btn: "14px"
  list: "16px"
  bar: "18px"
  door: "22px"
  sheet: "24px"
  pill: "999px"
spacing:
  chip-gap: "0.5rem"
  row: "0.75rem"
  gutter: "1rem"
  section: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.blue-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.btn}"
    padding: "0.6rem 1rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.blue-deep}"
  button-primary-xl:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.blue-ink}"
    rounded: "{rounded.btn}"
    height: "54px"
    width: "100%"
  button-quiet:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.btn}"
    padding: "0.6rem 1rem"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.btn}"
    padding: "0.5rem 0.6rem"
    height: "44px"
  button-small:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.btn}"
    padding: "0.4rem 0.75rem"
    height: "36px"
  magnet:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 0.85rem"
    height: "36px"
  magnet-editable:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 0 0 0.9rem"
    height: "44px"
  segmented:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-2}"
    rounded: "15px"
    padding: "3px"
  segmented-item-active:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.blue-ink}"
    rounded: "{rounded.control}"
    height: "44px"
  shelf-tag:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.tag-ink}"
    rounded: "{rounded.tag}"
    padding: "0.12rem 0.5rem"
  buy-panel:
    backgroundColor: "{colors.tag-pale}"
    textColor: "{colors.ink}"
    rounded: "{rounded.list}"
    padding: "0.15rem 0.75rem 0.75rem 1rem"
  list-panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.list}"
  food-thumb:
    backgroundColor: "{colors.light}"
    rounded: "{rounded.btn}"
    size: "64px"
  search:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.btn}"
    padding: "0 0.9rem"
    height: "48px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.control}"
    height: "50px"
  tab-active:
    textColor: "{colors.blue}"
  tab-active-wide:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.blue-deep}"
    rounded: "{rounded.control}"
    height: "40px"
  update-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.bar}"
    padding: "0.45rem 0.45rem 0.45rem 1.1rem"
---

# Design System: FeedMe AI

## Overview

**Creative North Star: "Cold Store: the fridge is the interface"**

The app looks like the inside and the outside of a fridge. The ground is cold enamel, slightly blue. Panels are plain white. One pale glow, the interior light, sits behind the place where a photo goes in. The photo the person took is the door: it stays on screen, large, and what was read in it is stuck on as white pill magnets that sit a touch off true, as if placed by hand. Dinner is directly under it, and every dinner row carries a picture of food.

Two colours carry meaning and nothing else does. Denim is the one action and every selected state. The amber shelf tag marks what the person does not have yet: the ingredient a dinner needs, the things to buy in a recipe. Type has two voices: Bricolage Grotesque speaks for headings, dish names, prices and the cooking step; the phone's own face does everything that is read at length or tapped, so the app feels installed.

It is built for one hand at an open fridge and for a supermarket aisle. Targets are 44px or more, the primary action is full width where it matters, the bars are translucent and content scrolls under them. The phone is the default; wider screens widen the same page, they do not get a different one.

**Key Characteristics:**
- Cold enamel ground, white panels, no borders around panels.
- One blue for action and selection; one amber for what is missing.
- Food on screen in every view: the photo as the door, a thumb on every row, picture tiles for recipes.
- Pill magnets with a small lift and a slight tilt.
- Display type for what the screen is saying; system type for what you read and tap.
- Light theme only.

## Colors

A cold, near-white kitchen palette with one saturated blue and one warm amber; everything else is blue-grey ink on enamel.

### Primary
- **Denim** (`blue`): the one action and every selected state. Primary buttons, the active tab, the active segment, a ticked checkbox, count badges, the magnet dot, step numbers in a method, the focus ring, the text caret. White text on it (`blue-ink`).
- **Denim Deep** (`blue-deep`): hover on a primary button, and Denim text when it sits on a tinted or amber ground (the "All shops" toggle, the active tab on wide screens, "Add both to the list", credit links).
- **Denim Tint** (`blue-tint`): the ground of the cheapest-shop card, the active tab on wide screens, an amount that has not been set.

### Secondary
- **Shelf Tag** (`tag`): the filled amber tag. "needs lime or lemon juice" on a dinner row, the ring on a magnet the reading was unsure of, the timer when it has rung.
- **Shelf Tag Pale** (`tag-pale`) with **Shelf Tag Line** (`tag-line`): the to-buy panel in a recipe, a pale amber ground with a 1px inset line and amber dividers.
- **Shelf Tag Ink** (`tag-ink`): text on the filled tag.
- **Amber** (`amber`): amber as text on white, for "not sure" beside a magnet.

### Tertiary
- **Interior Light** (`light`): the glow at the top of the photo card on the first screen, and the placeholder ground behind every food image before it loads.
- **Interior Light Edge** (`light-2`): the outline while a photo is dragged over the card, and the text selection colour.

### Neutral
- **Enamel** (`cold`): the page ground, the sheet ground, and the translucent bars (72 to 82% of it over an 18px blur).
- **Panel White** (`white`): grouped lists, magnets, quiet buttons, the search field.
- **Ink** (`ink`): primary text and icons; also the ground of the dark update bar.
- **Ink 2** (`ink-2`): secondary text, blurbs, unselected segments.
- **Ink 3** (`ink-3`): meta lines, placeholders, inactive tabs, quiet icons. The lightest text colour allowed.
- **Hairline** (`hairline`): dividers between rows inside a panel, and the dashed or solid outline of an add field.

### Named Rules
**The One Blue Rule.** Denim means "this is the action" or "this is selected". It is never decoration, never a heading colour, never a second accent beside itself.

**The Shelf Tag Rule.** Amber means something the person does not have or has to deal with: an ingredient to buy, a reading the app is unsure of, a timer that has rung. A thing the person already has is never amber.

**The Deep On Tint Rule.** Denim text on anything but white or enamel uses Denim Deep. Denim on Denim Tint is 4.6 to 1 and Denim Deep is 6 to 1; small text gets the deeper one.

## Typography

**Display Font:** Bricolage Grotesque, variable 200 to 800, self-hosted latin subset (falls back to the system sans)
**Body Font:** the phone's own face: -apple-system / SF Pro, Roboto, Segoe UI

**Character:** Bricolage is a grotesque with a visible hand, used tight and bold, so a heading or a dish name reads as a voice. The system face under it is deliberately the device's own, so lists, buttons and fields feel native.

### Hierarchy
- **Display** (700, clamp(2.3rem, 10vw, 2.9rem), line-height 1, -0.025em): the first-screen heading. Tab headings and the count over the photo ("10 things in") run one step smaller: clamp(1.9rem, 8vw, 2.4rem) and clamp(2rem, 9vw, 2.5rem).
- **Step** (650, clamp(1.8rem, 7.8vw, 2.35rem), line-height 1.16): the one instruction on the cooking screen. Shorter steps scale up: clamp(2.05rem, 9vw, 2.6rem), and clamp(2.5rem, 11vw, 3.2rem) for the shortest.
- **Headline** (700, 1.6rem, line-height 1.1): the recipe name at the top of the sheet.
- **Figure** (700, 1.45rem, tabular numerals): the cheapest shop and its total. The same voice at 1.9rem for the timer and 1.05rem for a line price.
- **Title** (700, 1.15rem, -0.015em, sentence case, Ink): section headings such as "Tonight", "To buy · 2", "Method". A quiet note may sit at the far end of the same line in the system face (0.78rem, Ink 3).
- **Dish** (600, 1.1rem, line-height 1.18): a dish name in a row. 1rem under a picture tile, 1.3rem at 700 on the sample card.
- **Body** (400, 1rem, line-height 1.45, Ink 2 for supporting text): descriptions and method steps. Lead paragraphs are capped at 34ch. Blurbs in rows are 0.9rem and clamp to two lines.
- **Label** (600, 0.95rem): buttons. Magnets are 0.9 to 0.95rem at 600; segments 0.86rem; tab labels 0.68rem.
- **Meta** (500, 0.8rem, Ink 3, tabular numerals): "15 min", "uses 3 of yours".

### Named Rules
**The Two Voices Rule.** Bricolage is for what the screen says: headings, dish names, money, time, the step. The system face is for what is read at length or tapped: body, buttons, magnets, fields, tabs, meta. A button label is never Bricolage and a section heading is never the system face.

**The Headings Speak Rule.** Section headings are display type in sentence case and full Ink. The build replaced small grey uppercase tracked headers with these; do not bring them back.

**The Sixteen Pixel Rule.** Any field the person types into is at least 16px, so iOS does not zoom the page.

## Layout

One centred column. On a phone the page is full width with a 1rem gutter that respects the safe areas, a 48px translucent top bar that content scrolls under, and a fixed three-tab bar at the bottom (Fridge, List, Recipes). The page column is capped at 38rem.

Rhythm is tight and list-like: 0.5rem between magnets and chips, about 0.75rem inside rows, 1.5rem above a section heading, 0.5rem between a heading and its panel. Related rows are grouped into one white panel with hairline dividers rather than spaced apart as separate cards.

The results view is the reference layout: the photo as a 16:9 band (never taller than 34dvh), the count in display type over its lower left on a dark fade, magnets in two rows overlapping the photo's bottom edge by about 1.15rem, one segmented meal control, then dinner rows with at least two visible above the tab bar.

Horizontal strips (category chips, recipe tiles) bleed to the screen edges and scroll with proximity snapping. Recipe pictures sit in a grid of 2 columns, 3 from 768px, 4 from 960px, at 4:3.

- **From 768px:** the tab bar becomes a centred 38rem bar with rounded top corners; the recipe opens as a centred dialog (38rem, 24px radius) instead of a bottom drawer.
- **From 960px:** the page widens to 68rem; the tabs move into the 56px header as pills; the first screen and the results become two columns (the photo and its magnets stay put in a 24rem side column while dinners scroll); the recipe opens as a 31rem panel on the right edge, beside the page, not over it.

The bottom drawer is at most 92dvh, with its action bar pinned and translucent at the bottom.

## Elevation & Depth

Depth is physical and small: a magnet lifts a little off steel, a panel barely lifts off enamel, a sheet lifts a lot. There are no borders around panels; white on enamel plus a soft shadow does the work. Bars are not raised, they are translucent: enamel at 72 to 82% over `blur(18px) saturate(160%)`, falling back to solid enamel when reduced transparency is asked for.

### Shadow Vocabulary
- **Magnet** (`box-shadow: 0 1px 1.5px rgba(15, 22, 32, .10), 0 4px 10px -4px rgba(15, 22, 32, .16)`): anything you could pick up. Magnets, chips, quiet and small buttons, the segmented control's shell, round add buttons, picture tiles.
- **List** (`box-shadow: 0 1px 2px rgba(15, 22, 32, .04), 0 10px 28px -18px rgba(15, 22, 32, .18)`): panels. Grouped lists, the photo card, the photo band, the search field, the timer.
- **Sheet** (`box-shadow: 0 -10px 40px -10px rgba(15, 22, 32, .28)`): the recipe drawer only.

### Named Rules
**The Three Lifts Rule.** Magnet, list, sheet. A new surface takes one of the three by what it is, not by how important it feels. The primary button has no shadow at all; its colour is its weight.

**The Press Rule.** Things that can be pressed shrink to 0.97 for 120ms on an ease-out curve (`cubic-bezier(.23, 1, .32, 1)`); rows change ground instead of shrinking. Under reduced motion nothing shrinks.

## Shapes

Everything is rounded and nothing is sharp, in a small set of steps that grow with the size of the thing: 6px for the shelf tag, 12px for a segment or a tab, 14px for buttons and food thumbs, 16px for list panels and picture tiles, 18px for floating bars (timer, update bar), 22px for the big photo surfaces (the photo card, the photo band, the sample card, the cooking photo), 24px for the sheet. Pills (999px) are reserved for magnets, chips, badges and add fields: the things stuck on the door.

Dividers are 1px hairlines inside a panel, never around it. Selection is drawn as a filled Denim shape or a 1.5px inset Denim ring, not a border colour change. The only dashed line is the empty "add one" magnet on the door.

Magnets are placed by hand: in the folded row on the door and on the sample photo each one is rotated a little (-1.4deg, 1deg, -0.4deg in turn). Magnets being edited, and magnets on the cooking screen, sit straight. Under reduced motion none are rotated.

The logo is a Denim fridge: a 22 by 29 rounded rectangle (radius 6 in a 32 box), a white line between freezer and fridge, two white handles, and a faint top sheen. It is one weight and reads at 16px.

Icons are Phosphor, regular weight, 14 to 24px, in the current text colour; the active tab's icon switches to the fill weight.

## Components

### Buttons
Plain and confident: flat colour, system label, one radius.
- **Shape:** softly rounded (14px), 44px tall at least, label 0.95rem at 600 with an optional 18px icon before it.
- **Primary:** Denim with white text, no shadow. The extra-large size is full width and 54px, used for "Take a photo" and the cooking bar.
- **Quiet:** white with the magnet shadow and Ink text. The second choice beside a primary ("Save", "Choose a photo", "Share").
- **Ghost:** no ground, Ink text; for the header ("New photo", account) and the third way in on the first screen, where it is Denim text.
- **Small:** 36px, white with the magnet shadow, for an action inside a heading line or a card ("Open").
- **Hover / Focus / Press:** primary goes to Denim Deep on hover, quiet to a faint cool white, ghost to a 6% ink wash. Focus is a 2px Denim outline offset 2px, everywhere. Press shrinks to 0.97. Disabled is 50% opacity. A saved state turns the quiet button's text Denim.

### Magnets
The signature. A white pill with the magnet shadow and a 600 system label, capitalised.
- **Folded on the door:** 36px tall, tilted by hand, in two rows overlapping the photo's bottom edge, ending in a Denim-text magnet that opens the rest ("5 more, edit", 44px target).
- **Being edited:** 44px tall, straight, on the enamel ground with no panel behind. Each carries its name, a small amount pill (enamel ground, Ink 3 text; Denim on Denim Tint when no amount is set) and a 44px remove button. One the reading was unsure of gets a 1.5px inset shelf-tag ring and "not sure" in Amber.
- **Add one:** a dashed hairline pill with a 16px input and a Denim plus.
- **On the cooking screen:** 40px, 1rem label, straight: what this step needs.
- **Motion:** magnets snap on once (scale .94 and 6px up to rest, 320ms, staggered 40ms). They fade instead under reduced motion.

### Chips and the segmented control
- **Segmented control:** one white shell (15px radius, 3px inset, magnet shadow) holding equal segments. Segments are 44px, 0.86rem at 600, Ink 2; the active one is a filled Denim block (12px radius) with white text. Used for the meal and for two-way switches.
- **Category chips:** white pills, 38px, 0.85rem at 600, magnet shadow, in an edge-to-edge scrolling strip. Active is Denim text with a 1.5px inset Denim ring.
- **Count badge:** a Denim pill with white tabular numerals (0.66 to 0.72rem, 700), on the List tab and in headers.

### Cards / Containers
- **List panel:** white, 16px radius, list shadow, no border, rows divided by hairlines. Rows are full-width buttons that change ground when pressed.
- **Dinner row:** a 64px food thumb (14px radius) on the left, then dish name (Dish), a two-line blurb, a meta line, and the shelf tag naming what it needs; a caret on the right that nudges 2px on hover. When the dish needs nothing, "nothing extra" in Denim takes the tag's place.
- **Photo band (the door):** the person's photo at 16:9, 22px radius, list shadow, a dark fade over its lower two thirds and the count in white display type. 4:3 in the side column on wide screens.
- **Sample card:** a 22px card with the photo on top at 16:8, small tilted magnets pinned along the photo's bottom edge, then a display title, a two-line summary and a caret.
- **Picture tile:** a 4:3 image (16px radius, magnet shadow) over a dish name and a meta line. 9.75rem wide in a strip, fluid in the grid.
- **To-buy panel:** Shelf Tag Pale with a 1px inset Shelf Tag Line. Each missing ingredient is a 48px row at 600 with a round white 44px add button; one quiet full-width button adds them all. It comes before "You have", whose rows are Ink 2 with a Denim tick.
- **Cheapest-shop card:** Denim Tint with a 1px inset line; a small note, then the shop name and the total in Figure type, a small "Open" button, and a footer row that expands the other shops.
- **Checklist row:** at least 60px. A 28px rounded-square checkbox (9px radius, 2px outline; filled Denim with a white tick when done), the item at 1.08rem and 600, its source in 0.76rem Ink 3, the price in display type, a remove button. Done items are struck through in Ink 3.
- **Timer:** a white 18px bar with the time in display type at 1.9rem and a quiet button; the whole bar turns Shelf Tag when it rings.
- **Update bar:** the one dark surface. Ink ground, white 600 text, 18px radius, sticky above the tab bar, holding one button. It appears when the dinners no longer match the list of ingredients.
- **Photo card (first screen):** white, 22px radius, the interior light glowing behind the top; holds the two photo buttons and the sample link. The light comes on once (400ms) and breathes only while a photo is being read; a line of light sweeps the photo thumbnail during that read.

### Inputs / Fields
- **Search:** white, 14px radius, 48px tall, list shadow, a leading 18px icon in Ink 3, a round enamel clear button. Focus draws a 2px inset Denim ring and turns the icon Denim.
- **Add field:** a pill with a hairline outline (dashed on the door, solid and white on the List tab), a 16px input, a 44px Denim plus that fades to 30% when empty.
- **Select:** 44px, white, 1.5px hairline outline, 12px radius, 16px text.
- **Selection and caret:** selected text is Interior Light Edge; the caret and native controls are Denim.

### Navigation
- **Top bar:** sticky, 48px plus the top safe area, translucent enamel. The fridge logo and the wordmark in Bricolage at 1.12rem and 700, with "AI" as a small Denim suffix in the system face; the account button at the right. In a flow the centre holds a ghost back action or a 1rem 600 title.
- **Tab bar:** fixed to the bottom, translucent enamel with a faint top line, three equal tabs at 50px or more: a 24px icon over a 0.68rem label. Inactive is Ink 3; active is Denim with the filled icon. A Denim count badge sits on the List icon.
- **Wide screens (960px and up):** the tabs sit in the header as pills, icon beside label at 0.92rem; active is Denim Tint with Denim Deep text.

### The recipe sheet
A bottom drawer on enamel with 24px top corners and the sheet shadow; its content fades in under the top edge as it scrolls. Order is fixed: recipe name, blurb, a meta line with icons, to buy, you have, method (numbered, Denim tabular numerals, hairlines between steps). A translucent action bar is pinned at the bottom: a quiet "Save" and a primary "Cook step by step" at 50px.

### The cooking screen
One step at a time. A food photo at the top (22px radius, 22dvh), a row of 4px progress segments (Denim now, Denim at 45% done, hairline to come) with the count in display type, the step in Step type, then what this step needs as magnets, then the timer. A translucent bar at the bottom holds a square quiet "back" and a full-width primary "next", both 54px.

### Loading
Skeleton bars shimmer across pale cool grey in the shape of the row they stand in for. Nothing spins.

## Do's and Don'ts

### Do:
- **Do** keep Denim for the one action and for selected states, and use Denim Deep when Denim text sits on Denim Tint or amber.
- **Do** put food in the view: the person's photo as the door, a 64px thumb on every dinner row, 4:3 pictures for recipes. Give every image the Interior Light ground while it loads.
- **Do** name what is missing with the shelf tag, and put what to buy before what the person already has.
- **Do** set headings, dish names, prices, times and the cooking step in Bricolage Grotesque at 600 to 700 with tight tracking; set everything read or tapped in the system face.
- **Do** group related rows in one white 16px panel with hairline dividers and the list shadow.
- **Do** keep every target at 44px or more and every typed field at 16px or more.
- **Do** keep motion short and single: 120ms press, 150 to 200ms state changes, magnets and rows snapping on once in about 320 to 360ms. Loops are for reading a photo and for skeletons only, and all of it has a reduced-motion form.
- **Do** honour the safe areas on every fixed or sticky bar.

### Don't:
- **Don't** use amber for anything the person already has, or as decoration.
- **Don't** add a second accent colour, a Denim heading, or a gradient fill. The only gradients are the interior light, the fade under the count on the photo, and the skeleton shimmer.
- **Don't** put a border around a panel, or draw selection by recolouring a border.
- **Don't** bring back small grey uppercase tracked section headers.
- **Don't** set buttons, magnets, tabs or body text in Bricolage.
- **Don't** tilt magnets that are being edited, and don't tilt anything that is not a magnet.
- **Don't** invent a fourth shadow, or put a shadow on the primary button.
- **Don't** show a list of dinners as text-only rows under a title.
- **Don't** take the old cobalt from the PNG app icons or the share image; they predate Denim and are not part of this system.
- **Don't** take tokens from the Tailwind and shadcn theme files (`src/styles/theme.css`, `src/index.css`). They are leftovers that only reach the dialog and drawer shells, the toast and the error fallback. The system is `src/styles/flow.css`.
