---
name: TaskSystem
description: Self-hosted issue tracker dressed as an arcade cabinet; the printed instruction card by day, the phosphor screen by night.
colors:
  primary: "#1d46d1"
  primary-foreground: "#ffffff"
  card-ink: "#0f1020"
  card-paper: "#fcfcfd"
  card-white: "#ffffff"
  card-muted: "#eff0f4"
  card-muted-ink: "#4b5063"
  card-accent: "#e4ebff"
  card-accent-ink: "#0d2d8f"
  card-border: "#cdd0da"
  card-input: "#9da2b3"
  card-destructive: "#c81e3a"
  card-success: "#15803d"
  card-warning: "#b45309"
  screen-primary: "#2456e8"
  screen-primary-text: "#7da2ff"
  screen-ink: "#f2f1fa"
  screen-black: "#07060d"
  screen-panel: "#0e0c1f"
  screen-muted: "#17153a"
  screen-muted-ink: "#a6a3c9"
  screen-accent: "#1a1745"
  screen-accent-ink: "#7fe7f2"
  screen-border: "#2b2a63"
  screen-input: "#403e86"
  screen-ring: "#33d6e8"
  screen-destructive: "#e0283a"
  screen-success: "#36d15a"
  screen-warning: "#ffb020"
  status-new: "#6d4ed8"
  status-triage: "#4d7c0f"
  status-todo: "#0e7490"
  status-progress: "#1d46d1"
  status-waiting: "#c2410c"
  status-review: "#b3146f"
  status-done: "#a16207"
  status-canceled: "#be123c"
  screen-status-new: "#b39dff"
  screen-status-triage: "#b8f03a"
  screen-status-todo: "#33d6e8"
  screen-status-progress: "#7da2ff"
  screen-status-waiting: "#ff8a1f"
  screen-status-review: "#ff5ad2"
  screen-status-done: "#ffd23f"
  screen-status-canceled: "#ff4d5e"
typography:
  display:
    fontFamily: "Silkscreen, ui-monospace, monospace"
    fontSize: "clamp(2.5rem, 1rem + 4.2vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
  headline:
    fontFamily: "Silkscreen, ui-monospace, monospace"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0"
  title:
    fontFamily: "Pixelify Sans, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-row:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
  label:
    fontFamily: "Silkscreen, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.04em"
    fontFeature: "tnum"
  label-sm:
    fontFamily: "Silkscreen, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.25rem
    letterSpacing: "0.04em"
rounded:
  none: "0px"
  chamfer: "4px"
  chamfer-lg: "8px"
spacing:
  pixel: "2px"
  tile: "8px"
  grid: "16px"
  row-x: "16px"
  row-y: "12px"
  section: "80px"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.chamfer}"
    padding: "0 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.card-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.chamfer}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    textColor: "{colors.card-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.chamfer}"
    padding: "0 16px"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.card-destructive}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.chamfer}"
    height: "40px"
  status-chip:
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: "1px 6px 1px 4px"
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: "0 6px"
  input-search:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.card-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.chamfer}"
    height: "40px"
  nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.chamfer}"
    padding: "0 12px"
    height: "44px"
  panel:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.none}"
  meter:
    backgroundColor: "{colors.card-muted}"
    height: "10px"
---

# Design System: TaskSystem

## Overview

**Creative North Star: "The Arcade Cabinet"**

TaskSystem is a CRT pixel-art arcade cabinet. The light theme is the printed instruction card bolted to the cabinet: near-white stock, dark ink, crisp 2px rules. The dark theme is the phosphor screen: violet-black glass, luminous sprite colors, optional bloom and scanlines. Both themes share one geometry: square tiles on an 8px grid, chamfered corners cut on whole pixels, blocky pixel caps for everything the machine says, and plain system text for everything the user wrote.

The cabinet is a HUD, never a game that hides the work. Counts are readouts, progress is a segmented energy bar, statuses are sprites with their own color and glyph, and completion is the only thing that earns gold. Motion moves the way a sprite does: in discrete steps, never in smooth tweens.

The system is fully realized on the landing page and the dashboard. Other application pages (Projects, Issues, Board, Teams, auth, modals) inherit the tokens, Button, Badge, status chips and icons but have not been recomposed in the world.

**Key Characteristics:**
- Two themes as two materials of one machine: printed card (light) and phosphor screen (dark).
- Zero radius everywhere; corners are chamfered 4px or 8px via clip-path.
- Three type voices: Silkscreen caps for machine speech, Pixelify Sans for sprite names, system sans for user content.
- Eight statuses, each with exactly one sprite color and one pixelarticons glyph.
- Flat depth: 2px borders and tonal tiles, no ambient shadows.
- Whole-pixel stepped motion on transform and opacity only.

## Colors

A disciplined 16-color sprite palette on a near-neutral card or a violet-black screen, with one blue carrying action.

