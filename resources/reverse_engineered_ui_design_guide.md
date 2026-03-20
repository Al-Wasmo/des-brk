# Reverse-Engineered UI Design Guide

## Purpose
This guide translates the visual language of the provided screenshots into a build-ready specification for a coding LLM or frontend agent. It is written to help recreate the same product feel rather than copy individual pixels. The target outcome is an enterprise SaaS admin interface that feels clean, modern, operational, calm, and image/content-centric.

---

## 1. Design Intent

### Product feel
- **Category feel:** B2B SaaS admin dashboard / media management app / campaign asset library.
- **Emotional tone:** calm, competent, practical, trustworthy.
- **Visual personality:** restrained, clean, utility-first, not playful.
- **Design maturity:** polished but not flashy; focused on workflow clarity over branding theatrics.
- **Primary user impression:** "This is a serious internal tool that is easy to scan and safe to use."

### Experience principles
1. **Make content management feel lightweight.** The app handles a lot of assets, but the chrome stays quiet.
2. **Let structure do the work.** Layout, spacing, borders, and alignment carry the interface more than bold colors.
3. **Use blue only for action and focus.** Accent color is functional, not decorative.
4. **Keep the surface bright and neutral.** Most of the interface is white or very pale gray.
5. **Communicate hierarchy with density, not drama.** This UI is information-rich without feeling cramped.

---

## 2. Core Visual DNA

### Overall composition
The interface uses a **three-zone application shell**:
1. **Outer app frame** on a muted cool gray background.
2. **Dark vertical icon rail** on the far left.
3. **Light workspace** with a slim secondary navigation panel and a large content area.

### What visually defines the product
- Deep navy left rail.
- White working surfaces.
- Light gray headers and control bars.
- Soft borders instead of heavy shadows.
- Small, efficient typography.
- Card/grid/file list patterns with subtle rounding.
- Strong, bright blue used sparingly for primary CTA, selected states, and actionable emphasis.
- Modal overlay that dims the app without becoming dramatic.

### What it is not
- Not a marketing site.
- Not a glassmorphism UI.
- Not heavily shadowed.
- Not rounded to consumer-app extremes.
- Not colorful in the shell.
- Not animation-driven.

---

## 3. Color System

These values are approximate, derived from the screenshots. They should be treated as **design tokens**, not forensic exact matches.

### Primary neutrals
- **App shell background:** `#BDC4D4`
  - Used outside the main white application panel.
  - Gives the app a framed, desktop-like presentation.

- **Main surface / card surface:** `#FFFFFF`
  - Default content surface.
  - Used for top bars, panels, tables, cards, and modals.

- **Soft background gray:** `#F5F7FB`
  - Used for header bars, search inputs, quiet controls, and modal chrome.

- **Subtle panel gray:** `#EEF2F6`
  - Used in overlays, muted containers, and low-emphasis zones.

- **Border gray:** `#E3E8EF`
  - Used for card borders, dividers, input outlines, and table separators.

- **Secondary border gray:** `#D6DDE7`
  - Slightly stronger stroke for selected edges or higher-contrast boundaries.

### Dark neutrals
- **Primary sidebar navy:** `#162539`
  - Main left rail.
  - Gives the app its strongest identity.

- **Sidebar hover/selected background:** `#263354`
  - Used behind active icons or hovered rail items.

- **Deep modal shell / framing dark:** `#141D2C`
  - Seen in the preview modal framing and dimmed window context.

- **Primary text:** `#1F2937`
  - Titles, headers, row labels.

- **Secondary text:** `#5B667A`
  - Metadata, breadcrumbs, helper text, secondary labels.

- **Muted text / inactive icons:** `#8B95A7`
  - Low-emphasis UI copy.

### Accent colors
- **Primary action blue:** `#0270F2`
  - Main CTA, selected outline, active states, confirm action.

- **Hover blue:** `#005ED5`
  - Slightly darker interaction state for primary buttons.

