# UI Spec

Design specifications and screen descriptions for the Frontend Engineer. Maintained by the Design Agent and reviewed by the Manager Agent.

---

## How This Page Works

Before the Frontend Engineer begins work on any UI task, the Design Agent must create a spec entry below describing the screen, components, and user flow. The Frontend Engineer should not start implementation until a spec exists and is marked "Approved" by the Manager.

---

## Design System Conventions

Plant Guardians follows a **Japandi botanical** aesthetic: warm minimalism, natural materials, breathing room, and quiet confidence. The palette draws from indoor garden environments — linen, moss, clay, and aged wood. Nothing is loud; everything is intentional.

| Element | Convention |
|---------|-----------|
| **Background** | `#F7F4EF` — warm off-white (unbleached linen) |
| **Surface** | `#FFFFFF` — pure white for cards and panels |
| **Surface Alt** | `#F0EDE6` — slightly warmer surface for inset areas, secondary cards |
| **Text Primary** | `#2C2C2C` — near-black, warm undertone |
| **Text Secondary** | `#6B6B5F` — muted warm gray for labels and supporting text |
| **Text Disabled** | `#B0ADA5` — light warm gray |
| **Accent Primary** | `#5C7A5C` — sage green (brand color, primary CTAs) |
| **Accent Hover** | `#4A6449` — darker sage for hover/active states |
| **Accent Warm** | `#A67C5B` — terracotta/clay for secondary accents and highlights |
| **Status Green** | `#4A7C59` — "on track" (watering/care is up to date) |
| **Status Yellow** | `#C4921F` — "due today" (action needed today) |
| **Status Red** | `#B85C38` — "overdue" (action is past due) |
| **Border** | `#E0DDD6` — soft warm border for cards and inputs |
| **Border Focus** | `#5C7A5C` — sage green focus ring (2px) |
| **Font Family** | `'DM Sans'` (body, labels, UI) + `'Playfair Display'` (page titles and hero text only) |
| **Font Scale** | 12 / 14 / 16 / 18 / 24 / 32 / 40px |
| **Font Weight** | 400 (body), 500 (label/emphasis), 600 (button/heading) |
| **Border Radius** | 12px (cards), 8px (inputs, secondary buttons), 24px (pills, status badges), 50% (avatar, icon buttons) |
| **Spacing Grid** | 8px base — use 8, 16, 24, 32, 48, 64px increments |
| **Card Shadow** | `box-shadow: 0 2px 8px rgba(44, 44, 44, 0.06)` |
| **Overlay** | `rgba(44, 44, 44, 0.45)` — modal/drawer backdrop |
| **Transition** | `all 0.2s ease` — standard; `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` — celebratory/spring |
| **Icon Style** | Outlined (Phosphor Icons recommended) — no filled icons except for status indicators |
| **Max Content Width** | 1280px centered |
| **Sidebar Width** | 240px (desktop) |

### Button Variants

| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| Primary | `#5C7A5C` | `#FFFFFF` | none | Main CTAs |
| Secondary | transparent | `#5C7A5C` | 1.5px `#5C7A5C` | Supporting actions |
| Danger | `#B85C38` | `#FFFFFF` | none | Destructive actions |
| Ghost | transparent | `#6B6B5F` | none | Tertiary actions |
| Icon | transparent | `#6B6B5F` | none, circle on hover | Icon-only buttons |

All buttons: `padding: 10px 20px`, `border-radius: 8px`, `font-weight: 600`, `font-size: 14px`. Hover darkens background by ~10%. Active scales to `scale(0.97)`.

### Status Badge Component

Used across the app to show care schedule health.

| State | Background | Text/Icon Color | Label |
|-------|-----------|----------------|-------|
| On Track | `#E8F4EC` | `#4A7C59` | "On Track" |
| Due Today | `#FDF4E3` | `#C4921F` | "Due Today" |
| Overdue N days | `#FAEAE4` | `#B85C38` | "X days overdue" |
| Not Set | `#F0EDE6` | `#B0ADA5` | "Not set" |

Badges are pills: `padding: 4px 12px`, `border-radius: 24px`, `font-size: 12px`, `font-weight: 500`.

---

## Screen Specs

---

### SPEC-001 — Login & Sign Up Screen

**Status:** Approved
**Related Tasks:** T-001 (Auth UI)

#### Description

The entry point for all users. New users create an account; returning users log in. The page should feel welcoming and calm — not intimidating for a novice. The background uses a soft botanical illustration or a muted green gradient panel to reinforce brand identity without visual clutter.

#### Layout

Two-panel layout on desktop:
- **Left panel (40% width):** Brand panel — full-height, background `#4A6449` (deep sage), contains the app logo, tagline ("Every plant deserves a guardian."), and a subtle botanical illustration (SVG line art of a monstera or pothos leaf). No interactive elements.
- **Right panel (60% width):** Auth form panel — background `#F7F4EF`, vertically and horizontally centered content, max-width 420px form container.