### Primary
- **Start Button Blue** (light #1d46d1 / dark fill #2456e8): primary buttons, active nav tile, active mode-select tile, the PixelMark body, focus ring on the card. On the dark screen, blue text shifts to Phosphor Periwinkle (#7da2ff) because the fill is too dim to read as text.

### Secondary
- **Phosphor Cyan** (dark ring #33d6e8; light cyan #0e7490): the focus ring and caret on the screen, the title accent and instruction icons in dark theme, the blinking insert-coin caret.

### Tertiary
- **Power Gold** (light #a16207 / dark #ffd23f): the Done status color and nothing else; completion flashes, cleared sprites, the PixelMark checkmark.
- **Game-Over Red** (light #be123c / dark #ff4d5e): overdue flash, hot priorities (High, Critical), the Canceled status.

### Neutral
- **Instruction Card Ink** (#0f1020): all body text and edges on the light card.
- **Card Stock** (#fcfcfd) and **Card White** (#ffffff): page ground and panel ground on the card.
- **Card Tint** (#eff0f4): muted fills, meter track, instruction-card section band.
- **Card Grey Ink** (#4b5063): secondary text, HUD labels.
- **Card Rule** (#cdd0da) and **Input Rule** (#9da2b3): 2px panel borders and control borders.
- **Screen Black** (#07060d), **Screen Panel** (#0e0c1f), **Screen Well** (#17153a): the dark ground, panels and muted fills.
- **Phosphor White** (#f2f1fa) and **Faded Phosphor** (#a6a3c9): dark body and secondary text.
- **Scanline Indigo** (#2b2a63) and **Bezel Indigo** (#403e86): dark borders and control rules.

### Status sprites
New violet (#6d4ed8 / #b39dff), Triage lime (#4d7c0f / #b8f03a), To Do cyan (#0e7490 / #33d6e8), In Progress blue (#1d46d1 / #7da2ff), Waiting orange (#c2410c / #ff8a1f), Code Review magenta (#b3146f / #ff5ad2), Done gold (#a16207 / #ffd23f), Canceled red (#be123c / #ff4d5e). Every pair holds at least 4.5:1 on its ground.

### Named Rules
**The One Sprite Rule.** Each status owns exactly one color and one pixelarticons glyph (New sparkle, Triage question circle, To Do list box, In Progress play, Waiting hourglass, Code Review eye, Done star, Canceled skull). The glyph always accompanies the color so state reads without color. Never reuse a status color for decoration.

**The Power Gold Rule.** Gold means completed. It appears only on Done, completion flashes, cleared sprites and the checkmark in the mark. Warnings use the warning token, not gold.

**The Tint-Not-Fill Rule.** Status and semantic chips sit at 12% color over the ground with a 55% color border and full-color text; solid status fills are not used.

## Typography

**Display Font:** Silkscreen (with ui-monospace, monospace)
**Sprite Font:** Pixelify Sans (with ui-monospace, monospace)
**Body Font:** system sans stack (ui-sans-serif, system-ui, -apple-system, Segoe UI)

**Character:** Silkscreen is the machine's 8x8 bitmap voice for headings, HUD labels, numbers and controls; Pixelify Sans names things (brand wordmark, move names, mode titles, project level cards); readable system sans carries sentences and user-entered titles. All three are self-hosted.

### Hierarchy
- **Display** (Silkscreen 700, clamp(2.5rem, 1rem + 4.2vw, 4.75rem), line-height 1, caps): landing hero and closing call; may take phosphor bloom in dark theme.
- **Headline** (Silkscreen 700, 1.875rem to 2.25rem, caps): section headings on landing and dashboard.
- **Title** (Pixelify Sans 700, 1rem to 1.5rem, line-height 1): wordmark, move names, mode titles, project level cards, empty-state titles.
- **Body** (system sans 400, 1rem to 1.125rem, line-height 1.625, max about 34rem): explanatory copy in muted ink.
- **Row text** (system sans 500, 0.9375rem): issue titles in lists; user content keeps its own case.
- **Label** (Silkscreen 400, 0.75rem, letter-spacing 0.04em, uppercase, tabular numerals): buttons, nav, links in the HUD.
- **Small label** (Silkscreen, 0.625rem to 0.6875rem, uppercase): chips, badges, HUD readout labels, metadata.

### Named Rules
**The Machine Speaks In Caps Rule.** Silkscreen uppercase is for what the cabinet says (labels, counts, controls, headings on redesigned surfaces). Anything the user typed stays in system sans, in its own case.

**The Scoped Heading Rule.** h1 to h3 become Silkscreen caps only inside the landing and dashboard scopes; other pages keep their headings in their original face until they are recomposed.

## Layout

Everything sits on an 8px tile grid; a faint 16px tile pattern may show the playfield grid. Containers cap at 1280px with 16px gutters (24px from sm). Landing sections use 80px vertical padding (112px at lg) separated by 2px rules, with asymmetric two-column grids (5/7, 4/8, 3/9) at lg. The dashboard leads with a HUD readout strip (cells separated by 2px gaps showing the border color), then an 8/12 quest log beside a 4/12 stage column. List rows use 16px by 12px padding with 2px dividers. Controls are 40px tall (36px small, 48 to 52px large); nav tiles 44px.

## Elevation & Depth

Flat. Depth comes from 2px borders, tonal tiles (card on stock, well on screen) and color-mix tints, not shadows. The only glow is the phosphor bloom on display text in dark theme (`text-shadow: 0 0 1px currentColor, 0 0 12px color-mix(currentColor 45%)`), a property of the screen that never appears on the printed card. CRT scanlines are an optional overlay layer (22% black lines every 3px on the screen, 5% on the card), off by default in the dashboard.

### Named Rules
**The Printed Card Rule.** Light theme has no glow and no bloom; it is ink on stock.

**The Inset Focus Rule.** Focus on clipped tiles is an inset 2px ring in the ring color, because clip-path would cut an outside outline; unclipped links use a 2px outline offset 2px.

## Shapes

Radius is 0 at every scale. Corners are chamfered by an eight-point clip-path polygon cutting 4px (buttons, inputs, nav tiles, theme toggle thumb) or 8px (large tiles). Panels are square with a 2px border. Sprites and the mark render with crisp edges on the pixel grid. Progress is a segmented meter: 6px blocks with 2px gaps, 10px tall.

## Components

### Buttons
Chamfered cabinet keys that step, not fade.
- **Shape:** 4px chamfer, 2px border, square otherwise.
- **Primary:** Start Button Blue fill and border, white Silkscreen label, 40px tall with 16px sides; hover swaps the border to ink.
- **Outline / Ghost / Secondary:** card ground with input-rule border (hover to primary), or transparent (hover to input rule plus muted fill).
- **Motion:** color changes over 100ms in steps(2); pressed state drops exactly 1px (disabled under reduced motion); focus is an instant inset ring.

### Chips
- **Status chip:** status glyph at 12px plus Silkscreen label at 0.6875rem, 12% tint, 55% border, full status ink.
- **Badges:** same HUD readout form, no hover state; semantic variants (destructive, success) use red or green tints under the same tint law.
- **Priority mark:** glyph plus label, red for High and Critical, muted otherwise; Normal carries no glyph.

### Cards / Containers
- **Corner Style:** square (0px) or chamfered.
- **Background:** card white or screen panel over the page ground.
- **Shadow Strategy:** none; see Elevation.
- **Border:** 2px rule; status-tinted tiles mix the status color into the border (35 to 55%) and take the full color when current.
- **Internal Padding:** 16px to 20px.

### Inputs / Fields
- **Style:** 40px tall, 4px chamfer, 2px input-rule border, card ground, system sans 14px, 16px search glyph inset at 12px.
- **Focus:** border switches to the ring color.
- **Disabled:** 50% opacity.

### Navigation
- **Sidebar:** 44px chamfered tiles with Silkscreen labels and 20px pixel glyphs; active tile is a solid primary fill; inactive is muted ink with a border appearing on hover. Collapse animates in steps(5).
- **Mode select:** a cabinet menu; the active option fills primary and reveals a pixel cursor; arrow keys move between options.

### Segmented Meter
The cabinet energy bar: 10px blocks masked into 6px segments, muted track, fill scales on X in 320ms steps(4). Stage meters take the status color.

### Status Flash
A new Done item flashes its row with 55% gold once over 480ms in steps(6); overdue rows flash red at 20% once on appearance. Never looping.

## Do's and Don'ts

### Do:
- **Do** pair every status color with its pixelarticons glyph at crisp edges.
- **Do** keep radius at 0px and cut corners with the 4px or 8px chamfer.
- **Do** animate only transform and opacity (and stepped color on controls) using steps() timing, and neutralize animation under prefers-reduced-motion.
- **Do** set counts, labels and controls in Silkscreen caps with tabular numerals, and user content in system sans.
- **Do** use inset 2px ring focus on clipped elements.
- **Do** keep bloom and scanlines as dark-screen capabilities; scanlines stay optional.

### Don't:
- **Don't** use gold for anything other than completion.
- **Don't** give a status a second color or a second glyph, or use a status color as decoration.
- **Don't** add soft ambient drop shadows, gradients or glassy blur; depth is 2px rules and tonal tiles.
- **Don't** use smooth eased tweens for sprite, tile or meter motion, or animate width and layout properties.
- **Don't** set user-entered titles or sentences in the pixel faces.
- **Don't** loop alert flashes; each flash plays once.