- **Soft selected blue background:** `#E6F0FA`
  - Used for selected icon containers and subtle selected UI surfaces.

### Functional suggestions
- **Success:** use a restrained green, e.g. `#18A957`.
- **Warning:** muted amber, e.g. `#DFA000`.
- **Error:** clean red, e.g. `#D14343`.

These are not prominent in the screenshots, so they should remain understated.

---

## 4. Contrast and Color Behavior

### Contrast strategy
- Most contrast is created through **dark text on white** and **dark sidebar against bright workspace**.
- Borders are deliberately faint; avoid heavy outlines.
- Blue should only appear where there is real semantic meaning:
  - primary CTA
  - selected thumbnail border
  - selected nav accents
  - actionable buttons/links

### Color usage ratio
A good approximation:
- **75–80%** white / off-white surfaces
- **10–15%** cool grays and borders
- **5–8%** dark navy structure
- **2–4%** accent blue

This restrained ratio is critical to the feel.

---

## 5. Typography

### Typography mood
- Neutral, modern sans-serif.
- Efficient rather than expressive.
- Reads like a product UI built for daily use.

### Recommended font family
Use one of:
- `Inter`
- `SF Pro Text`
- `Segoe UI`
- `Roboto`

`Inter` is the best default choice for recreation.

### Type scale
- **Page title:** 22–24px, semibold
- **Section title / modal title:** 16–18px, semibold
- **Primary body / labels:** 13–14px, regular to medium
- **Metadata / breadcrumbs / helper text:** 11–12px, regular
- **Buttons:** 12–14px, medium

### Text styling rules
- Use semibold sparingly.
- Body copy should remain compact and highly readable.
- Line-height should be tight but not compressed:
  - 1.3–1.45 for UI text
- Breadcrumbs and metadata should be visually quiet.

---

## 6. Layout System

### Page framing
- Entire app sits inside a framed panel with subtle margins from the browser edge.
- Outer frame corners are softly rounded.
- Main app panel is bright and clean, almost like a desktop application inside a shell.

### Horizontal structure
1. **Far-left icon rail:** approx. 56–72px width.
2. **Secondary navigation panel:** approx. 170–220px width.
3. **Primary workspace:** fluid width.

### Vertical structure
- **Top global bar:** ~64px height.
- **Workspace header / controls row:** ~48–64px combined, depending on page.
- **Main content area:** fills the rest.

### Spacing rhythm
Use an 8px base grid.
Common increments:
- 4px for tiny offsets
- 8px for icon/text spacing
- 12px for compact padding
- 16px for control spacing
- 24px for section separation
- 32px for larger layout gaps

### Density target
- More compact than a consumer UI.
- Less dense than old enterprise tools.
- Aim for **moderately dense operational clarity**.

---

## 7. Surfaces, Borders, and Elevation

### Surface model
The UI relies more on **surface contrast and borders** than on shadows.

#### Use these surface rules:
- Primary surfaces: white.
- Secondary quiet surfaces: very pale gray.
- Borders: 1px solid, cool gray.
- Shadows: extremely subtle, only for modal separation or floating layers.

### Border radius
- **Inputs / small controls:** 4–6px
- **Cards / thumbnails / table buttons:** 4–6px
- **Modal:** 8–10px
- **Outer app frame:** 10–14px

### Shadows
Keep minimal:
- Cards: often none
- Dropdowns / modals: light blur shadow only
- Avoid stacked or dramatic elevation

A suitable default modal shadow would be something like:
- `0 10px 30px rgba(15, 23, 42, 0.12)`

---

## 8. Navigation Patterns

### Left icon rail
#### Characteristics
- Dark navy background.
- Monochrome icons in low-contrast light gray.
- Active item receives a lighter navy or blue-tinted background and stronger icon contrast.
- Layout is vertical and evenly spaced.
- Branding mark at top is simple and block-like.

