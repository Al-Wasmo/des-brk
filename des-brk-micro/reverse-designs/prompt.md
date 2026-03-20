# LLM UI Design Reverse-Engineering Playbook

## Purpose

This document is a standalone operating guide for an LLM or coding agent that needs to reverse-engineer the design language of a website or app from screenshots. It is written to help the agent infer the **system behind the visuals** and produce a build-ready design guide, not just a pile of guessed colors.

The agent should use this document when it needs to:

- analyze one or more screenshots of a product UI
- infer the design system and visual rules
- produce tokens, component guidance, and implementation constraints
- hand off a design description to another coding agent or frontend builder

---

## Core Objective

Given one or more screenshots, reconstruct the interface’s:

- product feel
- layout logic
- color roles
- typography hierarchy
- spacing rhythm
- shape language
- interaction emphasis
- reusable component patterns

The output should help another builder recreate the **same feel and system**, even when exact pixels are unknown.

---

## Main Principle

Do **not** start with exact colors. Do **not** start with CSS guesses. Do **not** start by naming frameworks.

Start by asking: **What system produced this interface?**

A screenshot is evidence of:

- product intent
- hierarchy
- layout rules
- interaction priorities
- visual restraint or expression

Your job is to infer those rules carefully.

---

# Part I — Working Method

## Step 1. Classify the product before analyzing visuals

First, determine what kind of product the screenshot likely represents.

Ask:

- Is this an admin dashboard, editor, e-commerce site, data tool, onboarding flow, CMS, consumer app, developer tool, or internal operations panel?
- Is the UI work-oriented or marketing-oriented?
- Is the interface for scanning, editing, browsing, approving, creating, or monitoring?

Write a short product classification such as:

- enterprise admin dashboard
- media management workspace
- B2B analytics panel
- consumer marketplace
- content editor

Why this matters: The same colors and spacing can mean different things depending on product category. Product type shapes density, hierarchy, control sizing, and tone.

---

## Step 2. Describe the emotional and operational feel

Before extracting tokens, define the design personality.

Ask:

- Does this feel calm, premium, playful, technical, strict, editorial, operational, creative, or transactional?
- Is it trying to disappear behind the content or express strong brand presence?
- Does it feel trustworthy, efficient, luxurious, or friendly?

Write 3–6 adjectives. Examples:

- calm, practical, restrained, operational
- premium, editorial, spacious, refined
- technical, compact, efficient, developer-centric

This step prevents shallow visual copying.

---

## Step 3. Map the layout into major structural zones

Ignore small controls at first. Break the screenshot into large zones.

Typical zones:

- outer frame or browser background
- global app shell
- top header
- primary sidebar
- secondary sidebar
- main workspace
- toolbar
- modal or overlay
- footer or status strip

Document the layout in order from outside to inside. Example:

1. muted outer background
2. dark navigation rail
3. white secondary panel
4. bright main workspace
5. centered modal overlay

Why this matters: Large layout structure defines the product more strongly than individual components.

---

## Step 4. Separate shell from page-specific content

Distinguish the persistent system from the current screen content.

Shell includes things like:

- navigation areas
- top headers
- side panels
- global actions
- reusable chrome

Page-specific content includes things like:

- filenames
- table rows
- chart values
- images or media
- temporary selection state on one page

Write two lists:

- persistent shell patterns
- current-view content details to ignore

This prevents overfitting to one screen.

---

## Step 5. Compare multiple screenshots for repeated signals

If multiple screenshots are available, use them to confirm what belongs to the design system.

Look for repetition in:

- navigation treatment
- button styling
- border behavior
- spacing patterns
- header density
- modal behavior
- table/list/card structure
- accent usage

Document:

- repeated design signals
- one-off content differences

Repeated patterns are more reliable than anything visible in only one image.

---

## Step 6. Inventory the component families

Turn the screenshot into a component system.

Common component families:

- shell
- rail navigation
- tree navigation
- page header
- toolbar
- breadcrumb
- search input
- filters
- button system
- icon button
- card/grid item
- table/list row
- modal
- tabs
- form controls
- empty state