On mobile: left panel collapses entirely. Right panel becomes full screen. Logo appears at the top of the form panel instead.

#### User Flow

1. User arrives at `/login` (default) or `/signup`.
2. A tab toggle at the top of the form switches between "Log In" and "Sign Up". Default tab: "Log In".
3. **Sign Up flow:**
   a. User fills in: Full Name, Email, Password, Confirm Password.
   b. Clicks "Create Account" button.
   c. On success: redirected to `/` (inventory screen) with a welcome toast: "Welcome to Plant Guardians, [Name]! 🌿"
   d. On error: inline field errors shown beneath affected fields.
4. **Log In flow:**
   a. User fills in: Email, Password.
   b. Clicks "Log In" button.
   c. On success: redirected to `/` (inventory screen).
   d. On error: form-level error banner shown ("Incorrect email or password").

#### Components

**Tab Toggle (Log In / Sign Up)**
- Two pill tabs in a rounded container (`background: #E0DDD6`, `border-radius: 24px`, `padding: 4px`)
- Active tab: white background, `box-shadow: 0 1px 4px rgba(44,44,44,0.1)`, primary text color
- Inactive tab: transparent, secondary text color
- Animate active indicator sliding on tab switch (CSS transition, 0.2s)
- Keyboard: arrow keys switch tabs; Tab moves into the form

**Input Fields**
- Label above input, `font-size: 14px`, `font-weight: 500`, `color: #2C2C2C`
- Input: full width, `height: 44px`, `border: 1.5px solid #E0DDD6`, `border-radius: 8px`, `background: #FFFFFF`, `padding: 0 14px`, `font-size: 15px`
- Focus state: border color `#5C7A5C`, `box-shadow: 0 0 0 3px rgba(92,122,92,0.15)`
- Error state: border color `#B85C38`, error message below in `#B85C38`, `font-size: 12px`
- Password field: right-side eye icon button to toggle visibility (aria-label: "Show/hide password")
- Spacing between fields: 20px

**Fields — Sign Up:** Full Name, Email, Password, Confirm Password
**Fields — Log In:** Email, Password

**Primary Button (Submit)**
- Full width, `height: 48px`, Primary variant
- Loading state: spinner replaces button text, button disabled
- Text: "Create Account" (sign up) / "Log In" (log in)

**Divider with "or" (below submit)**
- `color: #B0ADA5`, `font-size: 13px` — future placeholder for social auth; hide in Sprint 1 or omit entirely

**Switch Mode Link**
- Below button: "Don't have an account? Sign up" / "Already have an account? Log in"
- This switches the tab, does not navigate away
- `color: #5C7A5C`, underline on hover

#### States

| State | Behavior |
|-------|---------|
| **Default** | Empty form, no errors |
| **Typing** | Real-time validation on blur (not on every keystroke) |
| **Loading** | Button shows spinner, all inputs disabled |
| **Error (field)** | Red border + error message beneath the specific field |
| **Error (form)** | Red banner above submit: "Incorrect email or password" |
| **Success** | Redirect + welcome toast |
| **Password mismatch** | Error on "Confirm Password" field on blur |

#### Validation Rules (client-side)

- Full Name: required, min 2 characters
- Email: required, valid email format
- Password: required, min 8 characters
- Confirm Password: must match Password field

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Two-panel: brand panel left, form right |
| Tablet (768–1023px) | Two-panel: brand panel becomes narrower (30%), form gets 70% |
| Mobile (<768px) | Single column: left panel hidden, logo above form, form is full width with 24px horizontal padding |

#### Accessibility

- Form uses `<form>` with `novalidate` (JS handles validation)
- All inputs have associated `<label>` elements
- Error messages linked via `aria-describedby`
- Password toggle button: `aria-label="Show password"` / `"Hide password"`, toggled on click
- Tab order: Full Name → Email → Password → Confirm Password → Submit
- Focus visible ring on all interactive elements
- Color contrast: all text meets WCAG AA (4.5:1 minimum)

---

### SPEC-002 — Home / Plant Inventory Screen

**Status:** Approved
**Related Tasks:** T-002 (Plant Inventory UI)

#### Description

The main dashboard of the app. Users see their full plant collection displayed as a grid of cards. Each card summarizes the plant's name, photo (or placeholder), and a status badge reflecting the most urgent care action. This is the "at a glance" view — users should know within 2 seconds if any plant needs attention.

#### Layout

