---
name: House of SV
description: Considered handbags in warm leathers, made to be carried every day and loved for years.
colors:
  cognac: "#9a4e1c"
  cognac-dark: "#7a3d15"
  saddle: "#6f4e37"
  tan: "#c9a27e"
  cream: "#faf6f0"
  ivory: "#f3ece2"
  sand: "#e7dccd"
  espresso: "#2e211a"
  muted: "#7d6b5d"
  success: "#4f6b3a"
  danger: "#a23b2a"
typography:
  display:
    fontFamily: "Cormorant Garamond, ui-serif, Georgia, serif"
    fontSize: "4.5rem"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Cormorant Garamond, ui-serif, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0.005em"
  title:
    fontFamily: "Cormorant Garamond, ui-serif, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "0.005em"
  body:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.01em"
  body-small:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.01em"
  label:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.22em"
  eyebrow:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.32em"
rounded:
  sm: "4px"
  lg: "8px"
  full: "9999px"
spacing:
  gutter-sm: "16px"
  gutter-md: "24px"
  gutter-lg: "32px"
  section: "80px"
  container: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.cognac}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.cognac-dark}"
    textColor: "{colors.cream}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.espresso}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
  button-secondary-hover:
    textColor: "{colors.cognac}"
  button-dark:
    backgroundColor: "{colors.espresso}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
  button-dark-hover:
    backgroundColor: "{colors.saddle}"
  input:
    backgroundColor: "#ffffffb3"
    textColor: "{colors.espresso}"
    typography: "{typography.body-small}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.saddle}"
    typography: "{typography.body-small}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  chip-active:
    backgroundColor: "{colors.espresso}"
    textColor: "{colors.cream}"
  card-product:
    backgroundColor: "{colors.ivory}"
    rounded: "{rounded.sm}"
  badge-status:
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.body-small}"
---

# Design System: House of SV

## Overview

**Creative North Star: "The Leather Atelier"**

House of SV feels like walking into a quiet leather workshop at the end of the afternoon. Warm hides, brass and cream paper. Nothing hurries you. The interface acts as the workbench, and the photography is the work laid on it. Surfaces stay calm and nearly flat, type is light and spaced out, and the warm leather palette carries the brand, not ornament.

Density is low and generous. Sections breathe with 80px of vertical space between them, and product photography gets tall portrait frames (4:5). Copy stays short. Large display headlines are set in a light Cormorant Garamond. Small Jost labels in spaced-out capitals guide navigation and actions. An italic cognac accent word, as in the "of" of the wordmark or the second line of the hero, is the system's one flourish.

Motion is unhurried and only reveals content: elements fade and rise gently into place, and images settle from a slight zoom. Visitors who prefer reduced motion see everything at once, with nothing hidden.

The atelier is never cold or techy, never a discount store, never rustic or western, and never glossy with heavy shadows.

**Key Characteristics:**
- Warm cream ground with leather-toned accents. No cool greys or blues anywhere.
- Light serif display type paired with small, widely spaced uppercase sans labels.
- Near-flat surfaces, separated by tone and thin sand borders rather than shadow.
- Pill-shaped actions next to softly squared imagery.
- Portrait (4:5) product photography as the main visual material.
- Slow, reveal-only motion that respects reduced-motion settings.

## Colors

A tanned-leather palette: cream paper, a single cognac accent, and deep espresso ink.

### Primary
- **Cognac Hide** (cognac): the one active voice. Primary buttons, links, the eyebrow above section titles, focus rings and italic accent words.
- **Burnished Cognac** (cognac-dark): the hover and pressed state of Cognac Hide only.

### Secondary
- **Saddle Brown** (saddle): quiet emphasis. Navigation links, form labels, prices, secondary headings, and the hover state of dark buttons.
- **Raw Tan** (tan): soft highlights. Text selection, the italic "of" on dark backgrounds, footer section headings, and tinted status pills.

### Neutral
- **Atelier Cream** (cream): the page background and the text on dark or cognac fills.
- **Vellum Ivory** (ivory): image placeholders, product frames and soft panels that sit one step above the page.
- **Sanded Linen** (sand): every border, divider and inactive chip outline.
- **Espresso Ink** (espresso): body text, headings, the footer background and active chips.
- **Worn Suede** (muted): captions, helper text, category labels on cards and placeholders.

### Status
- **Olive Leaf** (success) and **Oxblood Seal** (danger): used only in order status badges and destructive actions, usually as a 10% tint behind the full-strength text.

### Named Rules
**The Single Hide Rule.** Cognac is the only saturated accent. Never add a second accent hue. When something needs more emphasis, step through espresso, saddle and tan instead.

