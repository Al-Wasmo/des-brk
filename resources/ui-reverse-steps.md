
### Step 1. Observe before labeling

First, look at the screenshot silently and avoid rushing into conclusions.

Ask:

* What kind of product is this?
* What is the screen trying to help the user do?
* Is this operational, editorial, consumer, creative, financial, technical, social, or admin-oriented?
* Does the screen feel dense, relaxed, playful, premium, serious, internal, or public-facing?

Output of this step:

* a 1–2 sentence statement of product type
* 3–6 adjectives describing the design feel

Do not mention colors yet unless they are crucial to understanding the product.

---

### Step 2. Map the major layout zones

Break the image into large structural regions before analyzing components.

Typical zones may include:

* outer background or frame
* top header
* left or right navigation
* secondary sidebar
* content workspace
* modal or overlay
* footer or status region

Ask:

* What are the largest layout blocks?
* Which areas are persistent shell and which are page content?
* What is structural vs contextual?

Output of this step:

* a layout map in ordered zones
* a note about the primary shell pattern, such as dashboard, editor, marketplace, admin, or workspace

Do not yet over-focus on small UI elements.

---

### Step 3. Compare repeated patterns across screenshots

If multiple screenshots exist, compare them to discover what belongs to the **system** versus what belongs to the **content**.

Look for repeated elements such as:

* same nav treatment
* same spacing rhythm
* same button style
* same border behavior
* same accent color usage
* same modal pattern
* same table or card behavior

Ask:

* What repeats across views?
* What is likely part of the design system?
* What is just page-specific content?

Output of this step:

* a list of repeated design signals
* a list of content-specific details to ignore

This is how you avoid overfitting to one screen.

---

### Step 4. Infer the product personality

Before extracting tokens, define the visual intent.

Ask:

* Does the interface communicate trust, speed, authority, creativity, warmth, precision, luxury, or utility?
* Is the UI trying to disappear behind the content or express the brand strongly?
* Does it prioritize efficiency or delight?

Write a short paragraph describing the product personality.

Examples of personality language:

* enterprise and restrained
* premium and editorial
* developer-centric and utilitarian
* playful and content-driven
* calm and operational

This step prevents shallow reproduction. A good rebuild needs the **tone**, not just the styling.

---

### Step 5. Decompose the UI into component families

Now split the screenshot into reusable component types.

Common families:

* app shell
* nav rail
* sidebar tree
* header
* toolbar
* tabs
* search input
* filters
* buttons
* cards
* data table
* modal
* form controls
* badges
* empty states

Ask:

* What components appear here?
* Which ones are foundational to the product?
* Which ones define the visual identity most strongly?

Output of this step:

* a component inventory
* a note about which components carry the strongest style signals

This is the transition from “image reading” to “system modeling.”

---

### Step 6. Extract color by role, not by random sampling

Do not start with a giant palette dump.
Instead, determine the **functional roles** of color.

Typical roles:

* app background
* primary surface
* secondary surface
* border
* primary text
* secondary text
* muted text
* nav/dark structure
* accent/action
* selected state
* error/success/warning if visible

Ask:

* Which colors define structure?
* Which colors define interaction?
* Which colors are just content/media?
* Is color sparse or expressive?

Only after that, estimate token values.

Output of this step:

* color roles first
* approximate token values second

Important rule:
If exact values are uncertain, say they are approximate and prioritize **matching feel** over exact sampling.

---

### Step 7. Separate UI color from content color

If screenshots include photos, illustrations, dashboards, or charts, do not confuse those with the product’s core UI palette.

Ask:

* Is the interface itself quiet while content provides visual richness?
* Or is the UI shell itself colorful and branded?

Document this explicitly.

This prevents the agent from injecting unrelated colors into the rebuild.

---

### Step 8. Infer typography hierarchy

Study text size, weight, density, and contrast.

Look for:

* title scale
* section headings
* body labels
* metadata
* helper text
* button labels
* nav labels

Ask:

* Is the typography compact or spacious?
* Does hierarchy rely on size, weight, color, spacing, or all four?
* Is it modern neutral sans, editorial serif, or platform-native?

Output of this step:

* inferred type scale ranges
* likely font personality
* guidance on weight and line-height usage

Do not invent elaborate type systems the screenshot does not support.

---

### Step 9. Infer spacing rhythm and density

Look at margins, gaps, padding, row height, and control sizing.

Ask:

* Does the UI feel based on a 4px grid, 8px grid, or something looser?
* Is it dense like a data product or roomy like a marketing editor?
* Are controls compact, medium, or oversized?

Output of this step:

* likely spacing rhythm
* density classification
* default spacing guidance for implementation