- **App Shell:** Left sidebar (240px, fixed, desktop) + main content area
- **Sidebar:** App logo, nav links (Inventory, Profile), user avatar + name at bottom, logout link
- **Main content:** Page title "My Plants", action bar (search + "Add Plant" button), plant grid
- **Grid:** 3 columns on desktop, 2 columns on tablet, 1 column on mobile
- **Grid gap:** 24px
- **Content padding:** 32px (desktop), 24px (tablet), 16px (mobile)

#### Sidebar Navigation

Fixed to the left on desktop. On tablet/mobile: collapsed behind a hamburger icon that opens a full-screen drawer overlay.

Contents:
- App logo (top, 24px padding) — clicking returns to `/`
- Nav items (icon + label):
  - 🌿 Inventory (active state: left border `4px solid #5C7A5C`, text `#5C7A5C`, background `rgba(92,122,92,0.08)`)
  - 👤 Profile
- Bottom section: user avatar (32px circle, initials if no photo), user name, logout ghost button
- Sidebar background: `#FFFFFF`, right border: `1px solid #E0DDD6`

#### Action Bar

Positioned below the page title, full width, flex row:
- **Left:** `<h1>` "My Plants" (Playfair Display, 32px, `#2C2C2C`) + plant count subtitle (e.g., "3 plants" in `#6B6B5F`, 14px)
- **Right:** Search input (240px, rounded, magnifier icon inside) + "Add Plant" primary button (icon: `+`)
- On mobile: "My Plants" heading above, then full-width search below it, then full-width "Add Plant" button

#### Plant Card Component

Each card is a clickable surface that links to the plant detail page. Clicking anywhere on the card navigates to `/plants/:id`.

Card dimensions: flexible (fills grid column), min-height 280px.

**Card anatomy (top to bottom):**
1. **Plant photo area** (full width, `height: 180px`, `border-radius: 12px 12px 0 0`, `overflow: hidden`)
   - If photo exists: `object-fit: cover`
   - If no photo: solid background in `#E8F0E8` with a centered leaf SVG icon (`color: #B8CEB8`, size 48px)
2. **Card body** (`padding: 16px`)
   - Plant name (`font-size: 16px`, `font-weight: 600`, `color: #2C2C2C`, truncated with ellipsis if >1 line)
   - Plant type (`font-size: 13px`, `color: #6B6B5F`, italic) — e.g., "Monstera deliciosa"
   - Status badge row: shows the **most urgent** status badge (overdue > due today > on track). If multiple schedules are set, show individual badges for each (watering, fertilizing, repotting) — max 3 badges, wrap to next line if needed. Badge order: Watering, Fertilizing, Repotting.
3. **Card footer** (`padding: 8px 16px 16px`, flex row, `justify-content: flex-end`)
   - Edit icon button (pencil) — navigates to `/plants/:id/edit`
   - Delete icon button (trash) — triggers Delete Confirmation Modal
   - Both are icon-only buttons, 32px circle, visible on hover or always visible on touch devices

**Card hover state (desktop):** `box-shadow: 0 6px 20px rgba(44,44,44,0.12)`, translate up `2px` — `transition: 0.2s ease`

#### Empty State

When the user has no plants:
- Centered in the content area (vertically and horizontally)
- Illustration: simple SVG of a small potted plant (line art, `color: #B8CEB8`)
- Heading: "Your garden is waiting." (Playfair Display, 24px)
- Subtext: "Add your first plant to start tracking your care schedule." (14px, `#6B6B5F`)
- "Add Your First Plant" primary button below

#### Search State

- As user types in the search input, cards filter in real-time (client-side filter on plant name and type)
- If no results match: show inline empty state: "No plants match '[query]'. Try a different name." with a clear-search link
- Search does NOT trigger API calls — filters locally

#### Delete Confirmation Modal

Triggered by the trash icon on any card.

- Backdrop overlay `rgba(44,44,44,0.45)`
- Modal card (`width: 400px`, `border-radius: 12px`, `background: #FFFFFF`, `padding: 32px`)
- Title: "Remove [Plant Name]?" (font-weight 600, 18px)
- Body text: "This will permanently remove [Plant Name] from your garden. This can't be undone."
- Buttons (right-aligned, gap 12px): "Cancel" (secondary) + "Yes, remove it" (Danger)
- Press Escape or click backdrop to cancel
- On confirm: card animates out (scale to 0.8, opacity to 0, 0.3s), success toast: "[Plant Name] has been removed."

#### States

| State | Behavior |
|-------|---------|
| **Loading (initial)** | Show 6 skeleton card placeholders (pulsing `#E0DDD6` shimmer animation) |
| **Empty** | Empty state illustration and CTA |
| **Populated** | Grid of plant cards |
| **Searching** | Filtered cards, empty-search state if no match |
| **Deleting** | Modal open; card animates out on confirm |
| **Error (API)** | Error banner at top: "Couldn't load your plants. Refresh to try again." with a Retry button |

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Sidebar visible, 3-column card grid |
| Tablet (768–1023px) | Sidebar collapsed to hamburger, 2-column grid |
| Mobile (<768px) | Sidebar in drawer, 1-column grid, full-width cards |