**The Warm Ground Rule.** Every neutral is warm. A pure white (#ffffff) or a cool grey never becomes a surface. The only white allowed is the translucent fill inside inputs (70% white over cream).

## Typography

**Display Font:** Cormorant Garamond (with ui-serif, Georgia)
**Body Font:** Jost (with ui-sans-serif, system-ui)

**Character:** A high-contrast, light-weight Garamond gives the voice of a handwritten label. A clean geometric sans, set small and widely spaced, does the practical work of navigation and pricing.

### Hierarchy
- **Display** (Cormorant 300, 3rem → 4.5rem across breakpoints, line-height 1.05): the single hero headline per page. The second line may be italic in cognac at weight 400.
- **Headline** (Cormorant 400, 2.25rem → 3rem, 1.12): section titles such as "Find your shape" and "Featured".
- **Title** (Cormorant 500, 1.25rem–1.875rem, 1.12): product names on cards and category names on image tiles.
- **Body** (Jost 400, 1rem / 0.875rem, 1.65, tracking 0.01em): descriptions and UI copy. Keep intro paragraphs to about 28rem (max-w-md).
- **Label** (Jost 500, 11px, tracking 0.22em, uppercase): buttons, navigation and form labels (form labels use 0.18em).
- **Eyebrow** (Jost 500, 11px, tracking 0.32em, uppercase, cognac): the small line that introduces every section headline.

### Named Rules
**The Eyebrow-Then-Serif Rule.** Every major section opens with a cognac eyebrow followed by a serif headline. Never stack two serif headings without that small sans line between them.

**The Whisper Caps Rule.** Uppercase text is always 10–11px, weight 500, with at least 0.18em tracking. Never set large or bold text in all caps.

## Layout

A single centered column with a maximum width of 72rem and side gutters of 16 / 24 / 32px at mobile / sm / lg. Sections are separated by 80px of vertical padding (py-20), and the hero uses 48px → 80px. Full-width bands use a tinted background (ivory at 60%) instead of borders to group content such as Featured.

The product grid has 2 columns on mobile and 3 at lg, with column gaps of 16 / 24 / 32px and 40px row gaps. The category tiles go from 1 to 2 to 4 columns. The hero is a two-column split from md upward, with the image first on mobile. The header is a 64px sticky bar on 90% cream with a backdrop blur. Desktop navigation appears at lg; below that, a menu button opens a full-width drop-down.

## Elevation & Depth

The system is flat. Depth comes from tone (cream → ivory → espresso), thin sand borders and photography, not from shadows. The only shadow is a barely visible `shadow-sm` under floating panels: the mobile menu drop-down and the market switcher popover. On image tiles, a soft espresso gradient (60% at the bottom, fading to clear) keeps cream text readable.

### Shadow Vocabulary
- **Popover whisper** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): only on overlays that float above the page.

### Named Rules
**The Flat Workbench Rule.** Cards and tiles never cast shadows at rest or on hover. Hover feedback is a color shift or a slow 3% image zoom, never lift.

## Shapes

There are two shapes. Imagery, panels, dropdowns and empty states use **barely softened corners** (4px). Every action and every small tag uses a **full pill** (9999px): buttons, filter chips, status badges and the "sold out" tag. Inputs sit between the two at 8px. Image frames clip their photos with overflow hidden, so zooms stay inside the frame. Empty states use a dashed sand border.

## Components

### Buttons
Refined and restrained: small spaced-out capitals inside a pill.
- **Shape:** full pill (9999px), 14px × 28px padding. The small variant is 10px × 20px with 10px text.
- **Primary:** cognac fill with cream text. Hover switches to cognac-dark with a color-only transition.
- **Secondary:** transparent with an espresso hairline border at 20%. Hover turns the border and text cognac.
- **Dark:** espresso fill with cream text. Hover switches to saddle.
- **Danger:** a danger hairline border at 30% with danger text. Hover fills with danger and turns the text cream.
- **Focus:** a 2px cognac outline offset by 2px. Disabled buttons drop to 50% opacity.

### Chips (category tabs)
- **Style:** pill outline in sand, saddle text at 14px, 8px × 16px padding. The row scrolls horizontally on small screens.
- **State:** the active chip fills with espresso and has cream text. Inactive chips turn their border and text cognac on hover.

### Cards / Containers
- **Product card:** a 4:5 photo with 4px corners on an ivory placeholder, then a muted uppercase category label, a serif product name that turns cognac on hover, and the price in saddle on the right. No border, no shadow and no background behind the text.
- **Category tile:** a 4:5 photo with an espresso gradient. The serif name and a "Shop now" line in cream sit at the bottom left, and the underline appears on hover. The image zooms to 103% over 700ms.
- **Status badge:** a pill with 4px × 12px padding in 12px medium text, colored by a 10–25% tint of the status color.

### Inputs / Fields
- **Style:** an 8px-radius field with a sand border, 70% white fill, 12px × 16px padding, 14px espresso text and muted placeholder text at 70%.
- **Focus:** the border turns cognac with a matching 1px ring. There is no glow.
- **Label:** saddle uppercase at 11px with 0.18em tracking, 6px above the field.

### Navigation
- **Header:** the wordmark is centered between the menu button and the actions. Links are saddle uppercase at 11px with 0.22em tracking and turn cognac on hover.
- **Footer:** an espresso band with cream text at reduced opacity. Section headings are in tan, and links turn full cream on hover.

### Wordmark (signature)
"House of SV" is set in Cormorant: a light "House" with 0.04em tracking, a smaller italic "of" in the accent color (cognac on light, tan on dark), and "SV" at medium weight with 0.06em tracking. It is always text, never an image.

## Do's and Don'ts

### Do:
- **Do** start every new color decision from the token set in `globals.css` (`@theme`). Change a token there instead of hard-coding a hex.
- **Do** open sections with the cognac eyebrow (11px, 0.32em) followed by a serif headline.
- **Do** frame product photography at 4:5 with 4px corners on an ivory placeholder.
- **Do** keep actions as pills built from the shared `button` styles in `src/components/ui/styles.ts`.
- **Do** keep motion reveal-only, with a power3.out ease and a 0.8–1.2s duration, and always skip it for prefers-reduced-motion.

### Don't:
- **Don't** introduce cool greys, blues, neon or a dark SaaS look. The atelier is never cold or techy.
- **Don't** add red sale banners, countdown timers, flashing badges or crowded promo strips. It is not a discount store.
- **Don't** use distressed textures, stitching graphics, branded-leather or cowboy motifs. It is not rustic or western.
- **Don't** give cards heavy drop shadows, gloss or hover lift. Popovers may use only `shadow-sm`.
- **Don't** add a second accent color alongside cognac.
- **Don't** set large or bold text in all caps.