Spacing is one of the most important parts of “feel.”
A rebuild can have correct colors and still feel wrong if spacing is off.

---

### Step 10. Infer shape language and elevation

Study:

* corner radius
* border intensity
* shadow strength
* layering behavior

Ask:

* Are corners sharp, slightly rounded, or very soft?
* Do surfaces separate through shadows, borders, or both?
* Is elevation dramatic or subtle?

Output of this step:

* radius scale suggestions
* border strategy
* shadow strategy

This defines whether the UI feels enterprise, consumer, luxury, retro, soft, or technical.

---

### Step 11. Study interaction states from visible evidence

Even in static screenshots, you can often infer interaction patterns.

Look for:

* selected rows/cards
* active nav items
* hover-like buttons
* focused inputs
* primary vs secondary action hierarchy
* disabled or muted controls

Ask:

* How does the UI communicate selected state?
* Is emphasis achieved through fill, outline, icon contrast, or typography?
* How sparingly is the accent color used?

Output of this step:

* state behavior notes
* emphasis rules for implementation

Do not invent advanced motion unless the visual system strongly suggests it.

---

### Step 12. Use overlays and modals as high-signal references

Modals, drawers, and overlays often reveal the most coherent styling.

Analyze:

* panel background
* overlay color
* header treatment
* spacing inside the modal
* action placement
* button hierarchy

Ask:

* Does the modal feel heavier, lighter, more polished, or more neutral than the main UI?
* Is the background dimmed dramatically or gently?

Output of this step:

* modal pattern guidance
* layering behavior

If a modal exists, give it special attention.
It often clarifies the system better than a busy data view.

---

### Step 13. Turn observations into tokens

Only now should you formalize the analysis into reusable tokens.

Suggested token groups:

* colors
* typography
* spacing
* radius
* border
* shadow
* motion

Rules for tokenization:

* keep the token set small and useful
* avoid false precision
* prefer semantic names over visual names
* map tokens to roles, not screenshots

Good:

* `--bg-surface`
* `--text-secondary`
* `--accent-primary`

Less useful:

* `--light-gray-2`
* `--blue-3`

---

### Step 14. Turn tokens into component rules

Tokens alone are not enough.
Translate them into instructions for actual components.

For each component, describe:

* purpose
* visual style
* emphasis level
* spacing
* state behavior
* what to avoid

Example structure:

* Search input: quiet surface, soft border, compact height, muted placeholder, subtle focus ring
* Primary button: accent fill, white text, compact radius, medium weight, used sparingly
* Card: white surface, faint border, small radius, selected state via accent outline

This step converts design analysis into build behavior.

---

### Step 15. Add “do” and “do not” constraints

This is critical for LLM execution quality.

A good agent can imitate the visible elements but still break the design feel by adding extra decoration.

Add rules such as:

* Do use white space deliberately.
* Do keep accent usage disciplined.
* Do rely on borders more than shadows when appropriate.
* Do keep type compact when the system suggests it.
* Do not add gradients unless clearly present.
* Do not over-round corners if the source is restrained.
* Do not create oversized controls in a dense system.
* Do not invent playful motion for an operational product.

These constraints protect the design language.

---

### Step 16. Write an implementation brief for another agent

At the end, condense everything into a short build-ready brief.

The brief should cover:

* product feel
* layout pattern
* primary colors by role
* spacing/density
* typography mood
* component priorities
* interaction restraint
* what to avoid

This is the handoff format most coding agents can act on directly.

---

### Step 17. State uncertainty honestly

When the screenshot does not reveal something clearly, say so.

Examples:

* “Radius appears small, likely in the 4–6px range.”
* “Typography looks like a neutral sans; Inter is a good approximation.”
* “Accent blue is approximate and should be tuned during implementation.”

Do not fake confidence where the image is ambiguous.
A useful design-reconstruction agent is clear about what is inferred versus visible.

---

### Step 18. Keep the agent free, but bounded

Do not force exact conclusions too early.
Guide the agent using questions and priorities, not rigid formulas.

The agent should be free to:

* infer likely product context
* choose approximate tokens
* describe ambiguous areas in ranges
* prioritize system feel over pixel exactness

But the agent should remain bounded by:

* visible evidence
* repeated patterns
* restrained assumptions
* honest uncertainty

That balance produces the best design reverse-engineering.

---

## Recommended Output Format for the Agent

When the agent finishes, the output should usually contain:

1. Product/type summary
2. Design feel summary
3. Layout breakdown
4. Repeated design signals
5. Color roles and approximate palette
6. Typography inference
7. Spacing and density inference
8. Shape, border, and shadow rules
9. Component-by-component guidance
10. Interaction/state behavior
11. Do / do not constraints
12. Implementation brief
13. Optional starter design tokens

---