#### Accessibility

- Plant cards: `role="article"`, `aria-label="[Plant Name] plant card"`
- Edit/Delete icon buttons have descriptive `aria-label`: "Edit [Plant Name]" / "Delete [Plant Name]"
- Delete modal traps focus within modal when open; returns focus to delete button on close
- Skeleton loaders: `aria-busy="true"` on the grid container during loading
- Page announces updates via live region when a plant is deleted

---

### SPEC-003 — Add Plant Screen

**Status:** Approved
**Related Tasks:** T-003 (Add Plant UI)

#### Description

A focused form page where users create a new plant entry. It is the most important data-entry screen. Users can optionally upload a photo, fill in care schedule details manually, or use the AI Advice feature to automatically populate the form. The page should feel encouraging — this is a moment of commitment to a new plant.

#### Route

`/plants/new`

#### Layout

- App shell (sidebar + main)
- Main content: max-width 720px, centered
- Page title: "Add a New Plant" (Playfair Display, 32px)
- Subtitle: "Tell us about your plant so we can help you care for it."
- Form below, organized in logical sections

#### Form Sections

**Section 1 — Photo**
- Large upload zone: `width: 100%`, `height: 220px`, dashed border `2px dashed #C8C4BB`, `border-radius: 12px`, `background: #F0EDE6`
- Center content: upload icon (leaf/image), primary text "Upload a photo", secondary text "JPG, PNG up to 5MB"
- Click to open file picker
- Drag-and-drop also supported (highlight border to `#5C7A5C` on dragover)
- On image selected: preview fills the zone with `object-fit: cover`, `border-radius: 12px`, overlay shows "Change photo" on hover (semi-transparent overlay with camera icon)
- "Remove photo" link appears below the zone once a photo is uploaded
- If user skips photo, the placeholder leaf illustration remains

**Section 2 — Plant Info**
- **Plant Name** (required): text input, placeholder "e.g. 'Lola the Pothos'"
- **Plant Type** (optional): text input, placeholder "e.g. 'Pothos', 'Spider Plant'…"
- **Notes** (optional): `<textarea>`, 3 rows, placeholder "Any special notes about this plant…", `resize: vertical`

**Section 3 — AI Advice** (prominent placement between Plant Info and Care Schedule)
- Card with `background: #F0EDE6`, `border-radius: 12px`, `padding: 24px`
- Heading: "Get AI Care Advice" with a small sparkle/star icon
- Body: "Upload a photo or enter the plant type above, then let our AI recommend a care schedule."
- "Get AI Advice" secondary button (full width on mobile, auto-width on desktop) — opens AI Advice Modal (SPEC-006)
- Disabled state: if neither photo nor plant type is provided, button is disabled with tooltip on hover: "Add a photo or plant type first"

**Section 4 — Care Schedule**
- Section heading: "Care Schedule" (`font-size: 18px`, `font-weight: 600`)
- Three subsections, each togglable (the header has a toggle/chevron to expand/collapse):

  **Watering (required)**
  - Always expanded by default, cannot be collapsed
  - Frequency input: two linked fields — number input (1–365) + select dropdown ("days" / "weeks" / "months")
  - Combined display: "Every [N] [unit]" — e.g., "Every 7 days"
  - Last watered date: date picker (calendar icon, optional). Placeholder: "Set last watered date"
  - If left blank, app assumes today as last watered.

  **Fertilizing (optional)**
  - Collapsed by default, toggled open with "Add fertilizing schedule" label + `+` icon
  - Same frequency input as watering
  - Last fertilized date picker (optional)

  **Repotting (optional)**
  - Collapsed by default, toggled open with "Add repotting schedule" + `+` icon
  - Same frequency input
  - Last repotted date picker (optional)

**Form Actions (bottom)**
- Sticky on mobile (fixed bottom bar), inline on desktop
- Right-aligned: "Cancel" (ghost button, navigates back to inventory) + "Save Plant" (primary button)
- On mobile: both buttons full-width, stacked ("Save Plant" on top)

#### AI Advice Integration

When the user clicks "Get AI Advice":
1. AI Advice Modal opens (see SPEC-006)
2. If the user accepts AI advice in the modal, the modal closes and the following fields are auto-filled:
   - Plant Type (if AI identified the plant)
   - Watering frequency
   - Fertilizing frequency (if provided) — expands the fertilizing section
   - Repotting frequency (if provided) — expands the repotting section