For each component, note:

- how prominent it is
- whether it carries a strong style signal
- whether it feels generic or brand-defining

This is the moment where the analysis becomes reusable.

---

## Step 7. Extract color by function, not by raw pixel obsession

Do not dump a giant palette at the start. Identify color roles first.

Typical roles:

- app background
- primary surface
- secondary surface
- muted surface
- border
- primary text
- secondary text
- disabled or muted text
- navigation dark tone
- accent/action color
- selected state color
- overlay color
- success/warning/error if visible

Ask:

- Which colors define structure?
- Which colors define action?
- Which colors are just content inside the UI?
- Is color sparse or expressive?

Only after that, estimate approximate values.

Important: When exact values are uncertain, use ranges or approximation language. The goal is **matching feel**, not forensic reconstruction.

---

## Step 8. Separate UI palette from content/media palette

Many screenshots include colorful images, charts, or thumbnails. These often do **not** belong to the product’s core design system.

Ask:

- Are the bright colors part of the UI shell or just the media shown inside it?
- Would the product still feel mostly neutral if the content were removed?

State this clearly.

This is one of the most common mistakes agents make. They accidentally extract image colors as if they were interface brand colors.

---

## Step 9. Infer typography hierarchy

Study text scale, weight, density, and contrast.

Look for:

- page title size
- section titles
- control labels
- metadata text
- helper text
- breadcrumb size
- table header weight
- button label emphasis

Ask:

- Is this compact UI typography or spacious editorial typography?
- Does hierarchy come mostly from size, color, weight, or spacing?
- Does the font feel neutral, platform-native, geometric, or humanist?

Document:

- likely typography mood
- inferred size ranges
- recommended weight usage
- likely line-height behavior

Do not invent a complex type ramp unless the visuals support it.

---

## Step 10. Infer spacing rhythm and density

Spacing often determines whether the rebuild feels right.

Look at:

- distances between controls
- card gaps
- toolbar padding
- row height
- sidebar indentation
- whitespace around modals

Ask:

- Does this feel based on a 4px rhythm, 8px rhythm, or something looser?
- Is the interface dense, medium-density, or roomy?
- Are controls compact or oversized?

Document:

- likely spacing grid
- typical increments
- density classification
- where spacing is tight versus generous

A rebuild can have the right colors and still feel wrong if spacing is off.

---

## Step 11. Infer shape language

Study corners, outlines, framing, and softness.

Look at:

- input radius
- button radius
- card radius
- modal radius
- outer shell radius

Ask:

- Are corners sharp, slightly rounded, or very soft?
- Does the UI feel enterprise, consumer, playful, or luxury?
- Are there many pills, circles, and blobs, or mostly rectangles?

Document:

- radius scale ranges
- whether shape language is restrained or expressive

---

## Step 12. Infer border and elevation strategy

Study how surfaces are separated.

Look for:

- card borders
- input outlines
- divider lines
- shadow presence or absence
- floating layer treatment

Ask:

- Does the system rely more on borders or shadows?
- Are shadows dramatic, subtle, or almost absent?
- Is the UI flat, layered, or softly elevated?

Document:

- border intensity
- shadow intensity
- where elevation is used and where it is intentionally absent

---

## Step 13. Infer state styling from visible evidence

Static screenshots still reveal a lot about interaction.

Look for:

- selected cards
- active nav items
- checked boxes
- focused inputs
- highlighted rows
- primary buttons
- low-emphasis secondary actions

Ask:

- How is selected state shown?
- How is primary action shown?
- Does emphasis come from fill, border, contrast, or text weight?
- Is accent color used sparingly or everywhere?

Document:

- state rules
- emphasis hierarchy
- action priority conventions

---

## Step 14. Treat modals and overlays as high-signal references

Modals are often one of the clearest places to read the system.

Analyze:

- modal background
- modal radius
- overlay color
- header treatment
- button arrangement
- padding inside the modal
- image or content framing

Ask:

- Is the modal more polished than the rest of the UI?
- Is the overlay dramatic or understated?
- Are footer actions balanced or strongly prioritized?

Document:

- modal pattern
- overlay behavior
- action layout rules

---

## Step 15. Convert the analysis into reusable tokens

After the system is understood, formalize it.

Create token groups such as:

- colors
- typography
- spacing
- radius
- borders
- shadows
- motion

Use semantic names:

- `--bg-surface`
- `--text-muted`
- `--accent-primary`
- `--border-soft`

Avoid weak names like:

- `--gray-1`
- `--blue-2`
- `--box-color`

Tokens should describe **role**, not screenshot position.

---

## Step 16. Convert tokens into component rules

Tokens alone are not enough. Every major component should receive implementation guidance.

For each component, describe:

- purpose
- surface/background treatment
- border/shadow use
- spacing and density
- default state
- selected/active/hover behavior
- what to avoid

Example:

- Search input: pale surface, low-contrast border, compact height, quiet placeholder, subtle focus ring
- Primary button: accent fill, white text, compact radius, medium font weight, used only for highest-priority action
- Card: white surface, faint border, small radius, selected via accent outline not heavy fill

---

## Step 17. Add implementation constraints

A good reverse-engineering guide must include boundaries.

Write explicit constraints such as:

- do not overuse accent colors
- do not enlarge controls beyond the inferred density
- do not replace borders with dramatic shadows if the source is flat
- do not introduce gradients unless they are clearly part of the shell
- do not invent playful motion in an operational product
- do not over-round components if the source is restrained

These constraints preserve the original feel during implementation.

---

## Step 18. State uncertainty honestly

Be explicit when a conclusion is approximate.

Good examples:

- “The radius appears to be in the 4–6px range.”
- “The accent blue is approximate and should be tuned during implementation.”
- “Typography appears to be a neutral sans; Inter is a reasonable reconstruction choice.”

Do not pretend to know exact values from incomplete evidence. Clear uncertainty is better than fake precision.

---

## Step 19. Produce the final handoff in a build-ready structure

The final output should usually include:

1. product type summary
2. design feel summary
3. layout breakdown
4. repeated design signals
5. color roles and approximate palette
6. typography inference
7. spacing and density guidance
8. shape, border, and shadow rules
9. interaction/state behavior
10. component-by-component rules
11. do / do not constraints
12. implementation brief
13. optional starter tokens

This makes the analysis usable by another coding agent.

---

# Part II — Recommended Tools for the Agent

The agent already has Python. That is useful, but Python should be supported with a few practical command-line tools for image inspection, light measurement, and artifact preparation.

The tools below are recommended because they help the agent inspect screenshots without replacing judgment.

## 1. ImageMagick

**Best general-purpose CLI tool for screenshot inspection.**

Use it for:

- getting image dimensions and metadata
- resizing for faster analysis
- cropping regions for closer inspection
- extracting approximate color palettes
- generating contact sheets
- comparing two screenshots
- isolating UI regions for review

Useful commands:

```bash
magick identify screenshot.png
magick screenshot.png -resize 1600x1600\> resized.png
magick screenshot.png -crop 500x300+80+120 crop-header.png
magick screenshot.png -colors 16 -unique-colors txt:-
magick screenshot1.png screenshot2.png -compose difference -composite diff.png
magick *.png -geometry +16+16 -tile 2x montage.png
```

Why it helps:

- fast and available on many systems
- ideal for palette approximation and cropping
- useful when the agent wants to inspect local regions instead of the full image

Recommended uses in this workflow:

- before color estimation
- when comparing repeated layout regions
- when zooming into nav, toolbar, or modal areas

---

## 2. OpenCV tooling via Python

**Best for structural analysis when simple inspection is not enough.**

Use it for:

- detecting large layout regions
- finding edges, panels, and dominant blocks
- approximating repeated spacing or grid structures
- comparing screenshots for repeated layout patterns

Typical uses in Python:

- edge detection
- contour detection
- region segmentation
- simple layout block finding

Why it helps:

- strong for geometry and structure
- useful when the agent wants objective support for layout analysis

Recommended uses:

- large-zone mapping
- repeated card/grid detection
- identifying shell boundaries

Caution: Use OpenCV to support reasoning, not to replace visual judgment. It can suggest structure, but it does not understand product intent.

---

**Helpful when screenshots come from screen recordings or product demo videos.**

Use it for:

- extracting frames from video
- sampling key moments from a walkthrough
- generating stills from UI motion or modal states

Useful commands:

```bash
ffmpeg -i demo.mp4 -vf fps=1 frames/frame-%03d.png
ffmpeg -i demo.mp4 -ss 00:00:12 -vframes 1 modal-state.png
```

Why it helps:

- lets the agent build a screenshot set from motion material
- useful when the source is not a static image collection

Recommended uses:

- when only a video or gif is available
- when needing multiple states from a walkthrough

---

---

# Part III — Recommended Tool Workflow

## Minimal recommended stack

If the agent wants a practical toolkit, use:

- Python
- ImageMagick
- OpenCV via Python

That stack is enough for most serious screenshot reverse-engineering.

---

## Suggested workflow with tools

### Pass 1 — human-style reading

Use no heavy tools at first. Just inspect the screenshot and write:

- product type
- tone
- layout zones
- repeated patterns

### Pass 2 — quick technical inspection

Use:

- `magick identify`

Goal:

- confirm dimensions
- confirm formats
- normalize image assumptions

### Pass 3 — crop and inspect key regions

Use ImageMagick to crop:

- header
- sidebar
- toolbar
- card/list item
- modal

Goal:

- inspect local style more carefully
- reduce distraction from full-screen content

### Pass 4 — approximate palette extraction

Use ImageMagick on full image and on UI-only crops.

Goal:

- estimate structural colors
- separate UI colors from media colors

Important: Run palette extraction on shell areas, not just on the whole screenshot. Otherwise content images will pollute the result.

### Pass 5 — structural support if needed

Use Python + OpenCV only when the layout is ambiguous.

Goal:

- detect large blocks
- estimate repeated spacing
- support grid or panel inference

### Pass 6 — compare views

Use ImageMagick diffing or simple crop comparison.

Goal:

- confirm what repeats across multiple screens
- separate design system from content

### Pass 7 — write the guide

Only after analysis is stable should the agent produce:

- token suggestions
- component rules
- do/do-not constraints
- implementation brief

---

# Part IV — Practical Rules for Agents

## Rule 1

Use tools to support judgment, not replace it.

## Rule 2

Do not confuse color extraction with design understanding.

## Rule 3

Always crop UI regions separately from media content before estimating palette.

## Rule 4

Prefer approximate semantic tokens over fake exactness.

## Rule 5

When uncertain, describe a range and explain the confidence level.

## Rule 6

Do not let algorithmic segmentation dominate the reasoning. It is a helper, not the analyst.

## Rule 7

The final output must explain the **system**, not just the screenshot.

---

# Part V — Reusable Prompt for the Agent

> Analyze the provided UI screenshot(s) and reverse-engineer the underlying design system. Start by identifying product type, user task, visual tone, and major layout zones. Separate shell patterns from page-specific content. Compare repeated patterns across screenshots before making conclusions. Extract colors by functional role rather than raw palette dumping, and separate UI colors from content/media colors. Infer typography hierarchy, spacing rhythm, density, shape language, borders, elevation, and state styling. Use ImageMagick for cropping, inspection, palette approximation, and screenshot comparison. Use OpenCV only when structural support is needed for layout detection, panel boundaries, or repeated spacing patterns. Convert the results into semantic design tokens, component rules, do/do-not constraints, and a concise implementation brief. Be honest about uncertainty and prioritize recreating the design logic and feel over pixel-perfect matching.

---

## Final Summary

A strong design reverse-engineering agent does not merely sample pixels. It reads screenshots as evidence of a product system: structure, hierarchy, tone, and implementation logic. The right tools can improve accuracy, but they should serve the analysis rather than replace it.