#### Behavior
- Use icon-only navigation.
- Keep icons thin-to-medium stroke.
- Active icon should feel selected but not loud.
- Avoid badges unless necessary.

### Secondary navigation tree
#### Characteristics
- White panel with nested folder/file structure.
- Small labels.
- Blue used for selected item text or markers.
- Expand/collapse pattern is understated.

#### Rules
- Indentation defines hierarchy.
- Hover states should be subtle gray background.
- Selected state should rely on blue text and perhaps a slim leading indicator.

---

## 9. Header and Toolbar Design

### Global top bar
Contains:
- page title
- short descriptive subtitle
- organization selector
- utility icons (settings/help/profile)

#### Style rules
- White or very pale gray background.
- Minimal separation from content below.
- Title aligned left with small subtitle.
- Utility cluster aligned right.
- Use light divider lines between certain control groups.

### Content toolbar
Contains:
- breadcrumb path
- search input
- toggle for subfolder search
- view switcher icons
- import action
- primary upload button

#### Toolbar behavior
- Align controls cleanly in one horizontal row when width allows.
- Keep control heights consistent.
- Use pale filled input backgrounds rather than strong outlined fields.
- View controls should be compact square buttons.

---

## 10. Form Controls

### Search input
- Height: 32–36px
- Background: `#F5F7FB`
- Border: 1px solid `#E3E8EF`
- Radius: 4–6px
- Left search icon
- Placeholder text in muted gray

### Checkboxes
- Small and crisp.
- Border-led rather than filled-heavy.
- Selected state can use blue border/fill.

### Buttons
#### Primary button
- Blue fill
- White text
- Medium font weight
- Small radius
- Compact height
- Used sparingly for highest-priority action

#### Secondary button
- White or soft gray fill
- Gray border
- Dark text
- Used for utility actions like Preview or Cancel

#### Tertiary button / icon button
- Minimal chrome
- Square or nearly square
- Border only when needed

---

## 11. Content Presentation Patterns

### Asset grid view
#### Characteristics
- White thumbnail cards with faint border.
- Even gaps between cards.
- Image fills most of card.
- Filename shown below in small text.
- Selection state shown with blue outline.

#### Rules for recreation
- Card ratio should feel standardized even if content images differ.
- Use crop or contain behavior consistently.
- Keep labels left-aligned and compact.
- Do not over-style cards.

### Table/list view
#### Characteristics
- Minimal table chrome.
- Very light row separators.
- Hover row background in pale gray-blue.
- Action buttons at row end.
- Metadata columns use smaller, quieter text.

#### Rules
- Avoid strong zebra striping.
- Use alignment to create order.
- Allow actions to appear at the far right.
- Keep column headers subtle.

---

## 12. Modal Design

### Modal feel
The image preview modal is one of the clearest style references.

#### Characteristics
- Large white panel centered over dimmed interface.
- Rounded corners.
- Minimal border.
- Clean header with title and close icon.
- Large image area with breathing room.
- Footer-style actions aligned right.

### Overlay behavior
- Use a cool gray translucent overlay, not pure black.
- The background should feel suppressed, not theatrical.

### Action layout
- Cancel on the left or low emphasis.
- Secondary utility action near the right (e.g. Edit Image).
- Primary confirm button at far right in blue.

---

## 13. Iconography

### Icon style
- Thin or medium stroke icons.
- Simple line icons.
- Enterprise-neutral, not cartoonish.
- Use icons to support scanning, not as decoration.

### Recommended libraries
- Lucide
- Heroicons
- Feather-style icon sets

### Usage rules
- Keep icons small: 14–18px in toolbars, 16–20px in nav.
- Pair icons with labels only when needed.
- Maintain consistent stroke width.

---

## 14. Motion and Interaction

### Motion philosophy
Almost invisible.

### Suggested interactions
- Hover fade for buttons and rows: 120–160ms
- Focus ring on inputs and selected cards: subtle blue outline
- Modal enter: short fade + 4–8px upward easing
- No springy animation
- No large-scale movement