3. Auto-filled fields get a subtle highlight: `background: rgba(92,122,92,0.08)`, `border-color: #5C7A5C` for 2 seconds, then fade to normal
4. A small "Filled by AI" badge (ghost, sage green, `font-size: 11px`) appears beneath each auto-filled field and persists until the user edits the field

#### States

| State | Behavior |
|-------|---------|
| **Default** | Empty form, AI advice button disabled |
| **Photo uploaded** | Preview in upload zone, AI advice enabled |
| **Plant type entered** | AI advice button enabled |
| **AI advice accepted** | Fields auto-populated with highlight |
| **Validation error** | Required fields highlighted red on submit attempt |
| **Saving** | Submit button shows spinner, form disabled |
| **Success** | Redirects to inventory, success toast: "[Plant Name] has been added! 🌱" |
| **Error (API)** | Error banner at top: "Something went wrong saving your plant. Try again." |

#### Validation

- Plant Name: required
- Watering frequency number: required, must be positive integer
- Watering frequency unit: required
- File size: max 5MB; if exceeded, show error inline: "Photo is too large (max 5MB)"
- File type: must be JPG/PNG/WebP; otherwise: "Unsupported file type. Use JPG or PNG."

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Max-width 720px centered, inline form actions |
| Tablet (768–1023px) | Same, slightly less padding |
| Mobile (<768px) | Full width, 16px horizontal padding, sticky bottom action bar |

#### Accessibility

- Photo upload zone: `role="button"`, `tabindex="0"`, `aria-label="Upload plant photo"`, keyboard-activatable (Enter/Space)
- All inputs have explicit labels
- Required fields marked with `aria-required="true"` and a visual `*` (asterisk) that is screen-reader-explained via a legend
- Date pickers: labeled, keyboard navigable
- Form error summary at top of form on submit failure: `role="alert"` listing what needs fixing
- Collapsible sections: use `<details>`/`<summary>` or equivalent with `aria-expanded`

---

### SPEC-004 — Edit Plant Screen

**Status:** Approved — Updated 2026-03-24 (FB-005: post-save redirect clarification)
**Related Tasks:** T-004 (Edit Plant UI)

#### Description

Identical in structure to the Add Plant screen (SPEC-003) but pre-populated with existing plant data. The user arrives here by clicking the edit (pencil) icon on a plant card or from the Plant Detail screen.

#### Route

`/plants/:id/edit`

#### Differences from Add Plant

1. Page title: "Edit [Plant Name]" (plant name interpolated into the Playfair Display heading)
2. All form fields pre-populated with saved values
3. If a photo exists, it is shown in the photo preview zone
4. The AI Advice card section is still present — user can get fresh AI advice and overwrite fields
5. Form Actions: "Cancel" (navigates back to Plant Detail page) + "Save Changes" (primary button)
6. The "Save Changes" button is disabled until the user makes at least one change (dirty state detection)

#### Post-Save Navigation

After a successful save, the app **redirects to `/plants/:id`** (the Plant Detail page for the edited plant) — **not** to `/` (the inventory).

> **Rationale:** Redirecting to the plant detail page lets the user immediately confirm their changes. Seeing the updated data in context is more useful than returning to the inventory list, which offers no immediate confirmation.

This supersedes any earlier spec language that described a redirect to the inventory root. The current implementation matches this updated behavior.

#### States

| State | Behavior |
|-------|---------|
| **Loading** | Skeleton form with shimmer loaders for each field |
| **Loaded** | Form pre-filled with current values |
| **Pristine (no changes)** | "Save Changes" button disabled, ghost styled |
| **Dirty (changes made)** | "Save Changes" button enabled |
| **Saving** | Button spinner, form disabled |
| **Success** | Redirect to `/plants/:id` (Plant Detail page for this plant), toast: "Changes saved." |
| **Error (load)** | "Couldn't load plant data. Refresh to try again." with retry |
| **Error (save)** | Error banner above form |
| **404** | "This plant wasn't found." with a button to return to inventory |

#### Responsive Behavior

Same as SPEC-003 (Add Plant Screen).

#### Accessibility

Same as SPEC-003, with added:
- Page title announced on load for screen readers
- Focus placed on the Plant Name input after the form loads

---

### SPEC-005 — Plant Detail Screen

**Status:** Approved
**Related Tasks:** T-005 (Plant Detail UI)

#### Description

The deep-dive view for a single plant. This is where users come to track their care progress, check upcoming care tasks, and mark care actions as completed. It is the most emotionally resonant screen — the "I watered my plant!" moment should feel genuinely satisfying, not perfunctory.

#### Route

`/plants/:id`

#### Layout

- App shell (sidebar + main)
- Main content: max-width 860px, centered
- Two-column layout on desktop (photo/summary left, schedule right)
- Single-column stacked layout on mobile

#### Header Section

Full-width band, `background: #FFFFFF`, `border-radius: 12px`, `padding: 32px`

- **Left column (desktop):**
  - Plant photo (`width: 240px`, `height: 240px`, `border-radius: 12px`, `object-fit: cover`)
  - If no photo: same placeholder as card view (leaf icon on `#E8F0E8` background)
- **Right column (desktop):**
  - Plant Name: Playfair Display, 36px, `#2C2C2C`
  - Plant Type: 16px, italic, `#6B6B5F`
  - Date added: "Added [Month Day, Year]", 13px, `#B0ADA5`
  - Notes section (if notes exist): label "Notes", then notes text in a soft bordered box `background: #F7F4EF`, `border-radius: 8px`, `padding: 12px 16px`
  - Action buttons row (right-aligned): "Edit" (secondary, pencil icon) + "Delete" (ghost/danger, trash icon)

#### Care Schedule Section

Section heading: "Care Schedule" (18px, font-weight 600)

Three care cards (watering, fertilizing, repotting). Show all three; if a schedule is not set, the card shows a disabled/muted "Not set" state with an "Add Schedule" link that navigates to the edit page.

**Care Card Layout (each):**
- `background: #FFFFFF`, `border-radius: 12px`, `padding: 24px`, `border: 1.5px solid #E0DDD6`
- Header row:
  - Left: Icon (water drop / leaf / pot icon) + care type label ("Watering", "Fertilizing", "Repotting"), `font-weight: 600`, 16px
  - Right: Status badge (see Design System Conventions)
- Frequency display: "Every [N] [unit]" — e.g., "Every 7 days", `font-size: 14px`, `color: #6B6B5F`
- Last done: "Last watered: [relative date]" — e.g., "Last watered: 5 days ago", `font-size: 13px`, `color: #6B6B5F`
- Next due: "Next due: [relative date or Today]" — `font-size: 13px`, `color: #6B6B5F`; "Today" is highlighted in `#C4921F` (status yellow)
- **Action button:** "Mark as done" — secondary button, full width of card, `height: 44px`

**"Mark as done" Interaction (the satisfying moment):**

This is the highest-priority UX in the entire app. It must feel genuinely good.