### Interaction priorities
1. Clarity
2. Predictability
3. Responsiveness
4. Minimal distraction

---

## 15. Image and Media Treatment

### Media handling tone
Images are content, not decoration. The UI frames them neutrally.

### Rules
- Avoid heavy frames around thumbnails.
- Maintain consistent thumbnail sizes.
- Support both grid and list layouts.
- Use preview modals for larger inspection.
- Let imagery bring color into the page while the shell remains muted.

This contrast between quiet interface and colorful media is a core part of the product feel.

---

## 16. CSS / Design Token Starter Set

```css
:root {
  --bg-app: #BDC4D4;
  --bg-surface: #FFFFFF;
  --bg-subtle: #F5F7FB;
  --bg-muted: #EEF2F6;

  --border-soft: #E3E8EF;
  --border-mid: #D6DDE7;

  --text-primary: #1F2937;
  --text-secondary: #5B667A;
  --text-muted: #8B95A7;

  --nav-dark: #162539;
  --nav-dark-active: #263354;

  --accent: #0270F2;
  --accent-hover: #005ED5;
  --accent-soft: #E6F0FA;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-xl: 12px;

  --shadow-modal: 0 10px 30px rgba(15, 23, 42, 0.12);
}
```

---

## 17. Component Implementation Guidance for a Coding LLM

### Shell
- Build a desktop-style admin shell with a dark left rail and a white main workspace.
- Keep the outer page background muted cool gray.
- Center the app in the viewport with small margins.
- Give the root app container rounded corners.

### Navigation
- Use a compact icon sidebar with 6–8 items.
- Add a secondary tree-style left panel for folders/categories.
- The selected state should use blue or blue-tinted emphasis without becoming loud.

### Main content region
- Use a top bar for page identity and account utilities.
- Use a second horizontal toolbar for content controls.
- Support switching between grid and list view.

### Grid cards
- Use faint borders, white background, small radius.
- Show thumbnail above filename.
- Use blue outline for selection.

### Table rows
- Keep headers subtle and compact.
- Use pale hover state only.
- Put row actions at the far right.

### Modal
- Center a large white preview modal over a cool gray dimmed overlay.
- Add header, preview area, and action row.
- Use a blue primary action and muted secondary actions.

---

## 18. Rebuild Prompt for a Frontend Agent

Use this prompt as the implementation brief:

> Build a clean enterprise SaaS asset-library interface inspired by a modern media management dashboard. Use a dark navy icon rail on the far left, a white secondary navigation panel, and a large bright workspace. The design should feel calm, practical, and content-focused. Use mostly white and pale gray surfaces with faint borders, compact typography, small radii, and a single strong blue accent for primary actions and selected states. Avoid flashy gradients, oversized shadows, and playful consumer styling. Support both asset grid and list views, plus a large centered image preview modal with understated overlay dimming.

---

## 19. Do / Do Not

### Do
- Keep the interface mostly white.
- Use blue with discipline.
- Prefer borders over shadows.
- Use compact enterprise spacing.
- Keep typography small and efficient.
- Make layout alignment feel precise.
- Let media content provide most of the page color.

### Do not
- Do not add bright accent colors everywhere.
- Do not use large rounded blobs or mobile-app styling.
- Do not make buttons oversized.
- Do not use strong gradients in the shell.
- Do not use dark mode for this visual reference.
- Do not make shadows heavy or dramatic.
- Do not center everything; this is a work tool, not a hero page.

---

## 20. Final Design Summary

The design language is **enterprise minimalism with a content-management center of gravity**. Its strength comes from restraint: a dark structural rail, bright working surfaces, compact controls, faint borders, and a disciplined blue accent. The interface does not try to impress through visual flair. It earns trust through order, spacing, hierarchy, and predictable interaction patterns.

When rebuilding, optimize for **clarity, density balance, calmness, and operational polish**.