1. User clicks "Mark as done" (e.g., for watering)
2. Button shows a loading spinner for 300ms (fake or real API latency)
3. Confetti burst animation: 30–40 small colored particles (sage green, terracotta, warm yellow) erupt from the button and drift upward using CSS or a lightweight library (canvas-confetti)
4. Button transforms: background changes to `#E8F4EC`, text changes to a green checkmark + "Done! 🌿", border `#4A7C59`. Scale pulse: `scale(1.04)` then back to `scale(1.0)` via spring easing (0.4s).
5. The care card's status badge updates from red/yellow to green "On Track" with a fade-in transition
6. The "Last watered" text updates to "Just now"
7. "Mark as done" button changes to "Undo" (ghost, small, `font-size: 13px`) for 10 seconds — clicking Undo reverts the action
8. After 10 seconds (or on page navigation): Undo disappears, button returns to "Mark as done" in its normal state (since it's now on track)
9. A toast notification appears: "Great job! [Plant Name] has been watered. 🌱"

**Card — Not Set State:**
- `opacity: 0.6`, status badge "Not set"
- Frequency: "Schedule not configured"
- CTA: "Add Schedule →" link (no "Mark as done" button)

#### Recent Activity Section (optional MVP)

Below care cards, show the last 5 care actions as a timeline:
- Icon (water/leaf/pot) + "You watered [Plant Name]" + relative timestamp
- `font-size: 13px`, `color: #6B6B5F`
- If no history: small note "No care history yet."

#### States

| State | Behavior |
|-------|---------|
| **Loading** | Skeleton header + skeleton care cards with shimmer |
| **Loaded** | Full plant detail view |
| **Error (load)** | "Couldn't load plant details. Refresh to try again." |
| **404** | "This plant wasn't found." + button back to inventory |
| **Marking as done** | Button loading → confetti → success state |
| **Undoing** | Reverts care action, status badge updates back |

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Two-column header (photo left, info right); care cards in a 2-col grid (watering + fertilizing top row, repotting full width below if set) |
| Tablet (768–1023px) | Two-column header; care cards in 1-column stack |
| Mobile (<768px) | Single column: photo full-width (180px height), info below, care cards stacked |

#### Accessibility

- Care cards: `role="region"`, `aria-label="[Care type] schedule"`
- "Mark as done" button: `aria-label="Mark watering as done for [Plant Name]"`
- After marking done: `aria-live="polite"` region announces "Watering marked as done for [Plant Name]"
- Confetti: `prefers-reduced-motion` media query — if reduced motion preferred, skip animation, show only the status update
- Undo timer: screen readers announce "Undo available for 10 seconds" via live region

---

### SPEC-006 — AI Advice Modal

**Status:** Approved
**Related Tasks:** T-006 (AI Advice UI)

#### Description

A modal overlay triggered from the Add Plant or Edit Plant screen. It gives users a way to identify their plant and get care recommendations from the Gemini AI. It covers the two key flows: uploading a photo for visual plant ID, or typing the plant name for text-based advice.

#### Trigger

- "Get AI Advice" button on Add/Edit Plant screen
- Opens as an overlay modal on top of the form

#### Modal Layout

- Backdrop: `rgba(44,44,44,0.45)`, click outside to dismiss
- Modal card: `width: 560px` (desktop), `max-width: calc(100vw - 32px)` (mobile), `border-radius: 16px`, `background: #FFFFFF`, `padding: 32px`
- Max height: `85vh`, with internal scrolling if content overflows
- Close button (X icon) top-right corner, `aria-label="Close AI advice panel"`

#### Modal States & Content

**State 1 — Input (default)**

Header: "Get AI Care Advice" with a small sparkle icon, `font-size: 20px`, `font-weight: 600`

Sub-heading: "Tell us about your plant and we'll recommend the best care routine."

Two input options (tabbed or stacked, both visible simultaneously):

- **Option A — Upload a Photo:**
  - Mini upload zone (`height: 140px`, same dashed style as main form)
  - Shows photo preview if a photo was already uploaded on the parent form (pre-populate)
  - Caption: "We'll identify your plant from the photo."

- **Option B — Enter Plant Type:**
  - Text input, full width, placeholder "e.g. 'Spider Plant', 'Fiddle Leaf Fig'…"
  - Caption: "Know what it is? Just type the name."

- **Divider** between options: horizontal rule with "or" in center

- **"Get Advice" button** (primary, full width, `height: 48px`)
  - Disabled until at least one input is provided
  - Label: "Get AI Advice" with sparkle icon

**State 2 — Loading**

- Centered spinner (sage green, 40px)
- Animated text cycles through (fade in/out, 1.5s each):
  - "Identifying your plant…"
  - "Analyzing care needs…"
  - "Generating advice…"
- Cancel link below: "Cancel" (ghost)

**State 3 — Results**

Layout: identified plant banner + care advice cards + action buttons

- **Plant ID Banner** (if photo was used):
  - `background: #F0EDE6`, `border-radius: 8px`, `padding: 12px 16px`
  - "We think this is a **[Plant Name]**" with confidence note if applicable
  - Small italic note: "AI identification may not be 100% accurate."

- **Care Advice Grid:**
  Individual advice cards for each care dimension in a 2-column grid (1-column on mobile):
  - 💧 Watering — "Every [N] days/weeks"
  - 🌱 Fertilizing — "Every [N] months" (or "Not needed for this plant type")
  - 🪴 Repotting — "Every [N] years"
  - ☀️ Light — "Bright indirect light" (display only, no form field)
  - 💧 Humidity — "Moderate humidity" (display only)
  - Additional tips as free-text under "Care Tips" heading

  Each card: `background: #F7F4EF`, `border-radius: 8px`, `padding: 16px`, icon + label + value

- **Action Buttons Row (bottom, sticky in modal):**
  - "Accept & Fill Form" (primary, full width) — auto-fills the parent Add/Edit form and closes modal
  - "Start Over" (ghost) — returns to State 1

**State 4 — Error**

- Error icon (warm orange warning)
- Heading: "Couldn't get advice right now"
- Body: "There was a problem connecting to our AI. Please try again." (specific error copy per scenario)
- "Try Again" button (secondary) + "Close" (ghost)

#### Scenarios & Copy

| Scenario | Copy |
|---------|------|
| Network error | "Check your internet connection and try again." |
| AI API error | "Our AI is temporarily unavailable. Try again in a moment." |
| Unidentifiable plant (photo) | "We couldn't identify the plant from this photo. Try a clearer photo or enter the plant type manually." |
| Empty query | Button disabled — no error shown |

#### Acceptance Flow (on "Accept & Fill Form")

Fields that get auto-filled in the parent form:
- Plant Type (if identified by AI and field is empty)
- Watering: frequency number + unit
- Fertilizing: frequency (expands the collapsible section if collapsed)
- Repotting: frequency (expands the collapsible section if collapsed)

Fields that are NOT auto-filled:
- Plant Name (user must name their own plant)
- Photo (user's photo remains or is not set)
- Notes (user's own notes)

#### Rejection Flow (on "Start Over" or backdrop click)

- Modal returns to State 1 (or closes entirely if user clicks backdrop)
- Parent form is unchanged — no data loss

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | 560px centered modal |
| Mobile (<768px) | Bottom sheet style: slides up from bottom, full width, `border-radius: 16px 16px 0 0`, `min-height: 60vh` |

#### Accessibility

- Modal uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal heading
- Focus trapped inside modal when open
- On open: focus moves to first interactive element (input or close button)
- On close: focus returns to the "Get AI Advice" button that triggered it
- Loading state: `aria-busy="true"`, `aria-label="Loading AI advice"` on the spinner container
- Results announced via `aria-live="polite"` region: "AI advice received for [Plant Name]"
- Escape key closes modal

---

### SPEC-007 — Profile Page

**Status:** Approved
**Related Tasks:** T-007 (Profile UI)

#### Description

A simple, warm page that celebrates the user. It shows their identity and their plant guardianship stats. This page should feel like a quiet moment of pride — not a settings dashboard.

#### Route

`/profile`

#### Layout

- App shell (sidebar + main)
- Main content: max-width 640px, centered
- Page title: "My Profile" (Playfair Display, 32px)

#### Profile Card (top)

Full-width card, `background: #FFFFFF`, `border-radius: 12px`, `padding: 32px`

- **Avatar:**
  - Circle, 88px × 88px
  - If user has no photo (Sprint 1): show initials (first + last initial) on `#5C7A5C` background, `color: #FFFFFF`, Playfair Display, 36px
  - Future: editable by clicking

- **User Details:**
  - Full Name: `font-size: 24px`, `font-weight: 600`, Playfair Display
  - Email: `font-size: 14px`, `color: #6B6B5F`
  - Member since: "Guardian since [Month Year]" — `font-size: 13px`, `color: #B0ADA5`, leaf icon before text

#### Stats Section

Three stat tiles displayed in a row (3-column grid on desktop, 1-column stack on mobile):

| Stat | Label | Icon |
|------|-------|------|
| Total plants currently owned | "Plants in care" | 🌿 |
| Days as a member | "Days as a Guardian" | 📅 |
| Total care actions completed (watering + fertilizing + repotting) | "Care actions completed" | ✅ |

Each tile: `background: #F7F4EF`, `border-radius: 12px`, `padding: 24px`, centered content:
- Icon (32px)
- Number (`font-size: 40px`, `font-weight: 600`, `color: #5C7A5C`, Playfair Display)
- Label (`font-size: 13px`, `color: #6B6B5F`, `text-align: center`)

#### Account Actions Section

Below stats, a simple actions card:

- "Log Out" button (secondary, full-width on mobile, auto-width on desktop)
- "Delete Account" link (ghost danger, `color: #B85C38`, small, below logout) — out of scope for Sprint 1, show as disabled/coming soon link

#### States

| State | Behavior |
|-------|---------|
| **Loading** | Skeleton avatar, skeleton name, skeleton stat tiles |
| **Loaded** | Full profile content |
| **Error (load)** | "Couldn't load your profile. Refresh to try again." |
| **Logging out** | Logout button shows spinner, redirects to `/login` on success |

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Profile card with inline avatar + details; 3-column stat grid |
| Tablet (768–1023px) | Same layout, slightly reduced padding |
| Mobile (<768px) | Avatar centered above details; stats stacked vertically; all full-width |

#### Accessibility

- Avatar: `role="img"`, `aria-label="[User Name] profile picture"` (or "Initials avatar" if initials)
- Stat tiles: `role="figure"` with `aria-label="[Number] [Label]"` so screen readers announce the full stat
- Logout: confirm step not required (not destructive), but redirect should be announced
- Color contrast on all text elements: WCAG AA

---

## Design Notes for Frontend Engineer

### Animation Library Recommendation
Use `canvas-confetti` (lightweight, ~4KB) for the "Mark as done" confetti burst on the Plant Detail screen. Import dynamically to avoid bundle bloat.

### Icon Library Recommendation
Use **Phosphor Icons** (`phosphor-react`): outlined style, consistent with Japandi minimal aesthetic. Key icons needed:
- `Plant`, `Drop`, `Leaf`, `PottedPlant` — plant/care icons
- `PencilSimple`, `TrashSimple` — CRUD actions
- `Sparkle` — AI advice
- `CheckCircle`, `X`, `CaretDown`, `CaretUp` — UI controls
- `User`, `SignOut` — profile

### Font Loading
Both fonts from Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@600&display=swap" rel="stylesheet">
```

### Toast Notifications
Use a top-right positioned toast stack. Toasts auto-dismiss after 4 seconds. Style: `background: #2C2C2C`, `color: #FFFFFF`, `border-radius: 8px`, `padding: 12px 20px`, with a colored left border (green for success, red for error).

### Reduced Motion
Wrap all animations in `@media (prefers-reduced-motion: reduce)` checks. For confetti, skip the particle animation but still update the UI state (badge, text) immediately.
