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

**Status:** Approved — Updated 2026-03-25 (T-027: redirect-to-detail behavior confirmed, documented, and approved; Sprint 6)
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

**Status:** Approved — Updated 2026-04-01 (T-070: Delete Account modal updated with password confirmation field, CSS custom properties, and full error-state handling; Sprint 16)
**Related Tasks:** T-007 (Profile UI), T-034 (Delete Account UI), T-070 (Delete Account implementation)

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

Below stats, a simple actions card. `background: #FFFFFF`, `border-radius: 12px`, `padding: 24px`, `border: 1.5px solid #E0DDD6`.

- **"Log Out" button** — Secondary variant, `min-width: 140px`, full-width on mobile, auto-width on desktop. Clicking logs the user out, clears tokens, and redirects to `/login`.
- **"Delete Account" button** — Ghost Danger variant (`color: #B85C38`, no background, no border), `font-size: 13px`, positioned below the Log Out button with `margin-top: 16px`. Clicking opens the Delete Account Confirmation Modal.

> **Layout:** Both actions are left-aligned on desktop (inside the card). On mobile, both buttons stretch to full width and stack vertically.

#### Delete Account Confirmation Modal

> **Sprint 16 note (T-070):** This spec supersedes the Sprint 6 placeholder. The modal was previously shown as "coming soon." It is now fully specced for implementation in `DeleteAccountModal.jsx`. The key change from the original spec is the addition of a **password confirmation field** — the API requires `{ "password": "string" }` in the request body to prevent accidental deletion.

Triggered by clicking the "Delete Account" button on the Profile page. Implemented as a separate `DeleteAccountModal.jsx` component imported and rendered by `ProfilePage.jsx`.

**Overlay:** `position: fixed`, full viewport, `background: var(--color-overlay)`, `z-index: 1000`. Clicking the backdrop does **not** dismiss the modal (destructive action — explicit Cancel is required).

**Modal Container:** Centered horizontally and vertically via CSS flexbox on the overlay. `max-width: 480px`, `width: calc(100% - 32px)` on mobile, `padding: 32px`, `border-radius: 12px`, `background: var(--color-modal)`, `box-shadow: 0 8px 32px rgba(0,0,0,0.3)`.

> **Dark mode requirement:** The modal must use CSS custom properties (`var(--color-*)`) throughout — no hardcoded hex color values anywhere in `DeleteAccountModal.jsx`. This ensures automatic light/dark mode compatibility without conditional logic.

**Modal Content (top to bottom):**

1. **Warning Icon:** Phosphor `WarningOctagon` icon, 36px, `color: var(--color-status-red)`, centered, `margin-bottom: 16px`.

2. **Heading:** "Delete your account?" — Playfair Display, 24px, `font-weight: 600`, `color: var(--color-text-primary)`, `text-align: center`. Must have `id="delete-modal-heading"` so the overlay's `aria-labelledby` can point to it.

3. **Body copy:** "This will permanently delete your account and all your plant data. This cannot be undone." — DM Sans, 15px, `color: var(--color-text-secondary)`, `text-align: center`, `line-height: 1.6`, `margin-top: 12px`. Must have `id="delete-modal-desc"` so the overlay's `aria-describedby` can point to it.

4. **Password input field:** `margin-top: 20px`. Full width within the modal padding.
   - **Label:** "Confirm your password" — displayed above the input as a `<label>`. `font-size: 14px`, `font-weight: 500`, `color: var(--color-text-primary)`, `display: block`, `margin-bottom: 6px`.
   - **Input:** `type="password"`, `name="password"`, `autocomplete="current-password"`, `placeholder="Enter your password"`, full width (`width: 100%`), `height: 44px`, `border: 1.5px solid var(--color-border)`, `border-radius: 8px`, `background: var(--color-surface)`, `color: var(--color-text-primary)`, `padding: 0 44px 0 14px` (right padding makes room for the visibility toggle), `font-size: 15px`.
   - **Focus state:** `border-color: var(--color-border-focus)`, `box-shadow: 0 0 0 3px rgba(92, 122, 92, 0.15)`, `outline: none`.
   - **Error state** (when inline error is shown): `border-color: var(--color-status-red)`.
   - **Password visibility toggle:** Right-side absolute-positioned icon button inside the input wrapper. Phosphor `Eye` (show) / `EyeSlash` (hide), 18px, `color: var(--color-text-secondary)`. `position: absolute`, `right: 12px`, `top: 50%`, `transform: translateY(-50%)`. Clicking toggles input `type` between `"password"` and `"text"`. `aria-label="Show password"` / `"Hide password"` toggled to match current state.

5. **Inline password error (conditional):** Rendered directly below the password input when the API returns `400 INVALID_PASSWORD`. Hidden when there is no password error.
   - `color: var(--color-status-red)`, `font-size: 13px`, `margin-top: 6px`, `display: block`.
   - Content: "Password is incorrect."
   - Must use `role="alert"` so screen readers announce it immediately on appearance. Link to the password input via `aria-describedby` on the `<input>` pointing to this element's ID when it is visible.

6. **Generic error message (conditional):** Shown when a non-400 error occurs (network failure, 5xx). Hidden otherwise.
   - `color: var(--color-status-red)`, `font-size: 13px`, `text-align: center`, `margin-top: 12px`, `background: var(--color-status-red-bg)`, `border-radius: 8px`, `padding: 8px 16px`.
   - Content: "Something went wrong. Please try again."
   - Must use `role="alert"` so screen readers announce it on appearance.

7. **Button row:** `margin-top: 24px`, `display: flex`, `gap: 12px`, `justify-content: center`.
   - **"Cancel"** — Secondary button variant, `min-width: 120px`. Dismisses modal immediately; clears the password field value; no API call is made; focus returns to the "Delete Account" trigger button on the Profile page.
   - **"Delete my account"** — Danger button variant (`background: var(--color-status-red)`, `color: #FFFFFF`), `min-width: 160px`. Disabled when the password input is empty (use `disabled` attribute). Triggers the deletion flow on click.

**Mobile button layout:** Buttons stack vertically at full width — "Cancel" on top, "Delete my account" below. This ordering is intentional: the safer action (Cancel) is in the thumb-friendly top position, reducing accidental deletion on touch devices.

**Keyboard Behavior:**
- `Escape` key → same as clicking "Cancel": dismisses modal, clears password field, no API call.
- Tab order within the modal (focus trap — no tab escape to the page behind): Password input → visibility toggle → Cancel button → "Delete my account" button → (wraps back to Password input).
- **Default focus on open:** Password input field. This is the natural starting point since the user must enter their password to proceed.

#### Deletion Flow

1. User enters their password in the password input and clicks "Delete my account."
2. "Delete my account" button immediately shows a loading spinner (`border: 2px solid rgba(255,255,255,0.4)`, spinning arc `rgba(255,255,255,1)`, 16px diameter, `animation: spin 0.8s linear infinite`). Button text is visually hidden but the button retains `aria-label="Deleting account, please wait"`. Both buttons are disabled. Password input is disabled. No close affordance is shown — the user must wait.
3. Frontend calls `DELETE /api/v1/account` with:
   - `Authorization: Bearer <access-token>` header
   - Request body: `{ "password": "<entered password>" }`
   - `Content-Type: application/json`
4. **On success (204 No Content):**
   - Clear access token and refresh token from memory.
   - Clear all cached user/auth state.
   - Navigate to `/login`.
   - Show toast notification (Danger/error variant, top-right, 4-second auto-dismiss): "Your account has been deleted."
5. **On wrong password (400 INVALID_PASSWORD):**
   - Remove spinner; re-enable both buttons; re-enable and re-focus the password input.
   - Show the **inline password error** (item 5 above): "Password is incorrect."
   - Do **not** close the modal. Do **not** clear the password field (user may just have a typo to correct).
   - Do **not** show a toast — the inline error is sufficient feedback.
6. **On other errors (network failure, 5xx, unexpected 4xx):**
   - Remove spinner; re-enable both buttons; re-enable the password input.
   - Show the **generic error message** (item 6 above): "Something went wrong. Please try again."
   - Do **not** close the modal. Do **not** show an error toast.
7. **On 401 (auth expired while modal is open):**
   - Show generic error with message: "Session expired. Please log in again."
   - After 2 seconds, redirect to `/login`.

#### States

| State | Behavior |
|-------|---------|
| **Loading (page)** | Skeleton avatar, skeleton name, skeleton stat tiles |
| **Loaded** | Full profile content visible; "Delete Account" button enabled |
| **Error (page load)** | "Couldn't load your profile. Refresh to try again." |
| **Logging out** | Logout button shows spinner; redirects to `/login` on success |
| **Modal open** | Confirmation modal overlaid; page behind is non-interactive; password input focused |
| **Deleting** | Modal stays open; "Delete my account" shows spinner; both buttons + password input disabled; no close |
| **Delete success** | Redirected to `/login`; Danger toast "Your account has been deleted." displayed |
| **Delete — wrong password** | Modal stays open; inline error "Password is incorrect." under password input; spinner removed; password input re-focused |
| **Delete — server error** | Modal stays open; generic error message shown below password area; spinner removed; buttons re-enabled |
| **Delete — session expired** | Generic error "Session expired. Please log in again."; redirect to `/login` after 2 seconds |

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Profile card with inline avatar + details; 3-column stat grid; actions left-aligned |
| Tablet (768–1023px) | Same layout, slightly reduced padding |
| Mobile (<768px) | Avatar centered above details; stats stacked vertically; all full-width; modal buttons stacked |

#### Accessibility

- Avatar: `role="img"`, `aria-label="[User Name] profile picture"` (or "Initials avatar" if initials)
- Stat tiles: `role="figure"` with `aria-label="[Number] [Label]"` so screen readers announce the full stat
- Logout button: no confirm step required (not destructive); redirect should be announced via live region
- "Delete Account" button: `aria-label="Delete account"`, `aria-haspopup="dialog"`
- **Modal overlay:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="delete-modal-heading"`, `aria-describedby="delete-modal-desc"`
- **Focus trap:** Keyboard focus is constrained within the modal while open (Tab cycles: password input → visibility toggle → Cancel → Delete button → wraps). On close (Cancel, Escape, or success redirect), focus returns to the "Delete Account" trigger button on the profile page.
- **Default focus on open:** Password `<input>` element receives focus automatically via `autoFocus` or a `useEffect` ref.
- **Password input:** `id` set so `<label>` can associate via `htmlFor`. When inline error is visible, `aria-describedby` is updated to include the error element's `id`.
- **Inline errors:** Both error elements (`role="alert"`) announce to screen readers immediately when they appear; they are conditionally rendered (not just `visibility: hidden`) to prevent phantom announcements.
- **"Delete my account" in loading state:** `aria-busy="true"`, `aria-label="Deleting account, please wait"` while spinner is shown; `disabled` attribute prevents double-submission.
- **Password visibility toggle:** `aria-label` updated in sync with toggle state: `"Show password"` when masked, `"Hide password"` when revealed.
- Color contrast: all text elements meet WCAG AA minimum (4.5:1). Verified against `--color-modal` background in both light (`#FFFFFF`) and dark (`#2C2A26`) modes.

---

### SPEC-008 — Care History Page

**Status:** Approved — 2026-03-25 (T-038: Care History page spec, Sprint 7)
**Related Tasks:** T-040 (Care History Frontend), T-039 (Care History API)

#### Description

The Care History page gives users a complete, chronological log of every care action they've performed across all their plants. This screen reinforces the habit-forming core of Plant Guardians — seeing a growing list of care actions builds a sense of accomplishment and motivates continued engagement. Think of it as the user's personal "plant diary."

**User goal:** "I want to see everything I've done for my plants and how recently I've been caring for each one."

#### Route

`/history`

#### Navigation Entry Points

- **Primary:** Sidebar navigation — add a new "History" item between "My Plants" and "Profile". Icon: Phosphor `ClockCounterClockwise` (outlined), 20px. Label: "History". Same styling as other sidebar nav items.
- **Secondary:** Profile page — add a text link "View care history →" (DM Sans, 13px, `color: #5C7A5C`) in the Account Actions section, positioned above the "Log Out" button row with a `margin-bottom: 16px` divider.

Both entry points are required. Users should be able to reach the history page from the sidebar on any screen, and from their profile as a natural extension of reviewing their stats.

#### Layout

App shell (persistent sidebar + main content area), consistent with all other authenticated screens.

**Main content:**
- `max-width: 720px`, horizontally centered
- `padding: 40px 32px` (desktop), `padding: 24px 16px` (mobile)

**Page Header (top of main content):**
- Page title: "Care History" — Playfair Display, 32px, `font-weight: 600`, `color: #2C2C2C`, `margin-bottom: 8px`
- Subtitle: "A record of every care action you've taken for your plants." — DM Sans, 14px, `color: #6B6B5F`, `margin-bottom: 24px`

**Filter Bar (immediately below header):**
- A single "Filter by plant" dropdown control
- Layout: `display: flex`, `align-items: center`, `gap: 8px`
- Label: `<label>` "Filter by plant:" — DM Sans, 13px, `color: #6B6B5F`, `white-space: nowrap`
- `<select>` dropdown:
  - Default option: "All plants"
  - Additional options: one per user-owned plant, sorted A–Z by plant name, displaying plant name only
  - Style: `background: #FFFFFF`, `border: 1.5px solid #E0DDD6`, `border-radius: 8px`, `padding: 8px 32px 8px 12px` (right padding for chevron), `font-size: 14px`, `color: #2C2C2C`, `min-width: 200px`, `cursor: pointer`
  - Focus state: `border-color: #5C7A5C`, `outline: 2px solid rgba(92,122,92,0.2)`, `outline-offset: 2px`
- Position: right-aligned on desktop (filter bar sits on same row as a result count, separated by flexbox `justify-content: space-between`); full-width on mobile (stacked below subtitle)
- On filter change: re-fetch list data with the selected `plant_id`. If "All plants" is selected, fetch without a filter.

**Result Count (inline with filter bar, left side):**
- When loaded and not in the loading/error/empty state: "X actions" — DM Sans, 13px, `color: #B0ADA5`
- When a filter is active: "X actions for [Plant Name]"
- Hidden during loading

**Care Action List:**
- `margin-top: 16px`
- Vertical list of care action items, sorted most-recent-first
- Between items: `border-top: 1px solid #E0DDD6` (divider)
- No divider before the first item or after the last

#### Care Action List Item Anatomy

Each item is a flex row: `padding: 16px 0`, `display: flex`, `align-items: center`, `gap: 16px`.

**1. Care Type Icon (left, fixed width):**
- Circular container: `width: 44px`, `height: 44px`, `border-radius: 50%`, `flex-shrink: 0`, centered icon
- Color coding by care type:

  | Care Type | Phosphor Icon | Background | Icon Color |
  |-----------|--------------|------------|------------|
  | `watering` | `Drop` | `#EBF4F7` | `#5B8FA8` (calm blue) |
  | `fertilizing` | `Leaf` | `#E8F4EC` | `#4A7C59` (sage green) |
  | `repotting` | `PottedPlant` | `#F4EDE8` | `#A67C5B` (terracotta) |

- Icon size: 20px, Phosphor outlined weight
- Icon is decorative — `aria-hidden="true"` (care type text provides the label)

**2. Plant Info (center, grows to fill remaining space):**
- `flex: 1`, `min-width: 0` (allows text truncation)
- Line 1 — Plant name: DM Sans, 15px, `font-weight: 500`, `color: #2C2C2C`. Single line, truncate with ellipsis: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- Line 2 — Action label: DM Sans, 13px, `color: #6B6B5F`. Human-readable past tense:
  - `watering` → "Watered"
  - `fertilizing` → "Fertilized"
  - `repotting` → "Repotted"
- `margin-top: 2px` between the two lines

**3. Relative Timestamp (right, fixed width):**
- `flex-shrink: 0`, `text-align: right`
- DM Sans, 13px, `color: #6B6B5F`
- Format rules (from most recent to oldest):
  - < 1 minute ago → "Just now"
  - 1–59 minutes ago → "X minutes ago" (e.g., "12 minutes ago")
  - 1–47 hours ago → "X hours ago" (e.g., "3 hours ago")
  - 2–13 days ago → "X days ago" (e.g., "5 days ago")
  - 2–7 weeks ago → "X weeks ago" (e.g., "2 weeks ago")
  - 2–11 months ago → "X months ago" (e.g., "3 months ago")
  - 1+ years ago → "X years ago" (e.g., "1 year ago")
- `title` attribute: full human-readable datetime, e.g. `"March 20, 2026 at 2:14 PM"`
- `aria-label`: "Performed on March 20, 2026 at 2:14 PM" (for screen readers)

#### States

**Loading State:**

- Show 6 skeleton placeholder rows immediately on mount while data fetches
- Each skeleton row mirrors the anatomy of a real list item:
  - Left: circular shimmer `width: 44px`, `height: 44px`, `border-radius: 50%`
  - Center, line 1: shimmer block `width: 35–50%` (randomized per row for natural feel), `height: 14px`, `border-radius: 4px`
  - Center, line 2: shimmer block `width: 20–30%`, `height: 12px`, `border-radius: 4px`, `margin-top: 6px`
  - Right: shimmer block `width: 72px`, `height: 12px`, `border-radius: 4px`
- Shimmer animation: `background: linear-gradient(90deg, #F0EDE6 25%, #E8E4DC 50%, #F0EDE6 75%)`, `background-size: 200% 100%`, keyframe `shimmer` slides the gradient horizontally, `animation: shimmer 1.4s ease-in-out infinite`
- Filter dropdown: rendered but `disabled`, `opacity: 0.5`
- Result count: hidden
- Wrapper element: `aria-busy="true"`, `aria-label="Loading care history"`

**Empty State (zero care actions, "All plants" filter):**

- Centered content block: `text-align: center`, `padding: 64px 24px`
- Illustration: a small SVG or emoji-style botanical motif (e.g., a sprout with water drops), approx 100px × 100px, using brand palette (`#5C7A5C`, `#A67C5B`, `#E0DDD6`). Keep it light and encouraging, not alarming.
- Heading: "No care actions yet." — Playfair Display, 22px, `font-weight: 600`, `color: #2C2C2C`, `margin-top: 24px`
- Body: "Start by marking a plant as watered!" — DM Sans, 14px, `color: #6B6B5F`, `margin-top: 8px`, `line-height: 1.6`
- CTA: "Go to my plants" — Primary button, `margin-top: 24px`, navigates to `/`

**Filtered Empty State (filter active, no matching results):**

- Same layout as empty state
- No illustration needed (filter-specific context is sufficient)
- Heading: "No actions for this plant yet." — Playfair Display, 20px, `color: #2C2C2C`
- Body: "Try a different plant, or head to its page to mark a care action." — DM Sans, 14px, `color: #6B6B5F`
- CTA: "Clear filter" — Ghost button, resets dropdown to "All plants" and re-fetches

**Error State:**

- Same centered layout as empty state
- Icon: Phosphor `WarningCircle`, 48px, `color: #B85C38`
- Heading: "Couldn't load your care history." — Playfair Display, 20px, `color: #2C2C2C`
- Body: "Something went wrong. Please try again." — DM Sans, 14px, `color: #6B6B5F`
- CTA: "Try again" — Secondary button, triggers a re-fetch of the data. `aria-label="Retry loading care history"`

Trigger: any non-200 API response or network failure on the initial load or filter change.

**Loaded / Populated State:**

- Filter dropdown fully populated with plant options
- Result count displayed
- Care action list rendered, sorted most-recent-first
- "Load more" button appears below the list if `pagination.total > pagination.limit * pagination.page` (more pages exist)

#### Pagination / Load More

- Initial fetch: page 1, limit 20
- If the total exceeds the loaded count, show a "Load more" button below the list:
  - Label: "Load more (N remaining)" where N = `pagination.total - currently loaded count`
  - Style: Ghost button, centered, `margin-top: 24px`
  - On click: fetch next page, **append** results to the existing list (no scroll reset, no full reload)
  - While loading additional items: button shows a 16px inline spinner, `disabled`
  - When all items are loaded: button disappears with no visible indication (or optionally "All actions loaded" in `color: #B0ADA5`, `font-size: 12px`, centered)
- When a filter changes: reset to page 1, clear the list, re-fetch

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Sidebar visible; max-width 720px centered; filter bar inline (result count left, dropdown right); full item anatomy |
| Tablet (768–1023px) | Sidebar may collapse to icon rail; main content same; item anatomy unchanged |
| Mobile (<768px) | No sidebar (hamburger or bottom nav per app shell pattern); 16px horizontal padding; filter bar full-width below subtitle; result count above filter; plant name truncates aggressively; timestamps may abbreviate to compact form, e.g., "2d ago", "1h ago", "Just now" |

**Compact timestamp format (mobile only):**
- < 1 min → "Just now"
- < 60 min → "[N]m ago"
- < 48 hr → "[N]h ago"
- < 14 days → "[N]d ago"
- < 8 weeks → "[N]w ago"
- else → "[N]mo ago" / "[N]y ago"

#### API Integration

Endpoint: `GET /api/v1/care-actions` (see T-039 and `api-contracts.md`)

| Query Param | Type | Description |
|------------|------|-------------|
| `plant_id` | UUID (optional) | Filter to a specific plant. Omit for all plants. |
| `page` | integer (default 1) | Page number for load-more pagination |
| `limit` | integer (default 20) | Items per page |

**Response shape** (per T-039):
```json
{
  "data": [
    {
      "id": "uuid",
      "plant_id": "uuid",
      "plant_name": "string",
      "care_type": "watering | fertilizing | repotting",
      "performed_at": "ISO 8601 datetime string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47
  }
}
```

**Filter dropdown population:** Populate the dropdown from `GET /api/v1/plants` (the existing plants-list endpoint), fetched in parallel with the initial care-actions request on mount. This ensures all plants appear in the dropdown even if they have no care history yet. Map plant `id` → `name` for the dropdown options.

**Re-fetch triggers:**
- On initial mount
- On filter dropdown change
- On "Load more" click (append mode, no state reset)
- On "Try again" click after error

#### Accessibility

- **Page landmark:** `<main>` wraps the content area; `<h1>` for "Care History"
- **Filter label:** `<label for="plant-filter">Filter by plant</label>` + `<select id="plant-filter">`. On filter change: announce results via `aria-live="polite"` region: "Showing [N] care actions" or "Showing [N] actions for [Plant Name]"
- **List structure:** Semantic `<ul>` / `<li>` for the care action list
- **Each list item `aria-label`:** Combined accessible label, e.g., "Watered Monstera, 5 days ago" — either via `aria-label` on the `<li>` or via the visible text content
- **Icons:** `aria-hidden="true"` on all care-type icons (decorative; care type label provides the text)
- **Timestamps:** `title="[Full date]"` for tooltip; inner `<time>` element with `datetime="[ISO string]"` for semantic markup and screen reader access
- **Loading state:** `aria-busy="true"` on the list wrapper; `role="status"` on an `aria-live` region that announces "Loading care history..." while fetching
- **Empty state CTA:** Standard button/link; no special ARIA needed beyond the label
- **Error retry:** `aria-label="Retry loading care history"` on the retry button
- **Load more:** `aria-label="Load [N] more care actions"`
- **Keyboard:** All interactive elements reachable by Tab; dropdown operable via arrow keys (native `<select>` behavior); Load more operable via Enter/Space
- **Color contrast:** All text meets WCAG AA (4.5:1 for body text, 3:1 for large text/icons)
- **Focus management:** When filter changes, focus stays on the dropdown (no forced refocus); when load more appends items, focus stays on the Load more button (not moved to new items)

---

### SPEC-009 — Care Due Dashboard

**Status:** Approved — 2026-03-27
**Related Tasks:** T-042 (this spec), T-044 (Frontend implementation)

#### Description

The Care Due Dashboard is a proactive, urgency-sorted view at `/due` that gives plant owners an at-a-glance answer to the question: "What does my garden need from me right now?" It replaces the need to scroll through the entire inventory to discover overdue care — instead, all actionable items surface in one focused place, sorted by urgency into three clearly labeled sections.

**User goal:** "I want to know immediately which plants need care today, which ones I've already let slip, and which ones are coming up in the next week — without opening each plant one by one."

This screen directly fulfills the project brief's core promise of "painfully obvious reminders" for novice plant owners. The design leans into urgency signals (color, iconography, section headings) while remaining calm and uncluttered in the Japandi style.

#### Route

`/due`

#### Navigation Entry Point

- **Sidebar:** Add a new "Care Due" nav item to the persistent sidebar, positioned **between "My Plants" and "History"**.
  - Icon: Phosphor `BellSimple` (outlined), 20px
  - Label: "Care Due"
  - **Badge:** A pill badge to the right of the label showing the total count of overdue + due-today items. Badge style: `background: #B85C38`, `color: #FFFFFF`, `font-size: 11px`, `font-weight: 600`, `padding: 2px 7px`, `border-radius: 24px`, `min-width: 18px`, `text-align: center`
  - When the overdue + due-today count = 0, the badge **disappears entirely** (no "0" badge shown)
  - When the count ≥ 100, display "99+" in the badge
  - The badge count is derived from the same `GET /api/v1/care-due` response that powers the page; fetch it on app shell mount (or on navigation to /due) so it's visible from any screen
  - Active state (current page): left border `3px solid #5C7A5C`, background `#F0EDE6`, text `#2C2C2C`
  - Inactive: no border, background transparent, text `#6B6B5F`

#### Layout

App shell (persistent sidebar + main content area), consistent with all authenticated screens.

**Main content area:**
- `max-width: 800px`, horizontally centered
- `padding: 40px 32px` (desktop), `padding: 24px 16px` (mobile)

**Page Header:**
- Page title: "Care Due" — Playfair Display, 32px, `font-weight: 600`, `color: #2C2C2C`, `margin-bottom: 8px`
- Subtitle: "Plants that need your attention, sorted by urgency." — DM Sans, 14px, `color: #6B6B5F`, `margin-bottom: 32px`

**Three Urgency Sections (rendered in this order, top to bottom):**

1. **Overdue** — Plants whose care is past due (next_due date is in the past)
2. **Due Today** — Plants whose care is due today
3. **Coming Up** — Plants whose care is due within the next 7 days (not today)

Each section is only rendered if it has items. If a section is empty, it is **replaced by its per-section empty state** (see States section below). If all three sections are empty, the entire page shows the **global all-clear state** instead of any sections.

**Section Anatomy:**

Each section contains:
1. **Section Header Row** — `display: flex`, `align-items: center`, `gap: 10px`, `margin-bottom: 16px`
   - Section icon (16px, Phosphor outlined): `WarningCircle` for Overdue (color: `#B85C38`), `Clock` for Due Today (color: `#C4921F`), `CalendarBlank` for Coming Up (color: `#5C7A5C`)
   - Section title — DM Sans, 13px, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.08em`
     - Overdue: `color: #B85C38`
     - Due Today: `color: #C4921F`
     - Coming Up: `color: #5C7A5C`
   - Count pill — same pill component as status badges: pill `background: #FAEAE4` (overdue), `#FDF4E3` (due today), `#E8F4EC` (coming up), text color matches section color, `font-size: 11px`, `font-weight: 600`, `padding: 2px 8px`, `border-radius: 24px`
2. **Item List** — vertical stack of care-due item cards
3. **Section divider** — `margin-bottom: 32px` below each section's last card before the next section header. No horizontal rule needed.

#### Care-Due Item Card Anatomy

Each care-due item is a card: `background: #FFFFFF`, `border: 1px solid #E0DDD6`, `border-radius: 12px`, `padding: 16px 20px`, `margin-bottom: 10px`, `box-shadow: 0 2px 8px rgba(44,44,44,0.06)`, `display: flex`, `align-items: center`, `gap: 16px`.

**Layout (left to right):**

**1. Care Type Icon (left, fixed width, flex-shrink: 0):**
- Circular container: `width: 44px`, `height: 44px`, `border-radius: 50%`, centered icon
- Same color coding as SPEC-008:

  | Care Type | Phosphor Icon | Background | Icon Color |
  |-----------|--------------|------------|------------|
  | `watering` | `Drop` | `#EBF4F7` | `#5B8FA8` |
  | `fertilizing` | `Leaf` | `#E8F4EC` | `#4A7C59` |
  | `repotting` | `PottedPlant` | `#F4EDE8` | `#A67C5B` |

- Icon size: 20px, outlined weight
- `aria-hidden="true"` (decorative; accessible label provided by card text)

**2. Plant + Care Info (center, flex: 1, min-width: 0):**
- Line 1 — Plant name: DM Sans, 15px, `font-weight: 500`, `color: #2C2C2C`. Single line, truncate with ellipsis.
- Line 2 — Care type label: DM Sans, 13px, `color: #6B6B5F`, `margin-top: 2px`
  - `watering` → "Watering"
  - `fertilizing` → "Fertilizing"
  - `repotting` → "Repotting"
- Line 3 — Urgency detail: DM Sans, 12px, `font-weight: 500`, `margin-top: 4px`
  - **Overdue items:** `color: #B85C38` — e.g., "3 days overdue" (use `days_overdue` from API). If `days_overdue === 1`: "1 day overdue". If `last_done_at` is null (never done): "Never done"
  - **Due Today items:** `color: #C4921F` — "Due today"
  - **Coming Up items:** `color: #5C7A5C` — e.g., "Due in 3 days" (use `due_in_days`). If `due_in_days === 1`: "Due tomorrow". Show `due_date` as tooltip on the urgency text via `title="Due [Month D, YYYY]"` (e.g., `title="Due April 3, 2026"`).

**3. "Mark as done" Button (right, flex-shrink: 0):**
- Style: Secondary button variant, `font-size: 13px`, `padding: 8px 16px`, `border-radius: 8px`
- Label: "Mark as done"
- On click: calls `POST /api/v1/care-actions` with `{ plant_id, care_type }`. On success:
  1. Show a brief success toast: "[Plant name] [care type] marked as done! 🌿" (info/success variant)
  2. Remove the item from the current section with a smooth fade-out: `opacity: 0`, `height: 0`, `margin: 0`, `padding: 0` transition over `0.3s ease`. After transition completes, remove from DOM.
  3. Update the section's count pill
  4. If the section becomes empty, fade-in the per-section empty state
  5. If all sections are now empty, transition to the global all-clear state
  6. Decrement the sidebar badge count. If count reaches 0, hide the badge.
- While the API call is in-flight: button shows an inline 14px spinner, is `disabled`, and its text hides (spinner only). The card does not change.
- On API error: button returns to normal state; show an error toast: "Couldn't mark as done. Please try again." (error variant)
- `aria-label`: "Mark [Plant Name] [care type] as done" (e.g., "Mark Monstera watering as done")

**Hover state on card:** `box-shadow: 0 4px 16px rgba(44,44,44,0.10)`, `border-color: #C8C4BC`, transition `0.2s ease`. The card itself is not a link or button — only the "Mark as done" button is interactive.

#### States

**Loading State:**

Shown on initial page mount while `GET /api/v1/care-due` is fetching.

- Display 2 skeleton section blocks. Each block:
  - Section header row: shimmer bar `width: 120px`, `height: 14px`, `border-radius: 4px`
  - 2–3 skeleton item cards below it. Each skeleton card:
    - Left: circular shimmer `44px × 44px`
    - Center: two shimmer lines — line 1 `width: 40–60%`, `height: 14px`; line 2 `width: 25–35%`, `height: 12px`, `margin-top: 6px`; line 3 `width: 80px`, `height: 11px`, `margin-top: 6px`
    - Right: shimmer block `width: 110px`, `height: 34px`, `border-radius: 8px`
  - Card style: `background: #F0EDE6`, `border: 1px solid #E0DDD6`, `border-radius: 12px`, `padding: 16px 20px`, `margin-bottom: 10px`
- Shimmer animation: same as SPEC-008 — `background: linear-gradient(90deg, #F0EDE6 25%, #E8E4DC 50%, #F0EDE6 75%)`, `background-size: 200% 100%`, keyframe `shimmer` 1.4s ease-in-out infinite
- Page header (title + subtitle) renders normally above the skeletons
- Wrapper: `aria-busy="true"`, `aria-label="Loading care due items"`

**Per-Section Empty States:**

Shown inline within a section when that section has no items (but other sections may still have items). These are compact — not full-page.

- Container: `background: #F7F4EF`, `border: 1px dashed #E0DDD6`, `border-radius: 12px`, `padding: 20px 24px`, `text-align: center`, `margin-bottom: 10px`
- Text: DM Sans, 14px, `color: #B0ADA5`
  - Overdue section empty: "Nothing overdue — great work! 🌱"
  - Due Today section empty: "Nothing due today."
  - Coming Up section empty: "No upcoming care in the next 7 days."
- No icon or CTA needed — the encouraging text is sufficient

**Global All-Clear State (all three sections empty):**

Shown when the API returns all-empty sections: `overdue: []`, `due_today: []`, `upcoming: []`. Replaces the three section blocks entirely.

- Centered content block: `text-align: center`, `padding: 80px 24px`, `max-width: 480px`, margin auto
- Illustration: a simple SVG showing a plant with a small sparkle or checkmark motif, approx 120px × 120px, using `#5C7A5C` and `#A67C5B`. Keep it lighthearted — a "happy plant" feeling.
- Heading: "All your plants are happy!" — Playfair Display, 26px, `font-weight: 600`, `color: #2C2C2C`, `margin-top: 28px`
- Body: "You're all caught up. Check back later or explore your plant inventory." — DM Sans, 15px, `color: #6B6B5F`, `margin-top: 10px`, `line-height: 1.6`
- CTA: "View my plants" — Primary button, `margin-top: 28px`, navigates to `/`
- The page header (title + subtitle) still renders above this block so users know they're on the Care Due page

**Error State:**

Shown when `GET /api/v1/care-due` fails (any non-200 response or network failure).

- Replaces all section content
- Centered block: `text-align: center`, `padding: 80px 24px`
- Icon: Phosphor `WarningCircle`, 48px, `color: #B85C38`
- Heading: "Couldn't load your care schedule." — Playfair Display, 22px, `color: #2C2C2C`, `margin-top: 20px`
- Body: "Something went wrong. Please try again." — DM Sans, 14px, `color: #6B6B5F`, `margin-top: 8px`
- CTA: "Try again" — Secondary button, `margin-top: 24px`, triggers a re-fetch. `aria-label="Retry loading care due items"`

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Sidebar 240px visible; main content max-width 800px centered; item cards full-width; "Mark as done" button right-aligned inline with plant info |
| Tablet (768–1023px) | Sidebar may collapse to icon rail (same pattern as other pages); main content adapts; item card layout unchanged; "Mark as done" button may compress to icon-only if needed (keep label at 768px+) |
| Mobile (<768px) | No sidebar (hamburger or bottom nav); 16px horizontal padding; item card stacks: icon + plant info on top row, "Mark as done" button full-width below, `margin-top: 12px`. Urgency detail line stays visible. Plant name truncates aggressively (1 line, ellipsis). Section header count pill may hide on very narrow widths (320px). |

**Mobile card stack layout (< 768px):**
```
[Icon] [Plant name / Care type / Urgency detail]
[Mark as done button — full width]
```
`display: flex`, `flex-wrap: wrap`. The "Mark as done" button: `flex-basis: 100%`, `margin-top: 12px`.

#### API Integration

Endpoint: `GET /api/v1/care-due` (see T-043 and `api-contracts.md`)

- Authenticated — send Bearer token in Authorization header
- No query parameters (all data scoped to the authenticated user)

**Response shape** (per T-043 API contract):
```json
{
  "overdue": [
    {
      "plant_id": "uuid",
      "plant_name": "string",
      "care_type": "watering | fertilizing | repotting",
      "days_overdue": 3,
      "last_done_at": "ISO 8601 datetime string | null"
    }
  ],
  "due_today": [
    {
      "plant_id": "uuid",
      "plant_name": "string",
      "care_type": "watering | fertilizing | repotting"
    }
  ],
  "upcoming": [
    {
      "plant_id": "uuid",
      "plant_name": "string",
      "care_type": "watering | fertilizing | repotting",
      "due_in_days": 3,
      "due_date": "ISO 8601 date string"
    }
  ]
}
```

**"Mark as done" action:** `POST /api/v1/care-actions` — existing endpoint (same one used on Plant Detail page). Request body: `{ "plant_id": "uuid", "care_type": "watering | fertilizing | repotting" }`. On success (201): update local UI state as described above. Do NOT re-fetch the full care-due list after each mark-done — use optimistic local removal for responsiveness.

**Fetch timing:**
- On initial mount of the `/due` page
- On "Try again" click after error
- After successful "Mark as done" action: **do not re-fetch** — remove item from local state only. The next full page mount or refresh will show the current server state.
- The sidebar badge count should be fetched/updated separately: on app shell mount (so the badge is always visible, not only when on /due). A lightweight approach: cache the care-due response in a shared context/store; update it on /due mount and after each mark-done.

#### Sorting Rules Within Sections

- **Overdue:** Sort by `days_overdue` descending (most overdue first). Ties broken by `plant_name` ascending A–Z.
- **Due Today:** Sort by `plant_name` ascending A–Z. No urgency ordering needed since all are equally urgent.
- **Coming Up:** Sort by `due_in_days` ascending (soonest first). Ties broken by `plant_name` ascending A–Z.

#### Accessibility

- **Page landmark:** `<main>` wraps the content area; `<h1>` for "Care Due"
- **Section structure:** Each urgency section is a `<section>` element with `aria-labelledby` pointing to its section heading `<h2>`
  - Section headings: `<h2>` for "Overdue", "Due Today", "Coming Up" (visually styled as the section header rows described above; use `class` for visual styling, not `aria-label`)
- **Item list:** Semantic `<ul>` / `<li>` for each section's item list. Each `<li>` contains the card.
- **"Mark as done" button accessible label:** `aria-label="Mark [Plant Name] [care type] as done"` — e.g., `aria-label="Mark Monstera watering as done"`. This provides full context for screen reader users who may tab through buttons without reading surrounding text.
- **Care type icons:** `aria-hidden="true"` (decorative; the care type label in Line 2 provides the text)
- **Loading state:** `aria-busy="true"` on the main content wrapper. An `aria-live="polite"` region announces "Loading care due items..." while fetching, then "Care due items loaded." on completion.
- **Empty / all-clear states:** Standard static content; no special ARIA needed. Ensure heading hierarchy is maintained (`<h2>` for headings within these states if needed, or styled `<p>` with heading appearance).
- **Error state:** Retry button with `aria-label="Retry loading care due items"`.
- **Badge in sidebar:** `aria-label="[N] plants overdue or due today"` on the badge element. Update dynamically. When badge disappears, update parent nav item `aria-label` to remove the count.
- **Mark-done in-flight state:** `aria-busy="true"` on the button while API call is pending. `aria-live="polite"` region announces "[Plant name] [care type] marked as done." on success, or "Could not mark as done. Please try again." on error.
- **Focus management:** After successful mark-done, if the item is removed and there is a next item in the same section, move focus to the "Mark as done" button of that next item. If the section becomes empty, move focus to the next section's first "Mark as done" button. If all sections are empty, move focus to the "View my plants" button in the all-clear state. *(See Sprint #10 Focus Management Amendment below for full implementation spec.)*
- **Keyboard:** All interactive elements reachable by Tab in logical DOM order (section by section, top to bottom). "Mark as done" button activatable via Enter/Space.
- **Color contrast:** All text meets WCAG AA. Status colors (`#B85C38`, `#C4921F`, `#4A7C59`) are paired with white/light backgrounds for sufficient contrast on 12px+ text at font-weight 500+.
- **Reduced motion:** The card fade-out animation after mark-done should respect `prefers-reduced-motion`: if reduced motion is preferred, skip the animated removal and instantly hide/remove the card. The loading shimmer animation should also be disabled under `prefers-reduced-motion`.

---

#### SPEC-009 Amendment — Focus Management After Mark-Done (Sprint #10 — T-050)

**Status:** Approved — 2026-03-29
**Related Task:** T-050
**Fix location:** `frontend/src/pages/CareDuePage.jsx`

This amendment expands the one-sentence focus management rule from the Accessibility section above into a complete implementation specification. The behavior was defined in the original SPEC-009 but was deferred as a known limitation (noted in H-116). Sprint #10 closes that gap.

---

##### Why This Matters

When a keyboard or screen reader user activates "Mark as done" and the item is removed from the DOM, focus is dropped to `<body>`. The user loses their place in the list entirely and must Tab back through the entire page to find where they were. This is disorienting — especially when completing several care actions in a row. The fix is to programmatically move focus to the logical next target after each removal.

---

##### Focus Destination Decision Tree

After a mark-done action succeeds and the card begins its removal sequence, apply this decision tree **in order**:

1. **Next sibling item in the same section exists?**
   → Move focus to its "Mark as done" button.

2. **No sibling remains in the same section — but a later section (lower on page) has items?**
   → Move focus to the first "Mark as done" button in the next non-empty section below.
   → Sections are ordered: Overdue → Due Today → Coming Up. Skip any that are now empty.

3. **No later section has items — but an earlier section (above) still has items?**
   → Move focus to the first "Mark as done" button in the topmost non-empty section.
   *(This handles the edge case where the user was in "Due Today" or "Coming Up" and those sections are now empty but "Overdue" still has items.)*

4. **All sections are now empty (all-clear state reached)?**
   → Move focus to the **"View my plants"** primary button rendered in the all-clear state.

---

##### Timing — When to Move Focus

Focus must be moved **after the item is fully removed from the DOM**, not during the fade-out transition. Moving focus during the animation would cause a screen reader to announce an element that visually appears to be disappearing, which is confusing.

**Standard motion (prefers-reduced-motion: no preference):**
- The card animates out over `300ms` (`opacity: 0`, `height → 0`, `margin → 0`, `padding → 0`).
- Wait for the CSS transition to complete before calling `.focus()`.
- Implementation: use a `transitionend` listener on the card element, or a `setTimeout(fn, 300)` fallback (use the timeout as the fallback only — `transitionend` is preferred to avoid timing drift).

**Reduced motion (prefers-reduced-motion: reduce):**
- Per the existing spec, the card is instantly removed (no animation).
- In this case, move focus **synchronously** — no delay needed.
- Detect with `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

---

##### React Implementation Guidance

Use **refs** to maintain references to the "Mark as done" buttons across re-renders.

Recommended pattern:
```jsx
// Maintain a ref map: item key → button DOM node
const markDoneButtonRefs = useRef({});  // { [itemKey]: buttonElement }

// When registering each button:
<button
  ref={(el) => { markDoneButtonRefs.current[itemKey] = el; }}
  aria-label={`Mark ${plant.name} ${careType} as done`}
  onClick={() => handleMarkDone(plant.plant_id, careType, itemKey)}
>
  Mark as done
</button>

// In handleMarkDone, after API success:
const focusTarget = getNextFocusTarget(itemKey, sections);
// Remove item from local state
// After transition:
if (focusTarget) {
  focusTarget.focus();
} else {
  // All-clear: the "View my plants" button
  viewMyPlantsButtonRef.current?.focus();
}
```

**`getNextFocusTarget(currentItemKey, currentSections)` logic:**
- Determine which section the current item belongs to (Overdue / Due Today / Coming Up).
- Find the index of the current item within that section's list.
- Check if `index + 1` exists in the same section's **post-removal** list (the list after this item is removed). If yes → return ref for that item's button.
- If no sibling: iterate through sections in order (Overdue → Due Today → Coming Up), skipping the current section and any empties. Return first item's button ref from first non-empty section found.
- If all sections empty: return `null` (caller falls through to "View my plants" button).

**The all-clear button ref:**
```jsx
const viewMyPlantsButtonRef = useRef(null);
// On the all-clear CTA:
<button ref={viewMyPlantsButtonRef} ...>View my plants</button>
```

---

##### Item Key Convention

Each item needs a stable key for the ref map. Use a composite key:
```
`${plant_id}__${care_type}`
```
Example: `"abc-123-uuid__watering"`

This key must be consistent between the ref registration and the mark-done handler call.

---

##### Edge Cases

| Scenario | Expected Focus Target |
|----------|-----------------------|
| Middle item removed; sibling below exists in same section | Next sibling's "Mark as done" button |
| Last item in section removed; Due Today still has items | First "Due Today" item's "Mark as done" button |
| Last Overdue item removed; only Coming Up has items | First "Coming Up" item's "Mark as done" button |
| Only one item ever existed, now all-clear | "View my plants" button |
| User marks done very fast (button clicks overlap) | Disable button during in-flight API call (already specced); focus logic runs after each individual success, so no collision |
| Focus target has been unmounted before focus fires (rare race) | Gracefully no-op; do not throw; log a warning in dev mode |
| `prefers-reduced-motion: reduce` + instant DOM removal | Call `.focus()` synchronously after state update (no setTimeout) |

---

##### Test Coverage Requirements (T-050)

The Frontend Engineer must add tests covering the following scenarios. All **existing 101 frontend tests must continue to pass**. New tests are additions only.

| Test # | Scenario | Expected Result |
|--------|----------|----------------|
| 1 | Mark done on middle item in Overdue section | Focus moves to next Overdue item's "Mark as done" button |
| 2 | Mark done on last item in Overdue section (Due Today has items) | Focus moves to first Due Today item's "Mark as done" button |
| 3 | Mark done on last item in Overdue (Due Today empty, Coming Up has items) | Focus moves to first Coming Up item's "Mark as done" button |
| 4 | Mark done on last item in Due Today (Coming Up has items) | Focus moves to first Coming Up item's "Mark as done" button |
| 5 | Mark done on last remaining item across all sections | Focus moves to "View my plants" button |
| 6 | `prefers-reduced-motion: reduce` — mark done | Focus moves synchronously (no setTimeout delay) |

Use `@testing-library/user-event` for click simulation. Assert `document.activeElement` after the relevant state update / timer flush to confirm focus destination.

---

---

### SPEC-010 — Dark Mode: Color Tokens & Theme Toggle

**Status:** Approved
**Related Tasks:** T-063 (Dark Mode — Design Spec)
**Sprint:** 14

#### Overview

Plant Guardians' Japandi botanical aesthetic translates naturally into dark mode — the design language is already minimal, earthy, and low-contrast. Dark mode should feel like moving from a sunlit studio into a warmly-lit evening room: the same materials, the same calm, just quieter. The palette draws on aged ink, dark weathered wood, and candlelight — never cold blue-blacks or pure `#000000`.

This spec defines:
1. The full dark mode color token set (mapped to every existing light-mode token)
2. CSS implementation strategy (custom properties on `:root`, dark overrides)
3. The system preference default (`prefers-color-scheme`)
4. The manual toggle UI on the Profile page
5. Per-screen guidance for elements that need special attention in dark mode
6. Contrast validation against WCAG AA (4.5:1 minimum for body text, 3:1 for large text/UI components)

---

#### Dark Mode Color Tokens

All tokens below are CSS custom property overrides applied under `[data-theme="dark"]` on `<html>`. When the user's system preference is dark AND no manual override is set, these same tokens apply via `@media (prefers-color-scheme: dark)`.

| Token Name | Light Value | Dark Value | Notes |
|-----------|------------|-----------|-------|
| `--color-bg` | `#F7F4EF` | `#1A1815` | Deep warm charcoal — like aged ink on paper |
| `--color-surface` | `#FFFFFF` | `#242220` | Dark card/panel surface — dark weathered wood |
| `--color-surface-alt` | `#F0EDE6` | `#2C2A26` | Elevated surface — secondary cards, inset areas |
| `--color-sidebar` | `#FFFFFF` | `#1F1D1A` | Sidebar background — slightly distinct from main bg |
| `--color-modal` | `#FFFFFF` | `#2C2A26` | Modal and drawer background |
| `--color-text-primary` | `#2C2C2C` | `#EDE8DF` | Warm off-white — like parchment in candlelight |
| `--color-text-secondary` | `#6B6B5F` | `#9B9489` | Muted warm gray — supporting labels |
| `--color-text-disabled` | `#B0ADA5` | `#5A5650` | Very muted — inactive states |
| `--color-accent-primary` | `#5C7A5C` | `#7EAF7E` | Sage green, lightened for dark bg (≈7:1 contrast on `#1A1815`) |
| `--color-accent-hover` | `#4A6449` | `#91BE91` | Hover/active accent |
| `--color-accent-warm` | `#A67C5B` | `#C2956A` | Terracotta, slightly lightened |
| `--color-status-green` | `#4A7C59` | `#6EB88A` | "On track" text/icon color |
| `--color-status-green-bg` | `#E8F4EC` | `#1A2F22` | "On track" badge background |
| `--color-status-yellow` | `#C4921F` | `#E8B94A` | "Due today" text/icon color |
| `--color-status-yellow-bg` | `#FDF4E3` | `#2B220D` | "Due today" badge background |
| `--color-status-red` | `#B85C38` | `#E07A60` | "Overdue" text/icon color |
| `--color-status-red-bg` | `#FAEAE4` | `#2E1A14` | "Overdue" badge background |
| `--color-border` | `#E0DDD6` | `#3C3830` | Card/input borders — subtle warm dark |
| `--color-border-focus` | `#5C7A5C` | `#7EAF7E` | Focus ring color — matches accent |
| `--color-overlay` | `rgba(44,44,44,0.45)` | `rgba(0,0,0,0.65)` | Modal/drawer backdrop |
| `--color-card-shadow` | `0 2px 8px rgba(44,44,44,0.06)` | `0 2px 12px rgba(0,0,0,0.35)` | Card elevation shadow |
| `--color-skeleton-base` | `#F0EDE6` | `#2C2A26` | Skeleton loader base color |
| `--color-skeleton-highlight` | `#E8E4DC` | `#383530` | Skeleton shimmer highlight |

> **Non-goals:** No pure `#000000` anywhere. No cool blue-black tones. Every dark value must contain a warm undertone — brown, tan, or muted gold. The app should feel like a dimly-lit Japanese earthenware studio, not a developer terminal.

---

#### WCAG AA Contrast Validation

All required combinations verified at 4.5:1 minimum for body text (WCAG AA). Large text (18px+ or 14px+ bold) requires 3:1.

| Foreground | Background | Estimated Ratio | Use Case | Pass? |
|-----------|-----------|----------------|---------|-------|
| `#EDE8DF` | `#1A1815` | ≈ 15.8:1 | Primary text on page background | ✅ AAA |
| `#EDE8DF` | `#242220` | ≈ 13.1:1 | Primary text on card surface | ✅ AAA |
| `#9B9489` | `#1A1815` | ≈ 5.8:1 | Secondary text on page background | ✅ AA |
| `#9B9489` | `#242220` | ≈ 4.8:1 | Secondary text on card | ✅ AA |
| `#7EAF7E` | `#1A1815` | ≈ 7.2:1 | Accent (links, CTAs) on bg | ✅ AAA |
| `#7EAF7E` | `#242220` | ≈ 6.0:1 | Accent on card | ✅ AA |
| `#1A1815` | `#7EAF7E` | ≈ 7.2:1 | White-on-accent (Primary button text) | ✅ AAA |
| `#6EB88A` | `#1A2F22` | ≈ 5.2:1 | Status green badge | ✅ AA |
| `#E8B94A` | `#2B220D` | ≈ 8.1:1 | Status yellow badge | ✅ AAA |
| `#E07A60` | `#2E1A14` | ≈ 5.6:1 | Status red badge | ✅ AA |
| `#EDE8DF` | `#1F1D1A` | ≈ 14.9:1 | Text on sidebar | ✅ AAA |

> **Frontend Engineer note:** During implementation, verify each combination using a browser contrast checker or the axe DevTools extension. If any combination falls below 4.5:1, lighten the foreground token by 5–10% luminosity until it passes.

---

#### Button Variants — Dark Mode Overrides

| Variant | Dark Background | Dark Text | Dark Border | Notes |
|---------|----------------|-----------|------------|-------|
| Primary | `#7EAF7E` | `#1A1815` | none | Sage green bg, dark text — high contrast |
| Primary hover | `#91BE91` | `#1A1815` | none | Lightened sage on hover |
| Secondary | transparent | `#7EAF7E` | 1.5px `#7EAF7E` | Outlined in sage green |
| Danger | `#E07A60` | `#1A1815` | none | Terracotta red, dark text |
| Ghost | transparent | `#9B9489` | none | Muted warm gray text |
| Icon | transparent | `#9B9489` | none | Circle hover: `rgba(255,255,255,0.08)` |

Focus rings on all buttons in dark mode: `box-shadow: 0 0 0 3px rgba(126,175,126,0.35)`.

---

#### Status Badge Component — Dark Mode Overrides

| State | Dark Background | Dark Text Color | Label |
|-------|----------------|----------------|-------|
| On Track | `#1A2F22` | `#6EB88A` | "On Track" |
| Due Today | `#2B220D` | `#E8B94A` | "Due Today" |
| Overdue N days | `#2E1A14` | `#E07A60` | "X days overdue" |
| Not Set | `#2C2A26` | `#5A5650` | "Not set" |

All badge specs (padding, border-radius, font-size, font-weight) are unchanged from the light mode convention.

---

#### Input Fields — Dark Mode Overrides

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | `#242220` | `#3C3830` | `#EDE8DF` |
| Placeholder | `#242220` | `#3C3830` | `#5A5650` |
| Focus | `#242220` | `#7EAF7E` | `#EDE8DF`, focus ring `rgba(126,175,126,0.25)` |
| Error | `#2E1A14` | `#E07A60` | `#EDE8DF`, error msg `#E07A60` |
| Disabled | `#2C2A26` | `#3C3830` | `#5A5650` |

---

#### Photo Upload Zone — Dark Mode

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Empty | `#2C2A26` | `2px dashed #3C3830` | `#9B9489` |
| Dragover | `#1A2F22` | `2px dashed #7EAF7E` | `#7EAF7E` |
| Preview | normal image fill | none | — |
| Hover overlay | `rgba(26,24,21,0.6)` | — | `#EDE8DF` |

---

#### Sidebar — Dark Mode

| Element | Dark Value |
|---------|-----------|
| Background | `#1F1D1A` |
| Right border | `1px solid #3C3830` |
| Nav item (inactive) | Text `#9B9489`, icon `#9B9489` |
| Nav item (active) | Left border `4px solid #7EAF7E`, text `#7EAF7E`, bg `rgba(126,175,126,0.1)` |
| Nav item (hover) | bg `rgba(255,255,255,0.04)` |
| User name | `#EDE8DF` |
| User email/subtitle | `#9B9489` |
| Logout button text | `#9B9489` |
| Care Due badge | Background `#E07A60`, text `#1A1815` |

---

#### Plant Photo Placeholder — Dark Mode

The leaf icon placeholder on cards and detail pages:

- Background: `#1A2F22` (very dark green — same hue as status-green-bg)
- Icon color: `#3A5C43` (muted dark sage)

This maintains the botanical identity without being too bright.

---

#### Skeleton / Loading States — Dark Mode

Shimmer gradient:
```css
background: linear-gradient(
  90deg,
  var(--color-skeleton-base) 25%,      /* #2C2A26 */
  var(--color-skeleton-highlight) 50%, /* #383530 */
  var(--color-skeleton-base) 75%       /* #2C2A26 */
);
background-size: 200% 100%;
animation: shimmer 1.4s ease-in-out infinite;
```

---

#### Confetti Animation — Dark Mode

The "Mark as done" confetti burst (SPEC-005) uses warm botanical colors. In dark mode, those same colors look even better against a dark background — **no changes needed** to the confetti particle colors (`#5C7A5C`, `#A67C5B`, `#C4921F`). However, add `#7EAF7E` (dark-mode sage) and `#E8B94A` (dark-mode amber) to the particle palette for extra vibrancy in dark context.

---

#### AI Advice Card — Dark Mode

The "Get AI Advice" card in Add/Edit Plant screens:

- Background: `#2C2A26` (Surface Alt)
- Border: none (same as light)
- Sparkle icon: `#E8B94A` (warm amber — more visible in dark)
- Body text: `#9B9489`
- Button: Secondary variant (see above)

AI results cards in the modal:
- Background: `#242220` (Surface)
- Border: `1px solid #3C3830`

---

#### "Filled by AI" Badge — Dark Mode

- Background: `rgba(126,175,126,0.15)`
- Text: `#7EAF7E`
- Border: `1px solid rgba(126,175,126,0.3)`

---

#### Theme Toggle — Behavior Specification

##### Detection & Initialization Order

On every page load, the app determines which theme to apply using this priority order:

1. **Check `localStorage`** for key `plant-guardians-theme`.
   - If value is `'dark'` → apply dark mode immediately (set `data-theme="dark"` on `<html>`)
   - If value is `'light'` → apply light mode (remove `data-theme` attribute or set `data-theme="light"`)
   - If value is `'system'` or key is absent → fall through to step 2
2. **Check `window.matchMedia('(prefers-color-scheme: dark)').matches`**
   - If `true` → apply dark mode
   - If `false` → apply light mode (default)

> **Critical:** This initialization must happen **before first paint** — place the theme-check script as an inline `<script>` in the `<head>` of `index.html`, before any CSS or component loads. This prevents the flash of un-themed content (FOUC).

```html
<!-- index.html <head> — must run before first paint -->
<script>
  (function() {
    var stored = localStorage.getItem('plant-guardians-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark) || (stored === 'system' && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
```

##### CSS Implementation

Define all tokens on `:root` (light mode defaults). Override them in `[data-theme="dark"]`:

```css
:root {
  --color-bg: #F7F4EF;
  --color-surface: #FFFFFF;
  /* ... all light tokens ... */
}

[data-theme="dark"] {
  --color-bg: #1A1815;
  --color-surface: #242220;
  /* ... all dark tokens ... */
}

/* System preference fallback (when no manual override is set) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #1A1815;
    --color-surface: #242220;
    /* ... all dark tokens ... */
  }
}
```

If using Tailwind CSS, use the `darkMode: 'class'` strategy with the class `dark` on `<html>`. Map the above tokens to Tailwind config `theme.extend.colors`. The `data-theme="dark"` attribute should add/remove the `dark` class simultaneously.

##### Listening to System Preference Changes

The app should respond to live system preference changes (user toggles OS dark mode while app is open) **only when the user has not set a manual preference** (i.e., `localStorage` value is `'system'` or absent):

```js
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    const stored = localStorage.getItem('plant-guardians-theme');
    if (!stored || stored === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
```

---

#### Profile Page — Theme Toggle Component (SPEC-007 Amendment)

Add a new "Appearance" section to the Profile page (SPEC-007), placed **above** the "Account Actions" section (above Log Out / Delete Account).

##### Section Header

- Label: "Appearance" — DM Sans, 13px, `font-weight: 500`, `color: #6B6B5F` (same style as other section labels)
- `margin-bottom: 12px`

##### Theme Selector

A **segmented control** (three-option button group) offering: System / Light / Dark.

**Layout:**

```
[Appearance]
[  System  |  Light  |  Dark  ]
```

- Container: `display: inline-flex`, `border: 1.5px solid var(--color-border)`, `border-radius: 8px`, `overflow: hidden`, `background: var(--color-surface-alt)`
- Each option button: `padding: 8px 16px`, `font-size: 13px`, `font-weight: 500`, no border (the container provides it), `cursor: pointer`, `transition: background 0.15s ease`

**Option states:**

| State | Background | Text | Notes |
|-------|-----------|------|-------|
| Active (selected) | `var(--color-surface)` | `var(--color-text-primary)` | `box-shadow: 0 1px 3px rgba(0,0,0,0.1)` |
| Inactive | transparent | `var(--color-text-secondary)` | — |
| Hover (inactive) | `rgba(0,0,0,0.04)` in light / `rgba(255,255,255,0.04)` in dark | `var(--color-text-primary)` | — |

**Option labels & icons:**

| Option | Icon | Label | Behavior |
|--------|------|-------|---------|
| System | Phosphor `Monitor` (16px) | "System" | Follows OS `prefers-color-scheme`; remove manual `localStorage` entry |
| Light | Phosphor `Sun` (16px) | "Light" | Forces light mode; sets `localStorage` to `'light'` |
| Dark | Phosphor `Moon` (16px) | "Dark" | Forces dark mode; sets `localStorage` to `'dark'` |

Icons are positioned to the left of the label, `gap: 6px`, `display: inline-flex`, `align-items: center`.

**On selection:**
1. Update the segmented control's visual state immediately (optimistic)
2. Write the chosen value (`'system'` | `'light'` | `'dark'`) to `localStorage` key `plant-guardians-theme`
3. Apply the theme change immediately: set or remove `data-theme` on `<html>` (and toggle `dark` Tailwind class if applicable)
4. The entire page re-themes with CSS transitions (`transition: background-color 0.3s ease, color 0.2s ease, border-color 0.2s ease` on `:root` — but see note below)

> **Transition note:** Apply CSS transitions on theme change for a smooth visual experience. However, on initial page load, disable transitions to prevent FOUC. Strategy: add a `no-transition` class to `<html>` during initialization script, then remove it after the first paint via `requestAnimationFrame`.

**Current value on load:** Read from `localStorage`. If absent, default to "System" option selected.

##### Full Profile Page Appearance Section Layout

```
Card: background var(--color-surface), border 1.5px solid var(--color-border), border-radius 12px, padding 24px

[Section label: "Appearance" — DM Sans 13px, color text-secondary]
[Segmented control: System | Light | Dark]
[margin-bottom: 24px, border-bottom: 1px solid var(--color-border) to separator before Account Actions]
```

---

#### Per-Screen Dark Mode Guidance

##### Login Screen (SPEC-001)

| Element | Dark Treatment |
|---------|---------------|
| Left brand panel | `background: #2A2620` — dark sage-brown, warmer than bg. Keep botanical illustration in `#3A5C43` (muted dark sage) |
| Right form panel | `background: var(--color-bg)` — standard dark bg |
| Logo text | `#EDE8DF` |
| Tagline | `#9B9489` |
| Tab toggle container | `background: #2C2A26`, active tab `background: #242220` |
| Form error banner | `background: #2E1A14`, text `#E07A60`, border left `2px solid #E07A60` |

##### Inventory Screen (SPEC-002)

| Element | Dark Treatment |
|---------|---------------|
| Page background | `#1A1815` |
| Sidebar | See Sidebar dark spec above |
| Plant cards | `background: #242220`, shadow as specced |
| Card hover | `box-shadow: 0 6px 20px rgba(0,0,0,0.4)` |
| Empty state illustration | Stroke color `#3A5C43`, bg transparent |
| Delete modal | `background: #2C2A26` |
| Search input | See input dark spec |

##### Add/Edit Plant Screens (SPEC-003, SPEC-004)

| Element | Dark Treatment |
|---------|---------------|
| Form background | `var(--color-bg)` |
| Section cards | `background: var(--color-surface)`, border `var(--color-border)` |
| AI Advice card | `background: var(--color-surface-alt)` |
| Photo upload zone | See Photo Upload Zone dark spec above |
| "Filled by AI" badge | See above |
| Collapsible section dividers | `border-color: var(--color-border)` |
| Frequency inputs | Standard input dark spec |

##### Plant Detail Screen (SPEC-005)

| Element | Dark Treatment |
|---------|---------------|
| Header card | `background: var(--color-surface)` |
| Plant photo area | Standard (no change to image) |
| Photo placeholder | See Plant Photo Placeholder dark spec |
| Notes box | `background: var(--color-bg)`, border `var(--color-border)` |
| Care cards | `background: var(--color-surface)`, border `var(--color-border)` |
| "Mark as done" button | Secondary variant in dark (see button spec) |
| "Done" state | `background: #1A2F22`, text `#6EB88A`, border `#3A5C43` |
| "Undo" button | Ghost variant dark |
| Recent activity timeline | Text `#9B9489`, icon colors per care type (use dark status palette) |
| Care icon backgrounds | Watering: `#1A2530`/`#4A7A96` — Fertilizing: `#1A2F22`/`#6EB88A` — Repotting: `#2E1A14`/`#C2956A` |

> **Confetti note:** `canvas-confetti` renders on a canvas element — it is inherently unaffected by CSS theming. The particle colors are set in JS. In dark mode, add the extra colors noted above (`#7EAF7E`, `#E8B94A`) to the confetti palette for a more vibrant result.

##### AI Advice Modal (SPEC-006)

| Element | Dark Treatment |
|---------|---------------|
| Backdrop | `rgba(0,0,0,0.65)` |
| Modal card | `background: #2C2A26` |
| Plant ID banner | `background: #242220`, border `1px solid #3C3830` |
| Care advice cards | `background: #1F1D1A`, border `1px solid #3C3830` |
| Loading spinner | `#7EAF7E` |
| Action button sticky bar | `background: #2C2A26`, border-top `1px solid #3C3830` |

##### Profile Page (SPEC-007)

| Element | Dark Treatment |
|---------|---------------|
| Page background | `var(--color-bg)` |
| Profile card | `background: var(--color-surface)` |
| Avatar background | `#2A4A2A` (dark sage green) |
| Stat tiles | `background: var(--color-bg)` (slightly inset from cards) |
| Stat number color | `#7EAF7E` (dark accent green) |
| Account Actions card | `background: var(--color-surface)`, border `var(--color-border)` |
| Appearance section | Inside Account Actions card, above Log Out |
| Log Out button | Secondary variant dark |
| Delete Account button | `color: #E07A60` |
| Delete modal | `background: #2C2A26` |
| Warning icon | `#E07A60` |

##### Care History Page (SPEC-008)

| Element | Dark Treatment |
|---------|---------------|
| Page background | `var(--color-bg)` |
| Filter dropdown | Standard input dark spec |
| List item dividers | `border-color: var(--color-border)` |
| Care type icon backgrounds | Watering `#1A2530`, Fertilizing `#1A2F22`, Repotting `#2E1A14` |
| Care type icon colors | Watering `#5B8FA8`, Fertilizing `#6EB88A`, Repotting `#C2956A` (same hues, preserve identity) |
| Plant name | `var(--color-text-primary)` |
| Action label, timestamp | `var(--color-text-secondary)` |
| Empty state illustration | Stroke `#3A5C43` |
| "Load more" button | Ghost variant dark |

##### Care Due Dashboard (SPEC-009)

| Element | Dark Treatment |
|---------|---------------|
| Page background | `var(--color-bg)` |
| Section header rows | Background `var(--color-bg)` (no visible change — just text updates) |
| "Overdue" section header | Icon + count text `#E07A60` |
| "Due Today" section header | Icon + count text `#E8B94A` |
| "Coming Up" section header | Icon + count text `#7EAF7E` |
| Count pills | Follow status badge dark spec |
| Care item cards | `background: var(--color-surface)`, border `var(--color-border)` |
| Care type icons | Per Care History dark spec above |
| "Mark as done" button | Secondary variant dark |
| In-flight state | `opacity: 0.6` on card (same behavior) |
| All-clear illustration | `#3A5C43` stroke, `#E8B94A` sparkle accent |
| Sidebar badge | Background `#E07A60`, text `#1A1815` |

---

#### Reduced Motion Considerations

The `prefers-reduced-motion: reduce` media query is already respected for:
- Confetti (SPEC-005): skip animation entirely
- Skeleton shimmer: disable keyframe animation, use static color
- Care item removal (SPEC-009): instant DOM removal, no fade

In dark mode, ensure the theme transition CSS (`transition: background-color 0.3s ease`) also respects reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
  }
}
```

---

#### Test Requirements for T-063 Frontend

The Frontend Engineer must write at least 3 new tests (in addition to the 130 existing). Suggested tests:

| Test # | Description | Assert |
|--------|-------------|--------|
| 1 | Theme toggle: click "Dark" → `localStorage` set to `'dark'`, `<html>` gets `data-theme="dark"` | DOM attribute + localStorage |
| 2 | Theme toggle: click "Light" after dark → `localStorage` set to `'light'`, `data-theme="light"` | DOM attribute + localStorage |
| 3 | Theme toggle: click "System" → `localStorage` key removed (or set to `'system'`), theme follows mocked `prefers-color-scheme` | localStorage state + theme class |
| 4 (optional) | Page load with `localStorage = 'dark'` → `data-theme="dark"` present before first render | Initial DOM state |
| 5 (optional) | Page load with no localStorage + mocked `prefers-color-scheme: dark` → dark mode active | Initial DOM state |

---

#### Summary Checklist for Frontend Engineer

- [ ] Add inline `<script>` to `index.html` `<head>` for flash-free theme initialization
- [ ] Define all CSS custom properties in `:root` (light) and `[data-theme="dark"]` (dark)
- [ ] Add `@media (prefers-color-scheme: dark)` fallback for system preference
- [ ] Add `prefers-color-scheme` change listener (for live OS theme changes)
- [ ] Replace all hardcoded color values in components with CSS custom property references (or Tailwind dark: variants)
- [ ] Add Appearance segmented control to Profile page (System / Light / Dark)
- [ ] Persist preference to `localStorage` under key `plant-guardians-theme`
- [ ] Verify all 7+ screens in dark mode (Login, Inventory, Add Plant, Edit Plant, Plant Detail, AI Advice Modal, Care History, Care Due Dashboard, Profile)
- [ ] Verify confetti animation and skeleton loaders in dark mode
- [ ] Run axe or Lighthouse accessibility audit in dark mode — no contrast failures
- [ ] All 130 existing frontend tests pass; at least 3 new toggle tests added

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
- `Monitor`, `Sun`, `Moon` — theme toggle (new for Sprint #14)

---

### SPEC-002 Amendment — Care-Type Prefixed Status Badges in PlantCard (Sprint #11 — T-052)

**Status:** Approved — 2026-03-30
**Related Task:** T-052
**Fix location:** `frontend/src/components/PlantCard.jsx`

#### Background

The existing status badges on `PlantCard` show care schedule health (e.g., "1 day overdue", "On Track") but do not identify *which* care type they refer to. When a plant has multiple care schedules (watering + fertilizing + repotting), the user cannot tell at a glance which care is overdue. T-052 fixes this by prefixing each badge with its care type icon and label, using the same visual system established in SPEC-008 (Care History Page).

---

#### Enhanced Status Badge Anatomy

Each badge now follows this layout (left to right, inline-flex, vertically centered):

```
[ icon ]  [ CareType ]: [ status text ]
  16px        —              —
```

**Component structure per badge:**
```
<span class="care-badge care-badge--[status]">
  <Icon aria-hidden="true" size={13} weight="bold" color={careTypeIconColor} />
  <span class="care-badge__label">[CareType]: [status text]</span>
</span>
```

- Icon: 13px, Phosphor bold weight (matches dense badge size), `aria-hidden="true"`
- Gap between icon and text: `4px`
- The full badge is still a pill: `padding: 4px 10px 4px 8px`, `border-radius: 24px`, `font-size: 12px`, `font-weight: 500`
- The 2px reduction in left padding (from 12px → 8px) compensates for the icon so the badge doesn't feel too wide

---

#### Care-Type Icon + Color System

Inherit directly from SPEC-008 (Care History Page) for cross-screen consistency:

| Care Type | `care_type` value | Phosphor Icon | Icon Color |
|-----------|------------------|--------------|------------|
| Watering | `watering` | `Drop` | `#5B8FA8` (calm blue) |
| Fertilizing | `fertilizing` | `Leaf` | `#4A7C59` (sage green) |
| Repotting | `repotting` | `PottedPlant` | `#A67C5B` (terracotta) |

> **Important:** The icon color indicates *care type* and is always the same regardless of status. The badge *background* and *text color* continue to encode the *care status* (on track / due today / overdue / not set), as defined in the Design System Conventions table above.

---

#### Badge Text Format

| Care Status | Badge Text Example |
|-------------|-------------------|
| On Track | "Watering: On track" |
| Due Today | "Fertilizing: Due today" |
| Overdue 1 day | "Repotting: 1 day overdue" |
| Overdue N days | "Watering: 3 days overdue" |
| Not Set | "Fertilizing: Not set" |

Use **sentence case** (not title case). Capitalize only the care type name; status text is lowercase.

---

#### Multi-Badge Layout in PlantCard

When a plant has multiple care schedules, badges stack vertically in a `flex-wrap: wrap` row with `gap: 6px`. On cards with limited horizontal space, badges wrap naturally — they do not truncate or hide.

```
[💧 Watering: 1 day overdue]
[🌿 Fertilizing: On track]
[🪴 Repotting: Due today]
```

Maximum visible: all active schedules (no cap). If a plant has no care schedules at all, show the existing "Not set" badge without a care-type prefix (since there's no schedule to label).

---

#### Full Badge State Table (Updated)

| State | Care Type Prefix | Background | Text/Icon Color | Status Icon Color |
|-------|-----------------|-----------|-----------------|------------------|
| On Track | ✓ `[icon] [Type]:` | `#E8F4EC` | `#4A7C59` | Care type color (above) |
| Due Today | ✓ `[icon] [Type]:` | `#FDF4E3` | `#C4921F` | Care type color (above) |
| Overdue N days | ✓ `[icon] [Type]:` | `#FAEAE4` | `#B85C38` | Care type color (above) |
| Not Set (has schedule) | ✓ `[icon] [Type]:` | `#F0EDE6` | `#B0ADA5` | Care type color (above), also at 0.6 opacity |
| No schedules at all | ✗ (no prefix) | `#F0EDE6` | `#B0ADA5` | n/a |

---

#### Responsive Behavior

No change to PlantCard responsive layout. Badges already wrap — the additional icon+label content increases badge width by approximately 60–80px per badge. This is acceptable across all breakpoints. On mobile, the badge row remains `flex-wrap: wrap` so no overflow occurs.

---

#### Accessibility

- Care type icon: `aria-hidden="true"` — the text label ("Watering:", "Fertilizing:", "Repotting:") provides full context for screen readers
- Each badge remains a `<span>` (non-interactive, read inline with plant name)
- No change to PlantCard's overall ARIA structure
- For each badge, the full accessible text string (read by screen reader) will be, e.g.: "Watering: 1 day overdue" — the care type is explicit and the status is explicit; no ambiguity

---

#### Unit Test Requirements (T-052)

The Frontend Engineer must add tests covering:

| Test # | Scenario | Expected Output |
|--------|----------|----------------|
| 1 | Watering badge, status overdue 2 days | Drop icon (blue `#5B8FA8`) + "Watering: 2 days overdue", red badge background |
| 2 | Fertilizing badge, status on track | Leaf icon (green `#4A7C59`) + "Fertilizing: On track", green badge background |
| 3 | Repotting badge, status due today | PottedPlant icon (terracotta `#A67C5B`) + "Repotting: Due today", amber badge background |
| 4 | Multiple badges on one card | All three care types render in correct order; flex-wrap active |
| 5 | Plant with no care schedules | Single "Not set" badge with no icon prefix |
| 6 | Watering overdue 1 day (singular) | "Watering: 1 day overdue" (not "1 days overdue") |

All 107+ existing frontend tests must continue to pass.

---

---

### SPEC-011 — Care History Analytics Page

**Status:** Approved — Updated 2026-04-01 (T-073: Warmer empty state copy; Sprint 16)
**Related Tasks:** T-065 (Care Analytics — Design + Frontend), T-073 (Analytics empty state copy — Sprint 16)
**Sprint:** 15 (updated Sprint 16)
**Date:** 2026-03-31

---

#### Description

The Care Analytics page gives Plant Guardians users actionable insight into how consistently and actively they've cared for their plants. Rather than only showing *what* is due, this screen shows *what has been accomplished* — turning the daily habit of plant care into a visible, gratifying record of guardianship.

The page lives at `/analytics` and is accessible from the sidebar. It consumes data from `GET /api/v1/care-actions/stats` and presents three zones:

1. **Summary Stats Bar** — high-level headline numbers (total actions, top plant, streak)
2. **Care Breakdown Chart** — donut chart showing proportion of watering / fertilizing / repotting across all actions
3. **Per-Plant Frequency Table** — how many care actions each plant has received, sorted by most cared-for

The tone is warm and affirming — this is a "look how far you've come" screen, not a dashboard of cold metrics. Copy and visual weight should communicate accomplishment.

---

#### Route

`/analytics`

---

#### Navigation Entry Point

Add a new **"Analytics"** sidebar item:

- **Position in sidebar:** Below "Care Due" (`/due`), above "History" (`/history`)
- **Icon:** Phosphor `ChartBar` (outlined), 20px
- **Label:** "Analytics"
- **No badge** — this page is not urgency-driven; no count indicator is needed
- **Active state:** left border `3px solid #5C7A5C`, background `#F0EDE6`, text `#2C2C2C`; uses `var(--color-surface-alt)` and `var(--color-accent-primary)` in dark mode
- **Inactive state:** no border, background transparent, text `#6B6B5F`; uses `var(--color-text-secondary)` in dark mode

**Updated sidebar nav order (desktop, top to bottom):**
1. My Plants (`/`) — Phosphor `Plant`
2. Care Due (`/due`) — Phosphor `BellSimple` + urgency badge
3. **Analytics (`/analytics`) — Phosphor `ChartBar`** ← new
4. History (`/history`) — Phosphor `ClockCounterClockwise`
5. *(profile + logout at bottom)*

---

#### Layout

App shell (persistent 240px sidebar + main content area), consistent with all other authenticated screens.

**Main content area:**
- `max-width: 960px`, horizontally centered
- `padding: 40px 32px` (desktop), `padding: 24px 16px` (mobile)

**Page structure (top to bottom):**

```
┌─────────────────────────────────────────────┐
│  Page Header                                │
│  "Care Analytics"  [subtitle]               │
├─────────────────────────────────────────────┤
│  Summary Stats Bar (3 stat tiles in a row)  │
├──────────────────────┬──────────────────────┤
│  Care Breakdown      │  Recent Activity      │
│  (Donut Chart)       │  Feed                │
├──────────────────────┴──────────────────────┤
│  Per-Plant Frequency Table                  │
└─────────────────────────────────────────────┘
```

On tablet and mobile, the two-column middle zone collapses to a single column (chart above, activity feed below).

---

#### Page Header

- **Title:** "Care Analytics" — Playfair Display, 32px, `font-weight: 600`, `color: var(--color-text-primary)`
- **Subtitle:** "A look at how you've been caring for your plants." — DM Sans, 14px, `color: var(--color-text-secondary)`, `margin-bottom: 32px`
- No action buttons in the header; this is a read-only view

---

#### Zone 1 — Summary Stats Bar

Three stat tiles arranged in a `3-column CSS grid`, `gap: 16px`, full width.

**Tile anatomy:**
- Container: `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 12px`, `padding: 24px`, `box-shadow: var(--card-shadow)`
- Top: small icon (Phosphor, 20px, outlined) + label in `color: var(--color-text-secondary)`, `font-size: 13px`, `font-weight: 500`, `display: flex`, `align-items: center`, `gap: 8px`
- Middle: large number — `font-size: 40px`, `font-weight: 600`, `color: var(--color-accent-primary)`, Playfair Display, `margin: 8px 0 4px`
- Bottom: supporting sub-label — `font-size: 12px`, `color: var(--color-text-secondary)`

**Three tiles:**

| # | Icon | Label | Value Source | Sub-label |
|---|------|-------|-------------|-----------|
| 1 | `CheckCircle` (sage `#5C7A5C`) | "Total care actions" | `data.total_care_actions` | "across all your plants" |
| 2 | `Plant` (sage `#5C7A5C`) | "Most cared-for plant" | `data.by_plant[0].plant_name` (first entry after API sorts by count DESC) | "[N] care actions" where N = `data.by_plant[0].count` |
| 3 | `Lightning` (amber `#C4921F`) | "Most common care type" | The `care_type` key from `data.by_care_type` with the highest `count` | "[N] actions total" |

**Tile 2 — "Most cared-for plant" edge cases:**
- If `data.by_plant` is empty: show "—" as the value and sub-label "Start caring for a plant"
- Long plant name: truncate with ellipsis at 2 lines (`display: -webkit-box`, `-webkit-line-clamp: 2`, `overflow: hidden`)

**Tile 3 — "Most common care type" display:**
- Capitalize the care type string: "Watering", "Fertilizing", "Repotting"
- If all counts are 0: show "—"

---

#### Zone 2 — Care Breakdown Chart (Left Column, desktop 55% width)

**Section heading:** "Care by Type" — DM Sans, 16px, `font-weight: 600`, `color: var(--color-text-primary)`, `margin-bottom: 20px`

**Chart type:** Donut chart (Recharts `<PieChart>` with `<Pie>` and `innerRadius`)

A donut chart is chosen over a bar chart because there are exactly 3 care types — the proportional relationship between them is the key insight. A donut at this scale reads instantly and fits well beside the activity feed in the two-column layout.

**Chart container:** `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 12px`, `padding: 24px`, `box-shadow: var(--card-shadow)`

**Recharts configuration:**

```jsx
<PieChart width={280} height={280}>
  <Pie
    data={byTypeData}
    cx="50%"
    cy="50%"
    innerRadius={75}
    outerRadius={110}
    paddingAngle={3}
    dataKey="count"
  >
    {byTypeData.map((entry, index) => (
      <Cell key={entry.care_type} fill={CARE_TYPE_COLORS[entry.care_type]} />
    ))}
  </Pie>
  <Tooltip content={<CustomTooltip />} />
</PieChart>
```

**Donut center label (rendered as SVG `<text>` or absolutely positioned `<div>` in chart center):**
- Line 1: `data.total_care_actions` — `font-size: 28px`, `font-weight: 600`, `fill: var(--color-text-primary)`, Playfair Display
- Line 2: "total" — `font-size: 12px`, `fill: var(--color-text-secondary)`

**Segment colors (consistent with care-type system across the app):**

| Care Type | Color (light mode) | Color (dark mode) |
|-----------|-------------------|-------------------|
| `watering` | `#5B8FA8` (calm blue) | `#4A7A96` |
| `fertilizing` | `#4A7C59` (sage green) | `#6EB88A` |
| `repotting` | `#A67C5B` (terracotta) | `#C2956A` |

**Legend (below or to the right of donut):**

Rendered as a custom legend (not Recharts default), `display: flex`, `flex-direction: column`, `gap: 10px`, positioned to the right of the donut on desktop, below on mobile.

Each legend row:
```
● Watering      30  (71%)
● Fertilizing    8  (19%)
● Repotting      4  (10%)
```

- Color dot: `width: 10px`, `height: 10px`, `border-radius: 50%`, `background: [care type color]`, `flex-shrink: 0`
- Care type label: DM Sans, 14px, `color: var(--color-text-primary)`, `font-weight: 500`, flex-grow: 1
- Count: DM Sans, 14px, `color: var(--color-text-primary)`, `font-weight: 600`, min-width for alignment
- Percentage: DM Sans, 12px, `color: var(--color-text-secondary)`, `margin-left: 6px`

Percentage is computed client-side: `Math.round((count / total) * 100)`. If total is 0, display "—" for all.

**Custom Tooltip (on hover):**
- `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 8px`, `padding: 8px 12px`, `box-shadow: 0 4px 12px rgba(0,0,0,0.1)`
- Content: "[Care Type]: [count] actions ([%])"
- `font-size: 13px`, `color: var(--color-text-primary)`
- In dark mode, border uses `var(--color-border)`, background uses `var(--color-surface)` — all tokens; no hardcoded values

**Accessible text alternative (WCAG requirement):**

Below the chart container, render a visually-hidden data table that screen readers will announce. This table must be focusable/readable but hidden from sighted users:

```jsx
<table className="sr-only" aria-label="Care actions by type">
  <thead><tr><th>Care Type</th><th>Count</th><th>Percentage</th></tr></thead>
  <tbody>
    <tr><td>Watering</td><td>30</td><td>71%</td></tr>
    <tr><td>Fertilizing</td><td>8</td><td>19%</td></tr>
    <tr><td>Repotting</td><td>4</td><td>10%</td></tr>
  </tbody>
</table>
```

CSS for `.sr-only`:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

The `<PieChart>` element itself: `aria-hidden="true"` (the sr-only table provides the accessible equivalent).

---

#### Zone 2 — Recent Activity Feed (Right Column, desktop 45% width)

**Section heading:** "Recent Activity" — DM Sans, 16px, `font-weight: 600`, `color: var(--color-text-primary)`, `margin-bottom: 20px`

**Container:** `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 12px`, `padding: 24px`, `box-shadow: var(--card-shadow)`, `height: 100%` (matches chart zone height on desktop)

**Data source:** `data.recent_activity` — the 10 most recent care actions across all plants

**Feed layout:** Vertical list, `display: flex`, `flex-direction: column`, `gap: 0` (items share a divider, not gap)

**Each activity row:**

```
[Icon]  [Plant Name]                [relative time]
        [Care type label]
```

- **Care type icon:** Same circular icon system as SPEC-008 Care History:
  - `watering`: `Drop`, background `#EBF4F7`, icon `#5B8FA8`
  - `fertilizing`: `Leaf`, background `#E8F4EC`, icon `#4A7C59`
  - `repotting`: `PottedPlant`, background `#F4EDE8`, icon `#A67C5B`
  - Circle: `width: 32px`, `height: 32px`, `border-radius: 50%`, `flex-shrink: 0`, icon 15px
  - In dark mode: backgrounds `#1A2530` / `#1A2F22` / `#2E1A14`, icon colors same as light
- **Plant name:** DM Sans, 14px, `font-weight: 500`, `color: var(--color-text-primary)`, `line-height: 1.3`; truncate at 1 line with ellipsis if overlong
- **Care type label:** DM Sans, 12px, `color: var(--color-text-secondary)`, capitalized ("Watered", "Fertilized", "Repotted")
- **Relative time:** DM Sans, 11px, `color: var(--color-text-disabled)`, right-aligned (flex spacer), e.g. "2 days ago", "just now", "1 week ago"
  - `<time>` element with `datetime="[ISO8601]"` and `title="[full date string]"` for accessibility

**Row layout:** `display: flex`, `align-items: center`, `gap: 12px`, `padding: 12px 0`

**Divider between rows:** `border-bottom: 1px solid var(--color-border)` on all rows except the last

**Activity row empty state (if `recent_activity` is empty, only shown in concert with the global empty state):** Not separately shown — the global empty state covers this scenario.

**Scroll behavior:** If 10 items overflow the container height on desktop, add `overflow-y: auto` with a subtle scrollbar. On mobile, the container expands to show all items (no truncation).

---

#### Zone 3 — Per-Plant Frequency Table

**Section heading:** "Care by Plant" — DM Sans, 16px, `font-weight: 600`, `color: var(--color-text-primary)`, `margin-bottom: 16px`

**Container:** `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 12px`, `padding: 24px`, `box-shadow: var(--card-shadow)`

**Data source:** `data.by_plant`, sorted by `count` DESC (most cared-for plant first). The API returns them in this order.

**Table layout:** A semantic HTML `<table>` styled as a clean, borderless data table.

```
Plant Name               Last Cared For        Total Actions
──────────────────────────────────────────────────────────
🌿 Monstera              2 days ago            15 ████████████░░
🪴 Spider Plant          1 week ago             8 ██████░░░░░░░░
🌱 Fiddle Leaf Fig       today                  4 ███░░░░░░░░░░░
```

**Table structure:**

| Column | Width | Content |
|--------|-------|---------|
| Plant Name | ~35% | Plant name with leaf icon prefix |
| Last Cared For | ~25% | Relative time string (e.g. "3 days ago", "today") using `last_action_at` |
| Total Actions | ~40% | Number + horizontal progress bar |

**Table header row:**
- `font-size: 11px`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.06em`, `color: var(--color-text-secondary)`
- `padding-bottom: 12px`, `border-bottom: 1px solid var(--color-border)`

**Table data rows:**
- `padding: 14px 0`
- `border-bottom: 1px solid var(--color-border)` on all but the last row
- `font-size: 14px`, `color: var(--color-text-primary)`

**Plant Name cell:**
- Phosphor `Plant` icon (12px, `color: var(--color-accent-primary)`, `aria-hidden="true"`), `margin-right: 8px`
- Plant name text, `font-weight: 500`
- Truncate at 1 line with ellipsis

**Last Cared For cell:**
- Relative time string. Use a simple utility:
  - `< 1 hour ago` → "just now"
  - `1–23 hours` → "X hours ago"
  - `1 day` → "yesterday" or "1 day ago"
  - `2–6 days` → "X days ago"
  - `7–13 days` → "1 week ago"
  - `≥ 14 days` → "X weeks ago"
- `color: var(--color-text-secondary)`, `font-size: 13px`
- Wrap in `<time datetime="[ISO8601]">` with `title="[full formatted date]"` for accessibility

**Total Actions cell:**
- Number: `font-size: 14px`, `font-weight: 600`, `color: var(--color-text-primary)`, `margin-right: 12px`, min-width aligned
- Progress bar: `height: 6px`, `border-radius: 3px`, `background: var(--color-border)` (track), filled portion `background: var(--color-accent-primary)`, `border-radius: 3px`
- Bar width = `(plant.count / maxCount) * 100%` where `maxCount = data.by_plant[0].count`
- Progress bar is `aria-hidden="true"` — the count number provides the data for screen readers

**Empty table state:** If `data.by_plant` is empty, do not render the table — show the global empty state instead.

**Row count:** Show all plants, no pagination. If a user has many plants (>10), the table scrolls within its container (`overflow-y: auto`, `max-height: 400px`).

---

#### States

##### State 1 — Loading (Skeleton)

Show immediately on mount while the API call is in-flight. Replace all three zones with skeleton placeholders.

**Summary Stats Bar skeleton:** Three skeleton tiles, each `height: 108px`, `border-radius: 12px`. Inner skeleton blocks:
- Top: `width: 60%`, `height: 14px`, `border-radius: 4px`
- Middle: `width: 40%`, `height: 40px`, `border-radius: 4px`, `margin: 12px 0`
- Bottom: `width: 50%`, `height: 12px`, `border-radius: 4px`

**Chart zone skeleton:** Two side-by-side blocks (55% / 45% split on desktop):
- Left: `height: 300px`, `border-radius: 12px` — represents chart container
- Right: `height: 300px`, `border-radius: 12px` — represents activity feed container

**Per-plant table skeleton:** Container `border-radius: 12px`, `padding: 24px`. 4 skeleton rows, each `height: 20px`, `border-radius: 4px`, `margin-bottom: 16px`, varying widths (100%, 85%, 70%, 55%).

All skeleton elements use shimmer animation (`background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface-alt) 50%, var(--color-border) 75%)`, `background-size: 200% 100%`, animated with `@keyframes shimmer`).

Skeleton shimmer respects `prefers-reduced-motion: reduce` — if reduced motion is preferred, use a static muted background (`var(--color-surface-alt)`) without animation.

Skeleton containers use `aria-busy="true"` on the page root, plus an `aria-live="polite"` region with `aria-label="Loading analytics data"` for screen readers.

##### State 2 — Empty State

Shown when `data.total_care_actions === 0` (user has no care actions recorded yet).

Hide all three zones. Show a single centered empty state block in the main content area:

**Empty state block:**
- `display: flex`, `flex-direction: column`, `align-items: center`, `text-align: center`
- `max-width: 420px`, centered horizontally, `margin: 64px auto`
- Illustration: A simple SVG line-art illustration of a small potted plant with a question mark above it (or Phosphor `Plant` icon at 64px, `color: var(--color-border)`) — represents "no data yet"
- **Heading:** "Your care journey starts here" — Playfair Display, 24px, `font-weight: 600`, `color: var(--color-text-primary)`, `margin-top: 24px`
- **Body:** "Water, fertilize, or repot a plant and watch your progress grow here." — DM Sans, 15px, `color: var(--color-text-secondary)`, `line-height: 1.6`, `margin-top: 8px`
- **CTA button:** "Go to my plants" — Primary button, `margin-top: 24px`, navigates to `/` (Inventory)

##### State 3 — Error State

Shown when the `GET /api/v1/care-actions/stats` API call fails (network error, 5xx, 401).

Hide all three zones. Show a centered error block:

- Phosphor `WarningCircle` icon, 48px, `color: var(--color-status-red)`
- **Heading:** "Couldn't load your analytics" — Playfair Display, 22px, `color: var(--color-text-primary)`, `margin-top: 20px`
- **Body:** "Something went wrong loading your care data. Please try again." — DM Sans, 14px, `color: var(--color-text-secondary)`, `margin-top: 8px`
- **"Try again" button:** Secondary button, `margin-top: 24px`, triggers a manual re-fetch. `aria-label="Retry loading analytics"`

**Special case — 401 error:** If the API returns 401 (session expired), do not show the retry button. Instead show: "Your session has expired. Please log in again." with a "Log in" primary button linking to `/login`.

##### State 4 — Populated (Success)

All three zones render with real data. This is the happy path described in full above.

---

#### Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Full layout as described: 3-column stats bar, 2-column middle (chart 55% + feed 45%), full-width table |
| Tablet (768–1023px) | Stats bar: 3 tiles in a row (reduced padding). Middle zone: single column — chart full width above, activity feed full width below. Table: same but with reduced column padding |
| Mobile (<768px) | Stats bar: 1 tile per row (stacked vertically). Chart and activity feed each full width, stacked. Table: hide "Last Cared For" column to save space; show Plant Name + Total Actions with bar only |

**Sidebar on mobile:** Collapses to a bottom navigation bar (consistent with existing mobile behavior across the app). Analytics icon appears in the bottom nav.

---

#### Dark Mode

All color values use CSS custom properties (`var(--color-*)`) established in SPEC-010. No hardcoded hex values in this screen except within the Recharts chart segments.

**Chart-specific dark mode guidance:**

Because Recharts renders SVG directly, colors passed as `fill` props cannot use CSS custom properties. Use a JavaScript hook to read the current theme and select the appropriate palette:

```jsx
const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

const CARE_TYPE_COLORS = {
  watering:    isDark ? '#4A7A96' : '#5B8FA8',
  fertilizing: isDark ? '#6EB88A' : '#4A7C59',
  repotting:   isDark ? '#C2956A' : '#A67C5B',
};
```

Or subscribe to a `useTheme()` context hook that returns the current theme string, and re-derive `CARE_TYPE_COLORS` reactively so the chart re-renders when the user changes theme.

**Tooltip dark mode:** Since the custom tooltip is a React component with standard HTML elements, it uses CSS custom properties and re-themes automatically.

**Specific dark mode element treatments:**

| Element | Light Value | Dark Value |
|---------|------------|-----------|
| Page background | `#F7F4EF` | `#1A1815` |
| Stat tiles | `background: #FFFFFF`, border `#E0DDD6` | `background: #242220`, border `#3C3830` |
| Stat number color | `#5C7A5C` | `#7EAF7E` |
| Chart container | `background: #FFFFFF` | `background: #242220` |
| Donut center text | `#2C2C2C` | `#EDE8DF` |
| Donut center sub-label | `#6B6B5F` | `#9B9489` |
| Activity feed container | `background: #FFFFFF` | `background: #242220` |
| Activity row divider | `#E0DDD6` | `#3C3830` |
| Activity icon: watering bg | `#EBF4F7` | `#1A2530` |
| Activity icon: fertilizing bg | `#E8F4EC` | `#1A2F22` |
| Activity icon: repotting bg | `#F4EDE8` | `#2E1A14` |
| Table container | `background: #FFFFFF` | `background: #242220` |
| Table header text | `#6B6B5F` | `#9B9489` |
| Table dividers | `#E0DDD6` | `#3C3830` |
| Progress bar track | `#E0DDD6` | `#3C3830` |
| Progress bar fill | `#5C7A5C` | `#7EAF7E` |
| Tooltip background | `#FFFFFF` | `#2C2A26` |
| Skeleton shimmer base | `#E0DDD6` | `#3C3830` |
| Skeleton shimmer highlight | `#F0EDE6` | `#2C2A26` |

---

#### Accessibility

- **Page landmark:** `<main>` wraps the content area. `<h1>` for "Care Analytics".
- **Stats bar:** Each tile is a `<div role="figure" aria-label="[N] [Label]">` so screen readers announce the complete stat.
- **Chart:** `<PieChart aria-hidden="true">` + a visually-hidden `<table>` with `aria-label="Care actions by type"` (see Zone 2 spec above). This satisfies WCAG 1.1.1 Non-text Content.
- **Legend:** `<ul>` with `<li>` for each entry. Care type label + count is sufficient — no special ARIA needed beyond the list structure.
- **Activity feed:** Semantic `<ul>/<li>` structure. Each item's accessible name is derived from visible text: "[Plant Name] — [care type] — [relative time]". Care type icons: `aria-hidden="true"`.
- **Timestamps:** `<time datetime="[ISO8601]">` with `title="[human-readable date]"` for full date on hover/focus.
- **Per-plant table:** Semantic `<table>` with `<thead>`, `<tbody>`, `<th scope="col">` for column headers. Progress bars inside each row: `aria-hidden="true"` (the count number carries the data). Table `aria-label="Care frequency by plant"`.
- **Empty state CTA:** Standard `<button>` or `<a href="/">`, no special ARIA needed.
- **Error retry:** `<button aria-label="Retry loading analytics">` so the action is unambiguous.
- **Loading state:** Page root or content container gets `aria-busy="true"` while fetching. An `aria-live="polite"` region announces "Loading care analytics…" on mount, then "Care analytics loaded" on success (or "Failed to load care analytics" on error).
- **Keyboard navigation:** All interactive elements (CTA button, retry button, theme-dependent links) are reachable by Tab. No focus traps on this page.
- **Color contrast:** All text must meet WCAG AA (4.5:1) in both light and dark modes. The donut chart segments convey data via color + the legend text — color is not the only means of conveying information (satisfies WCAG 1.4.1).
- **Focus visible:** All interactive elements show a visible focus indicator (2px sage green focus ring per design system).
- **Reduced motion:** Skeleton shimmer animation is suppressed under `prefers-reduced-motion: reduce`. No other animations on this page.

---

#### Sidebar Navigation Update (Amendment to SPEC-002)

This spec adds one item to the persistent sidebar nav established in SPEC-002. The complete updated sidebar nav order for authenticated users is:

```
🌿  My Plants         →  /
🔔  Care Due          →  /due          [urgency badge if items exist]
📊  Analytics         →  /analytics    [no badge]
🕐  History           →  /history
────────────────────────
[Avatar] [User Name]
    Log out
```

The Analytics nav item must be included in:
1. The desktop persistent sidebar (`240px` width)
2. The mobile bottom navigation bar
3. The Sidebar component's nav link array (wherever it's currently defined in the codebase)

---

#### Component Checklist for Frontend Engineer

- [ ] `AnalyticsPage.jsx` — page container, data fetching, state management
- [ ] `StatTile.jsx` — reusable stat tile (icon + number + label) — can share with ProfilePage stats if structurally compatible
- [ ] `CareDonutChart.jsx` — Recharts `PieChart` wrapper with custom legend and sr-only table
- [ ] `RecentActivityFeed.jsx` — activity list with icon, plant name, care type, relative time
- [ ] `PlantFrequencyTable.jsx` — semantic table with progress bars
- [ ] Sidebar — add Analytics nav item (update existing sidebar component)
- [ ] `useAnalyticsStats` hook (or inline `useEffect`) — fetches `GET /api/v1/care-actions/stats`, returns `{ data, loading, error }`, supports manual `refetch()`

**recharts usage note:** Confirm `recharts` is already in `package.json` before installing. If it adds unacceptable bundle weight (>100KB gzipped after tree-shaking), fall back to a pure CSS/SVG donut implementation and document the decision in `architecture-decisions.md`. Either approach must satisfy the accessible text alternative requirement.

---

#### Unit Test Requirements (T-065 Frontend)

Minimum 5 new tests required. All 135/135 existing frontend tests must continue to pass.

| Test # | Scenario | Expected Result |
|--------|----------|----------------|
| 1 | Loading state on mount | Skeleton tiles render; `aria-busy="true"` present |
| 2 | Populated state (mock API with data) | Total action count renders in stat tile; plant name renders in table; chart renders (or sr-only table shows data) |
| 3 | Empty state (`total_care_actions: 0`) | "No care history yet" heading visible; "Go to my plants" CTA renders |
| 4 | Error state (mock API 500) | Error heading renders; "Try again" retry button visible |
| 5 | Retry on error | Clicking retry triggers a second fetch call |
| 6 (bonus) | Analytics sidebar nav item | "Analytics" link renders in sidebar; routes to `/analytics` |
| 7 (bonus) | Dark mode chart colors | When `data-theme="dark"` on `<html>`, chart segment colors use dark palette |

---

---

### SPEC-012 — AI Recommendations Panel (Add/Edit Plant Page)

**Status:** Approved
**Related Tasks:** T-076 (Design), T-079 (Frontend — text flow), T-080 (Frontend — image upload flow)
**Sprint:** 17

---

#### Description

The AI Recommendations feature is the heart of Plant Guardians' value proposition: novice users who don't know their plant species or care schedules get expert-level guidance via Gemini AI in seconds. The feature lives on the **Add Plant page** and **Edit Plant page** as an optional AI assist — non-intrusive to users who already know their care schedule, immediately accessible to users who don't.

The experience is a **slide-in side panel** (desktop) or **bottom sheet** (mobile) called the **AI Advice Panel**. It is triggered by a single "Get AI Advice" button on the form. Inside the panel, the user chooses between two input modes:

- **Text mode:** Enter a plant type name (e.g., "spider plant")
- **Image mode:** Upload a plant photo for visual identification

Both modes return the same structured advice response, rendered identically. After reviewing the advice, the user can **Accept** (auto-populates the form) or **Dismiss** (closes the panel, no changes).

The panel must feel calm and botanical — not clinical or chatbot-like. It is a helpful companion, not a chat interface.

---

#### Placement on Add/Edit Plant Page

The **"Get AI Advice" button** sits immediately below the plant type / species field (or, if no species field exists, immediately above the watering schedule section). It is a **Secondary button variant** (transparent background, `#5C7A5C` text and border) with a small leaf or sparkle icon to its left.

```
┌─────────────────────────────────────┐
│  Plant Name *           [input]     │
│                                     │
│  Plant Type / Species   [input]     │
│  ✦ Get AI Advice         ← button  │
│                                     │
│  Watering Schedule      [input]     │
│  Fertilizing Schedule   [input]     │
│  Repotting Schedule     [input]     │
│  ...                                │
└─────────────────────────────────────┘
```

- Button label: `✦ Get AI Advice`
- Button variant: Secondary (see Design System Conventions)
- Button size: standard (`padding: 10px 20px`)
- On click: opens the AI Advice Panel (see below)

---

#### AI Advice Panel — Layout

**Desktop (≥ 768px):** Slide-in panel from the right edge, overlapping the page with a semi-transparent backdrop. Panel width: **480px**. Panel height: full viewport height (100vh). The rest of the page is dimmed using the overlay color (`rgba(44, 44, 44, 0.45)`). The form behind remains visible but non-interactive while the panel is open.

**Mobile (< 768px):** Bottom sheet. Slides up from the bottom of the screen. Height: up to 90vh, scrollable if content overflows. Has a drag handle at the top center (4px × 32px pill, `#E0DDD6`).

**Panel anatomy (top to bottom):**

```
┌────────────────────────────────────────┐
│  Panel header                          │
│  ← Close (X) icon button    [right]   │
│  "AI Plant Advisor"  [title]           │
│  "Identify your plant and get         │
│   personalized care tips."  [subtitle]│
├────────────────────────────────────────┤
│  Mode Toggle (Tab bar)                 │
│  [ ✎ Enter plant name ] [ 📷 Upload ] │
├────────────────────────────────────────┤
│  Input Area (changes per mode)         │
│  ... (see below for each mode)         │
├────────────────────────────────────────┤
│  Advice Results Area                   │
│  (hidden until response received)      │
├────────────────────────────────────────┤
│  CTA Footer (Accept / Dismiss)         │
│  (hidden until response received)      │
└────────────────────────────────────────┘
```

**Panel background:** `#FFFFFF` (surface)
**Panel box-shadow:** `0 8px 40px rgba(44, 44, 44, 0.18)` (left-side shadow on desktop, top-shadow on mobile)
**Panel border-radius:** `16px 0 0 16px` (desktop), `16px 16px 0 0` (mobile)
**Panel padding:** 24px (desktop), 20px (mobile)

**Panel Header:**
- Title: "AI Plant Advisor" — `font-family: 'Playfair Display'`, `font-size: 22px`, `font-weight: 600`, `color: #2C2C2C`
- Subtitle: "Identify your plant and get personalized care tips." — `font-size: 14px`, `color: #6B6B5F`
- Close button (×): Icon button variant, top-right corner of the header, `aria-label="Close AI advice panel"`. Clicking it dismisses the panel without any form changes.

---

#### Mode Toggle (Tab Bar)

A two-tab toggle bar below the header, spanning the full panel width. Tabs are pill-shaped buttons.

| State | Style |
|-------|-------|
| Active tab | Background `#5C7A5C`, text `#FFFFFF`, `border-radius: 24px` |
| Inactive tab | Background `#F0EDE6`, text `#6B6B5F`, `border-radius: 24px` |

- Tab 1: `✎ Enter plant name` — defaults to active on panel open
- Tab 2: `📷 Upload a photo`
- Switching tabs resets the input area and clears any previous advice results
- `role="tablist"`, each tab has `role="tab"`, `aria-selected`, and `aria-controls` pointing to its panel content area

---

#### Mode 1 — Text Input ("Enter plant name")

The input area shows:

1. **Label:** "What type of plant is this?" — `font-size: 14px`, `font-weight: 500`, `color: #2C2C2C`
2. **Text input:**
   - `placeholder="e.g., spider plant, peace lily, monstera"`
   - Full-width, standard input styling (`border: 1.5px solid #E0DDD6`, `border-radius: 8px`, `padding: 10px 14px`, `font-size: 16px`)
   - Max length: 200 characters (matching backend validation)
   - `aria-label="Plant type name"`
   - On focus: border becomes `#5C7A5C` (focus ring)
3. **"Get Advice" button:**
   - Primary button variant, full-width, `margin-top: 12px`
   - Label: "Get Advice"
   - `type="submit"` within a `<form>` element (supports Enter key)
   - Disabled state: when input is empty or whitespace-only

**Character counter (optional, visible at 150+ chars):** `12px`, `color: #B0ADA5`, right-aligned below the input: "143 / 200"

---

#### Mode 2 — Image Upload ("Upload a photo")

The input area shows:

1. **Upload Zone:**
   - Dashed border box, `border: 2px dashed #E0DDD6`, `border-radius: 12px`, `background: #F7F4EF`, `padding: 32px 24px`
   - Center-aligned content: a camera/leaf icon (`40px`, `color: #B0ADA5`), then "Drop a photo here" (`font-size: 16px`, `color: #6B6B5F`), then "or" (`font-size: 14px`, `color: #B0ADA5`), then a **"Browse files"** Ghost button
   - Accepts: `image/jpeg, image/png, image/webp`
   - Supports drag-and-drop onto the zone (highlight border to `#5C7A5C` on drag-over)
   - Hidden `<input type="file" accept=".jpg,.jpeg,.png,.webp">` behind the "Browse files" button
   - `aria-label="Upload a plant photo"` on the file input

2. **Image Preview (after file selected):**
   - The upload zone is replaced by:
     - A thumbnail of the selected image — `80px × 80px`, `border-radius: 8px`, `object-fit: cover`
     - File name and size: `font-size: 13px`, `color: #6B6B5F` — e.g., "plant.jpg · 2.3 MB"
     - A small ×  "Remove" ghost button next to the file info (removes selection, restores upload zone)
   - Preview container: `display: flex`, `align-items: center`, `gap: 12px`, `padding: 12px`, `background: #F0EDE6`, `border-radius: 8px`

3. **Client-side validation (before submit):**
   - **Wrong file type:** Inline error below the upload zone — "Please upload a JPEG, PNG, or WebP image." — `color: #B85C38`, `font-size: 13px`, shown with an `aria-live="polite"` region
   - **File too large (> 5MB):** Inline error — "Image must be 5MB or smaller." — same styling as above
   - Validation fires on file selection (not on submit); the "Get Advice" button remains disabled if validation fails

4. **"Get Advice" button (upload mode):**
   - Primary button, full-width, `margin-top: 16px`
   - Label: "Identify & Get Advice"
   - Disabled until a valid file is selected (no errors)

---

#### Loading State

When the user submits either mode, the panel enters loading state:

- "Get Advice" button becomes disabled and shows an inline spinner (16px spinner replacing the button label text, centered)
- The text input / file upload zone becomes disabled/read-only
- The mode toggle tabs become disabled (non-clickable)
- A subtle pulsing skeleton block appears in the results area to hint that content is incoming (3 skeleton rows, `background: #F0EDE6`, `border-radius: 4px`, animated with a shimmer from left to right — use `@keyframes shimmer`)
- `aria-busy="true"` set on the results container
- `aria-live="polite"` region announces "Loading plant advice…"
- Duration limit: if the request takes > 10 seconds, the loading state should not freeze the UI — the error state (502) will fire instead

---

#### Success State — Advice Results

On a successful API response, the loading skeleton is replaced by the structured advice panel. Render all sections listed below in order:

**1. Plant Identification Banner**

Full-width banner at the top of the results area:

- Background: `#E8F4EC` (light sage)
- Left side: A plant icon (outlined leaf) in `#4A7C59`
- Main content:
  - "Identified as" label (`font-size: 12px`, `color: #6B6B5F`, uppercase, letter-spacing)
  - Plant name: `identified_plant` value — `font-size: 18px`, `font-weight: 600`, `color: #2C2C2C`, `font-family: 'Playfair Display'`
- Right side: Confidence badge (pill)
  - `confidence: "high"` → background `#E8F4EC`, text `#4A7C59`, label "High confidence"
  - `confidence: "medium"` → background `#FDF4E3`, text `#C4921F`, label "Medium confidence"
  - `confidence: "low"` → background `#FAEAE4`, text `#B85C38`, label "Low confidence"
- Banner `border-radius: 10px`, `padding: 14px 16px`
- If confidence is "low", show a small disclaimer below the banner: "Results may be approximate. Verify with a plant expert." — `font-size: 12px`, `color: #B0ADA5`, italic

**2. Care Schedule Section**

Section heading: "Recommended Care Schedule" — `font-size: 14px`, `font-weight: 600`, `color: #2C2C2C`, `margin-top: 20px`

Three care schedule rows, each using the same row component:

```
[icon]  [label]             [value]
💧     Watering            Every 7 days
🌱     Fertilizing         Every 30 days        (or "Not typically needed" if null)
🪴     Repotting           Every 365 days       (or "Not typically needed" if null)
```

Row styling:
- Full-width row, `display: flex`, `align-items: center`, `gap: 12px`, `padding: 10px 0`, `border-bottom: 1px solid #F0EDE6`
- Icon: 20px emoji or Phosphor icon, `color: #5C7A5C`
- Label: `font-size: 14px`, `font-weight: 500`, `color: #6B6B5F`
- Value: `font-size: 14px`, `font-weight: 500`, `color: #2C2C2C`, right-aligned / pushed to the end via `margin-left: auto`
- If the interval value is `null`: display "Not typically needed" in `color: #B0ADA5`, `font-style: italic`

**3. Growing Conditions Section**

Section heading: "Growing Conditions" — same heading style, `margin-top: 20px`

Two rows using the same row component format:

```
☀️   Light                Full indirect sunlight
💦   Humidity             Moderate to high
```

Values come from `light_requirement` and `humidity_preference`.

**4. Care Tips Section**

Section heading: "Care Tips" — same heading style, `margin-top: 20px`

A text block with `care_tips` value:
- `font-size: 14px`, `line-height: 1.6`, `color: #2C2C2C`
- Background: `#F7F4EF`, `border-radius: 8px`, `padding: 14px`
- Left border accent: `3px solid #5C7A5C`

**5. Divider + CTA Footer**

`margin-top: 24px`, a `1px solid #E0DDD6` divider, then the CTA buttons (see below).

---

#### CTA Footer — Accept / Dismiss

Displayed only when advice results are showing (not during loading, not during input-only state).

Two buttons, full-width stacked (not side-by-side) to avoid accidental taps:

```
[ ✓  Accept Advice   ]   ← Primary button (full-width)
[    Dismiss          ]   ← Ghost button (full-width, margin-top: 8px)
```

**Accept Advice button:**
- Variant: Primary
- Label: "✓ Accept Advice"
- Full-width (`width: 100%`)
- On click:
  1. Maps AI response fields to the plant form fields (see Field Mapping below)
  2. Closes the AI Advice Panel
  3. Shows a brief toast: "AI advice applied! Review and save your plant." — success toast (green left border)
  4. Focus returns to the first populated field in the form

**Dismiss button:**
- Variant: Ghost
- Label: "Dismiss"
- Full-width
- On click: closes the panel; **no changes** to the form; no toast

Both buttons are `font-size: 14px`, `font-weight: 600`, `border-radius: 8px`.

---

#### Field Mapping — Accept Advice

When the user clicks "Accept Advice," the frontend maps the API response to form inputs:

| API Response Field | Form Field | Notes |
|--------------------|-----------|-|
| `identified_plant` | Plant type/species field (if present in form) | Only if the field exists and is currently empty |
| `care.watering_interval_days` | Watering schedule field | Always applied (overwrites existing value) |
| `care.fertilizing_interval_days` | Fertilizing schedule field | Only if non-null; skip if null |
| `care.repotting_interval_days` | Repotting schedule field | Only if non-null; skip if null |

**Fields NOT mapped:**
- Plant name (user-defined, intentionally not overwritten)
- Plant photo (user's own photo is not replaced)
- Any fields not listed above

**Format:** Interval fields expect a number (days). Map directly: `watering_interval_days` (integer) → the watering schedule interval input. Do not convert units; the form should accept "days" as the unit.

---

#### Error States

**1. Gemini Unavailable (502 from `/ai/advice` or `/ai/identify`)**

Display inline within the results area (not a toast — the user is in a focused panel context):

```
┌─────────────────────────────────────────┐
│  ⚠  AI advice is temporarily            │
│     unavailable. Please try again.      │
│                                         │
│     [ Try Again ]                       │
└─────────────────────────────────────────┘
```

- Container: `background: #FAEAE4`, `border-radius: 10px`, `padding: 16px`, `border: 1px solid #F5C4B4`
- Icon: warning triangle, `color: #B85C38`, 20px
- Text: "AI advice is temporarily unavailable. Please try again." — `font-size: 14px`, `color: #B85C38`
- "Try Again" button: Secondary variant, `margin-top: 12px`; re-submits the last request
- `aria-live="assertive"` on the error container so screen readers announce it immediately

**2. Empty / No Plant Name (400 from `/ai/advice`)**

Shown inline below the text input field (not the full error container):

- Text: "Please enter a plant name." — `font-size: 13px`, `color: #B85C38`, `margin-top: 6px`
- `aria-live="polite"` region

This should ideally be caught client-side (button disabled when input is empty) so this error is a fallback only.

**3. Unrecognized Plant in Image (502 from `/ai/identify` with plant-specific message)**

Same visual treatment as the Gemini Unavailable error (502 container), but message:
"We couldn't identify this plant from the photo. Try a clearer photo or enter the plant name instead."
- Include a "Switch to text mode" ghost button that switches the panel to Mode 1.

**4. Client-side file validation errors (wrong type / too large)**

Described in Mode 2 above. Shown inline below the upload zone.

---

#### Empty / Initial State (Panel Just Opened)

When the panel first opens (no query submitted yet):

- Header and mode toggle visible
- Input area is in its default state (empty text input or upload zone)
- Results area: **hidden** (not rendered, not just invisible)
- CTA footer: **hidden**
- No skeleton, no loading
- Focus is placed on the text input (Mode 1 default) upon panel open — `autoFocus` on the text input

---

#### Asking Again (Reset Flow)

After advice is shown, the user can modify their query and re-submit:
- "Search again" ghost button appears above the Plant Identification Banner (`font-size: 13px`, `color: #6B6B5F`, label "← Try a different plant")
- Clicking it clears the results area and returns focus to the input
- The CTA footer hides again
- The mode toggle re-enables

---

#### Responsive Behavior

| Breakpoint | Panel Behavior |
|-----------|---------------|
| Desktop (≥ 1024px) | Side panel, 480px wide, slides in from right, full viewport height |
| Tablet (768px–1023px) | Side panel, 400px wide (slightly narrower), same slide-in behavior |
| Mobile (< 768px) | Bottom sheet, 100% wide, max 90vh height, drag-handle at top |

On mobile bottom sheet:
- The drag handle is decorative only (no drag-to-dismiss required, but the × close button must be visible)
- Content scrolls internally within the sheet if it overflows
- The "Get AI Advice" button on the form scrolls with the form normally; pressing it triggers the bottom sheet

---

#### Dark Mode

All panel elements must use CSS custom properties. Define dark-mode overrides for:

| Token | Light | Dark |
|-------|-------|------|
| Panel background | `#FFFFFF` | `#1E1E1A` |
| Panel header text | `#2C2C2C` | `#F0EDE6` |
| Subtitle text | `#6B6B5F` | `#9E9B92` |
| Input background | `#FFFFFF` | `#2A2A25` |
| Input border | `#E0DDD6` | `#3A3A34` |
| Input text | `#2C2C2C` | `#F0EDE6` |
| Results section background | `#F7F4EF` | `#252520` |
| Plant ID banner background | `#E8F4EC` | `#1E2E22` |
| Plant ID banner text | `#4A7C59` | `#7DBF91` |
| Care row border | `#F0EDE6` | `#2E2E28` |
| Care tips background | `#F7F4EF` | `#252520` |
| Care tips left border | `#5C7A5C` | `#5C7A5C` |
| Error container background | `#FAEAE4` | `#2E1E1A` |
| Error container border | `#F5C4B4` | `#5A2E24` |
| Overlay backdrop | `rgba(44, 44, 44, 0.45)` | `rgba(0, 0, 0, 0.65)` |
| Skeleton shimmer | `#F0EDE6` → `#E0DDD6` | `#2A2A25` → `#333330` |

Dark mode is toggled via `data-theme="dark"` on the `<html>` element.

---

#### Accessibility

- **Focus trap:** When the panel opens, focus is trapped inside it. Tab cycles through: close button → mode tabs → input(s) → submit button → (after results) accept button → dismiss button → close button.
- **Focus restore:** When the panel closes (via X, Dismiss, or Accept), focus returns to the "Get AI Advice" trigger button on the form.
- **ARIA roles:**
  - Panel container: `role="dialog"`, `aria-modal="true"`, `aria-label="AI Plant Advisor"`
  - Mode toggle: `role="tablist"`, tabs have `role="tab"` and `aria-selected`
  - Results area: `role="tabpanel"`, `aria-labelledby` pointing to the active tab
  - Loading region: `aria-busy="true"` + `aria-live="polite"` announcing "Loading plant advice…"
  - Error regions: `aria-live="assertive"` (502 errors), `aria-live="polite"` (validation errors)
  - Plant identification banner: `aria-label="Identified as [plant name], [confidence] confidence"`
- **Keyboard navigation:**
  - Escape key closes the panel (same as clicking X) without changes
  - Enter in text input submits the form
  - Tab/Shift+Tab cycles through all interactive elements
  - Enter/Space on mode toggle tabs switches modes
- **Screen reader text:** The confidence badge should have a visually hidden label so screen readers say "High confidence" not just "High"
- **Color contrast:** All text meets WCAG AA minimum (4.5:1 for body text, 3:1 for large text)
- **File input label:** The file input must have a visible label ("Upload a plant photo") — never use aria-label alone without a visual label

---

#### Animation & Motion

- **Panel slide-in (desktop):** Translate from `translateX(480px)` to `translateX(0)`, duration 280ms, easing `cubic-bezier(0.4, 0, 0.2, 1)`
- **Panel slide-out (desktop):** Translate from `translateX(0)` to `translateX(480px)`, duration 240ms
- **Bottom sheet slide-up (mobile):** Translate from `translateY(100%)` to `translateY(0)`, duration 300ms
- **Results fade-in:** When advice results replace the skeleton, the results container fades in: `opacity 0 → 1`, 200ms
- **Backdrop:** Fades in at `opacity 0 → 0.45` over 200ms alongside panel entrance; fades out on close
- **Reduced motion:** All animations wrapped in `@media (prefers-reduced-motion: reduce)` — if prefers-reduced-motion is set, skip translate animations (show/hide instantly) but still fade results in (300ms opacity only, as opacity changes are generally acceptable)

---

#### Edge Cases

| Scenario | Behavior |
|----------|----------|
| User opens panel, submits, then navigates away (back button) | Panel closes, form resets or retains in-progress data per existing form behavior; no AI data applied |
| User accepts advice but then manually edits a field | The manually edited value takes precedence; Accept does not re-overwrite after closing |
| API returns `null` for all interval fields | Care Schedule section still renders with all three rows showing "Not typically needed" |
| `identified_plant` is an empty string | Skip rendering the plant ID banner; show "Plant identified" without a name (edge case fallback) |
| Image file selected, then user switches to text mode | Previous file selection is discarded; upload zone resets |
| Very long `care_tips` string | Text block scrolls within its container; the panel itself is scrollable |
| Network timeout (no response within 15s) | Treat as 502 error; show the "AI advice is temporarily unavailable" error state |
| User opens panel, switches mode tabs rapidly | Debounce tab switching by 100ms to prevent flicker |

---

#### Unit Test Requirements (T-079 and T-080)

**T-079 (text-based flow) — minimum 6 new tests:**

| Test # | Scenario | Expected Result |
|--------|----------|----------------|
| 1 | "Get AI Advice" button renders on Add Plant page | Button is visible and clickable |
| 2 | Clicking button opens AI Advice Panel | Panel renders with `role="dialog"`, focus moves to text input |
| 3 | Text input submit calls `POST /api/v1/ai/advice` | API called with `{ plant_type: "spider plant" }` |
| 4 | Successful response renders advice results | Plant name, confidence badge, care rows, and CTAs are visible |
| 5 | "Accept Advice" maps fields to form | Watering/fertilizing/repotting inputs updated; panel closes |
| 6 | "Dismiss" closes panel without changes | Form fields unchanged; panel unmounted |
| 7 (bonus) | 502 error shows inline error with retry | Error container visible; "Try Again" button rerenders |
| 8 (bonus) | Loading state disables input and button | Spinner visible; input and button have `disabled` attribute |

**T-080 (image upload flow) — minimum 6 new tests:**

| Test # | Scenario | Expected Result |
|--------|----------|----------------|
| 1 | Switching to "Upload a photo" tab shows upload zone | Upload zone renders; text input hidden |
| 2 | Selecting a valid image shows preview | Thumbnail, file name, and file size rendered |
| 3 | Selecting wrong file type shows inline error | "Please upload a JPEG, PNG, or WebP image." message visible |
| 4 | Selecting file > 5MB shows inline error | "Image must be 5MB or smaller." message visible |
| 5 | Valid image submit calls `POST /api/v1/ai/identify` | API called with multipart FormData containing the image |
| 6 | Accept Advice in image mode maps form fields | Same field mapping as text mode applied correctly |

---

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

---

### SPEC-013 — Inventory Search & Filter

**Status:** Approved
**Related Tasks:** T-082 (Design), T-084 (Frontend)
**Sprint:** #18
**Date:** 2026-04-01

---

#### Description

An enhanced Plant Inventory page (`/`) that allows users to find specific plants within a growing collection using a real-time search input and a status filter strip. This feature is critical for users who have accumulated more than ~8 plants and find scrolling unwieldy. The controls must feel native to the existing Japandi aesthetic — quiet and purposeful, not noisy.

The search and filter controls live at the top of the plant grid, below the page title bar. They do not replace the existing "Add Plant" button or page heading — they integrate into the existing action bar row.

---

#### Layout

**Desktop (≥1024px):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  My Plants              [3 plants]                    [+ Add Plant] │
├─────────────────────────────────────────────────────────────────────┤
│  [🔍 Search plants...                          ✕]                   │
│  [All] [Overdue] [Due Today] [On Track]           Showing 3 plants  │
├─────────────────────────────────────────────────────────────────────┤
│  [Card] [Card] [Card]                                               │
│  [Card] [Card] [Card]                                               │
└─────────────────────────────────────────────────────────────────────┘
```

- Search input: full-width row, `max-width: 480px`, left-aligned, `margin-bottom: 12px`
- Filter strip + result count: single flex row, `justify-content: space-between`, `align-items: center`, `margin-bottom: 24px`
- Filter strip (left): pill tabs for All / Overdue / Due Today / On Track
- Result count (right): muted label, hidden when no filters are active

**Tablet (768–1023px):**
- Search input: full width
- Filter strip: full width, scrollable horizontally if needed (no wrap), result count below strip on its own line

**Mobile (<768px):**
- Search input: full width, `margin-bottom: 12px`
- Filter strip: horizontally scrollable, no wrapping, result count below on its own line, `font-size: 12px`
- "Add Plant" button: remains fixed at top right of page title bar (icon-only on mobile — `+` icon, 40px circle)

---

#### User Flow

1. User arrives at `/` and sees their plant grid as normal (no filters active).
2. **Search path:**
   a. User clicks the search input and types a plant name (e.g., "pothos").
   b. After 300ms of inactivity (debounce), a `GET /api/v1/plants?search=pothos` request is fired.
   c. The grid updates to show only matching plants. A result count label appears: "Showing 2 plants".
   d. If 0 results, the grid is replaced by the no-search-match empty state.
   e. User clicks the ✕ clear button (or clears the input manually). The query is cleared and the full plant list re-fetches. Result count disappears.
3. **Status filter path:**
   a. User clicks "Overdue" in the filter strip.
   b. Immediately (no debounce), a `GET /api/v1/plants?status=overdue` request is fired.
   c. The grid updates. Result count appears: "Showing 1 plant".
   d. If 0 results, the no-filter-match empty state is shown.
   e. User clicks "All" to reset the status filter to no filter. Full list re-fetches.
4. **Combined path:**
   a. User has typed "spider" in the search input AND clicked "Due Today" in the filter.
   b. Request fired: `GET /api/v1/plants?search=spider&status=due_today`
   c. Only plants matching both criteria are shown.
   d. Clearing the search input (✕) removes the `search` param; the status filter remains active. Result re-fetches with status only.
   e. Clicking "All" in the filter strip removes the `status` param; if a search query is present, it stays. Result re-fetches with search only.
5. User clicks a plant card → navigates to plant detail page. Back navigation returns to inventory with filters still active (preserve state via React state or URL params).

---

#### Components

##### 1. Search Input (`PlantSearchInput`)

**Anatomy:**
- Container: `position: relative`, full width up to `max-width: 480px`
- Left icon: magnifier (`MagnifyingGlass` from Phosphor, 18px, `color: var(--color-text-secondary)`) — positioned absolutely inside the input, `left: 14px`, vertically centered, not interactive
- `<input type="search">`: `height: 44px`, `border: 1.5px solid var(--color-border)`, `border-radius: 8px`, `background: var(--color-surface)`, `padding: 0 40px 0 42px`, `font-size: 15px`, `color: var(--color-text-primary)`, `font-family: DM Sans`
  - `placeholder`: "Search plants…" (`color: var(--color-text-disabled)`)
  - `aria-label`: "Search plants"
  - `autocomplete="off"`, `spellcheck="false"`
- Clear button (✕): appears only when the input has a non-empty value
  - Positioned absolutely, `right: 12px`, vertically centered
  - Icon button variant, 24px circle, `X` icon (Phosphor `X`, 14px)
  - `aria-label="Clear search"`
  - Clicking clears the input value and re-triggers fetch with no search param
- Focus state: `border-color: var(--color-border-focus)`, `box-shadow: 0 0 0 3px rgba(92,122,92,0.15)`
- Typing: debounce 300ms before calling the fetch. During the debounce window, the clear button is still visible and clicking it cancels any pending debounce and fires immediately.

**States:**
| State | Visual |
|-------|--------|
| Default (empty) | Border `var(--color-border)`, no ✕ button |
| Focused (empty) | Sage focus ring, no ✕ button |
| Typing | ✕ button visible, no fetch yet (within debounce window) |
| Searching | ✕ visible; skeleton grid shown (debounce fired, awaiting response) |
| Has results | ✕ visible; grid shows filtered results |
| Cleared | ✕ disappears; grid reloads all plants |

---

##### 2. Status Filter Strip (`PlantStatusFilter`)

A horizontal row of pill-shaped tab buttons for filtering by care status.

**Anatomy:**
- Container: `display: flex`, `gap: 8px`, `flex-wrap: nowrap`, `overflow-x: auto`
- 4 tab pills: **All**, **Overdue**, **Due Today**, **On Track**
- Each pill:
  - `height: 36px`, `padding: 0 16px`, `border-radius: 24px`, `font-size: 14px`, `font-weight: 500`, `white-space: nowrap`
  - `border: 1.5px solid var(--color-border)`
  - Default (inactive): `background: var(--color-surface)`, `color: var(--color-text-secondary)`, `border-color: var(--color-border)`
  - Hover: `background: var(--color-surface-alt)`, `border-color: var(--color-accent-primary)`, `color: var(--color-text-primary)`
  - Active (selected): see color table below
  - Transition: `all 0.15s ease`
  - `role="tab"` per pill; container has `role="tablist"`, `aria-label="Filter by care status"`

**Active pill colors by status:**

| Pill | Active Background | Active Text | Active Border |
|------|-------------------|-------------|---------------|
| All | `var(--color-accent-primary)` `#5C7A5C` | `#FFFFFF` | none |
| Overdue | `#FAEAE4` | `#B85C38` | `1.5px solid #B85C38` |
| Due Today | `#FDF4E3` | `#C4921F` | `1.5px solid #C4921F` |
| On Track | `#E8F4EC` | `#4A7C59` | `1.5px solid #4A7C59` |

- Default selected tab on page load: **All**
- Clicking any tab triggers an immediate fetch (no debounce)
- Clicking the already-active tab does nothing (no extra fetch)
- Keyboard: `←`/`→` arrow keys navigate between tabs (roving tabindex pattern); `Enter`/`Space` activates; tab strip is a single tab stop

---

##### 3. Result Count Label (`PlantResultCount`)

A single line of muted text shown to the right of the filter strip (desktop) or below it (mobile/tablet).

- **Content:** "Showing N plant" / "Showing N plants" (pluralize correctly)
- **Hidden:** when no search query AND filter is "All" (i.e., no filters active — showing the default full list)
- **Visible:** whenever either a search query OR a non-All filter is active
- Typography: `font-size: 14px`, `color: var(--color-text-secondary)`, `font-style: normal`
- `aria-live="polite"` — screen readers announce count changes after each fetch
- `aria-atomic="true"` — full text is announced, not just the changed portion
- The count reflects the total number of items returned by the API (not paginated results, but total)
- Container: `<span role="status">` wrapping the text

---

##### 4. Skeleton Grid (loading state)

Shown while a fetch is in progress (after debounce fires or filter clicked).

- Render the same grid layout (3-col desktop, 2-col tablet, 1-col mobile) with 6 skeleton cards
- Each skeleton card matches the plant card dimensions and layout:
  - Photo area: `height: 180px`, `border-radius: 12px 12px 0 0`, `background: var(--color-surface-alt)`, animated shimmer
  - Body lines: two horizontal bars (name: 60% width, type: 40% width), `height: 14px`, `border-radius: 4px`, `background: var(--color-surface-alt)`, shimmer
  - Badge area: one bar at 30% width, `height: 20px`, `border-radius: 24px`
- Shimmer animation: `background: linear-gradient(90deg, var(--color-surface-alt) 25%, rgba(255,255,255,0.6) 50%, var(--color-surface-alt) 75%)`, `background-size: 200% 100%`, `animation: shimmer 1.4s infinite`
- `aria-busy="true"` on the grid container while loading; `aria-busy="false"` when done
- Respect `prefers-reduced-motion`: if reduced motion is preferred, use `opacity: 0.5` pulse instead of shimmer slide
- Number of skeletons shown: 6 (or the number of plants from the previous fetch, whichever is smaller — use 6 as default)

---

#### Empty States

There are three distinct empty states. Each must be distinguishable in message and visual from the others.

---

##### Empty State A — No Plants Yet (baseline, existing)

**Trigger:** User has zero plants in their account (API returns empty array with no filters active).

**Visual:**
- Centered in content area (vertically + horizontally)
- SVG illustration: small potted plant, line art, `color: var(--color-accent-primary)` at reduced opacity (30%)
- Heading: "Your garden is waiting." (`Playfair Display`, 24px, `var(--color-text-primary)`)
- Subtext: "Add your first plant to start tracking your care schedule." (14px, `var(--color-text-secondary)`)
- CTA: "Add Your First Plant" — Primary button, links to `/plants/new`

*This state is unchanged from SPEC-002. It must be preserved and rendered when there are truly no plants at all — do not show this state if filters are active.*

---

##### Empty State B — No Search Match

**Trigger:** A search query is active AND the API returns an empty array.

**Visual:**
- Centered in content area
- SVG illustration: magnifying glass with a small leaf inside, outlined, `color: var(--color-text-disabled)`, size 80px — or use Phosphor `MagnifyingGlass` icon at 64px
- Heading: "No plants match your search." (DM Sans, 18px, `font-weight: 600`, `var(--color-text-primary)`)
- Subtext: "Try a different name or clear your search to see all plants." (14px, `var(--color-text-secondary)`)
- Clear button: Ghost variant, "Clear search" — clicking clears the search input and re-fetches all plants
- Do NOT show the "Add Plant" CTA here (it would be confusing)

---

##### Empty State C — No Status Filter Match

**Trigger:** A status filter (Overdue, Due Today, or On Track) is active AND the API returns an empty array. No search query is active.

**Visual:**
- Centered in content area
- SVG illustration: a small checkmark or leaf with a subtle glow — use Phosphor `CheckCircle` icon at 64px, `color: var(--color-text-disabled)`
- Heading (dynamic by filter):
  - Overdue: "No plants are overdue." 
  - Due Today: "Nothing is due today."
  - On Track: "No plants are fully on track yet."
- Subtext (dynamic by filter):
  - Overdue: "Great work — all your plants are cared for." (`var(--color-status-green)` tint on heading if desired)
  - Due Today: "You're all caught up for now."
  - On Track: "Try adding care schedules to your plants."
- Reset button: Secondary variant, "Show all plants" — clicking sets filter back to "All" and re-fetches
- Heading `font-size`: 18px, `font-weight: 600`, DM Sans

---

##### Empty State D — No Combined Match

**Trigger:** Both a search query AND a non-All status filter are active AND the API returns an empty array.

**Visual:**
- Same icon as Empty State B (magnifying glass)
- Heading: "No plants match your search and filter."
- Subtext: "Try adjusting your search or filter to find your plants."
- Two buttons side by side (flex row, `gap: 12px`):
  - Ghost: "Clear search" — clears search query, keeps filter active
  - Secondary: "Reset filter" — resets filter to All, keeps search query active
- On mobile: stack buttons vertically

---

#### Dark Mode

All new components must use CSS custom properties exclusively. No hardcoded hex values. The following token mappings apply in dark mode (assumed defined in `:root[data-theme="dark"]`):

| Token | Light value | Dark value |
|-------|------------|------------|
| `--color-surface` | `#FFFFFF` | `#1E1E1A` |
| `--color-surface-alt` | `#F0EDE6` | `#2A2A25` |
| `--color-border` | `#E0DDD6` | `#3A3A34` |
| `--color-border-focus` | `#5C7A5C` | `#7A9E7A` |
| `--color-text-primary` | `#2C2C2C` | `#E8E5DE` |
| `--color-text-secondary` | `#6B6B5F` | `#9E9B92` |
| `--color-text-disabled` | `#B0ADA5` | `#5A5A52` |
| `--color-accent-primary` | `#5C7A5C` | `#7A9E7A` |
| `--color-background` | `#F7F4EF` | `#141410` |

Filter strip pill active states in dark mode follow the same color logic but with slightly reduced saturation to avoid harshness. The shimmer animation in dark mode uses darker surface values.

The search input in dark mode: `background: var(--color-surface)`, `border-color: var(--color-border)`, placeholder text `var(--color-text-disabled)`.

---

#### Responsive Behavior

| Breakpoint | Search Input | Filter Strip | Result Count | Grid |
|-----------|--------------|--------------|--------------|------|
| Desktop ≥1024px | Max-width 480px, left-aligned | Flex row, no scroll | Right of filter strip, same line | 3 columns |
| Tablet 768–1023px | Full width | Flex row, `overflow-x: auto`, no wrap | Below filter strip | 2 columns |
| Mobile <768px | Full width | `overflow-x: auto`, `padding-bottom: 4px` (for scroll indicator) | Below filter strip, `font-size: 12px` | 1 column |

On tablet and mobile, the filter strip scrollbar should be hidden visually (`::-webkit-scrollbar { display: none }`) while still being scrollable. Provide a fade-out gradient on the right edge of the strip container to hint at hidden pills.

---

#### Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Search input label | `aria-label="Search plants"` on `<input>` |
| Clear button | `aria-label="Clear search"` on the ✕ button |
| Filter strip keyboard nav | `role="tablist"` on container, `role="tab"` on each pill, `aria-selected="true/false"`, roving tabindex (active pill: `tabindex="0"`, others: `tabindex="-1"`), `←`/`→` arrow key navigation |
| Loading state | `aria-busy="true"` on grid container during fetch; `aria-busy="false"` on completion |
| Result count live region | `<span role="status" aria-live="polite" aria-atomic="true">Showing N plants</span>` |
| Empty states | Each empty state container has `role="status"` and descriptive text that is read aloud |
| Focus on filter change | Focus remains on the clicked filter pill — do not move focus programmatically after filter fires |
| Focus on search clear | After clicking ✕, move focus back to the search input |
| Color contrast | All text and interactive states must meet WCAG AA (4.5:1 for normal text, 3:1 for large text) |
| Keyboard tab order | Page title → Search input → Filter strip (single tab stop) → Plant grid cards → Add Plant button |
| Touch targets | All interactive elements ≥44×44px touch target, even if visually smaller |

---

#### States Summary

| State | Trigger | Behavior |
|-------|---------|----------|
| **Default** | Page load, no filters | Full plant list, no result count, "All" filter active |
| **Typing** | User types in search | ✕ button appears, no fetch yet (within 300ms debounce window) |
| **Loading** | Debounce fires or filter clicked | Skeleton grid shown, `aria-busy="true"` on grid |
| **Results** | Fetch completes with ≥1 result | Grid updates, result count visible |
| **No search match** | Fetch returns empty (search active) | Empty State B shown |
| **No filter match** | Fetch returns empty (status filter, no search) | Empty State C shown |
| **No combined match** | Fetch returns empty (both filters active) | Empty State D shown |
| **No plants (baseline)** | Fetch returns empty, no filters active | Empty State A shown |
| **Error** | Fetch fails (network error / 5xx) | Inline error banner: "Could not load plants. Try again." with retry button; existing content stays visible |
| **Clear search** | User clicks ✕ or empties input | Query cleared, fetch fires immediately with remaining active filters |
| **Reset filter** | User clicks "All" pill | Status param cleared, fetch fires immediately with remaining search query |
| **Reset all** | No search + filter = All | Result count hidden, full list shown |

---

#### Error State (Fetch Failure)

If the `GET /api/v1/plants` request fails:
- Do not clear the existing grid — keep whatever was last rendered
- Show an inline alert banner below the filter strip (above the grid):
  - Background: `#FAEAE4`, border: `1px solid #B85C38`, `border-radius: 8px`, `padding: 12px 16px`
  - Icon: `WarningCircle` (Phosphor, 18px, `color: #B85C38`) + text: "Could not load plants. Please try again."
  - Retry button (Ghost): "Try again" — retriggers the last fetch with the same params
  - `role="alert"` on the banner so screen readers announce it immediately
- Auto-dismiss the error banner once a successful fetch completes

---

#### URL Parameter Persistence (Optional Enhancement)

For improved UX on page refresh and back-navigation: sync search and filter state to URL params.

- Search query → `?search=pothos`
- Status filter → `?status=overdue`
- Combined → `?search=pothos&status=overdue`
- On page load: read URL params and pre-populate the search input and filter strip accordingly, then fire the initial fetch with those params

This is optional but recommended. If implemented, use `replaceState` (not `pushState`) so each keystroke does not create a new browser history entry. Only update URL on filter strip changes and on search debounce fire (not on every keystroke).

---

#### Unit Test Requirements (T-084)

Minimum 6 new tests:

| Test # | Scenario | Expected Result |
|--------|----------|----------------|
| 1 | Search input typed → debounce fires after 300ms | `GET /api/v1/plants?search=pothos` called after 300ms delay |
| 2 | Status filter clicked → immediate fetch | `GET /api/v1/plants?status=overdue` called without debounce |
| 3 | Combined search + filter | Request fired with both `search` and `status` params simultaneously |
| 4 | Empty state (no search match) | Empty State B component rendered when API returns `[]` with search active |
| 5 | Clear button (✕) clears search, re-fetches | Input clears, fetch fires with no `search` param, focus returns to input |
| 6 | Skeleton cards shown during fetch | Skeleton grid renders while request is pending; disappears when resolved |
| 7 (bonus) | Clicking "All" resets filter, re-fetches | `status` param removed from request; result count disappears |
| 8 (bonus) | Result count label pluralizes correctly | "Showing 1 plant" vs "Showing 3 plants" |

---

*SPEC-013 written by Design Agent on 2026-04-01 for Sprint #18.*

---

### SPEC-014 — Care Streak Tracker

**Status:** Approved
**Related Tasks:** T-089 (Design), T-091 (Frontend)
**Sprint:** #19

#### Description

The Care Streak Tracker is a motivational feature that rewards users for building a daily care habit. It tracks consecutive calendar days on which the user logged at least one care action (watering, fertilizing, or repotting any plant). The feature surfaces in two places: (1) a prominent streak section on the Profile page, and (2) a compact indicator in the sidebar nav that surfaces the streak count without requiring a trip to the Profile page.

Tone: warm and encouraging. Plant Guardians exists for plant-killers trying to do better. The streak should feel like a gentle coach, not a punishing task-tracker. Milestone moments (7, 30, 100 days) deserve genuine celebration — these users have done something genuinely hard.

---

#### API Source

`GET /api/v1/care-actions/streak?utcOffset={offset}` — authenticated endpoint.

Response shape:
```json
{
  "data": {
    "currentStreak": 7,
    "longestStreak": 12,
    "lastActionDate": "2026-04-05"
  }
}
```

- `currentStreak` — 0 if no active streak; N if the user has logged care actions on N consecutive calendar days (including today if an action was logged today)
- `longestStreak` — the highest consecutive-day count this user has ever achieved
- `lastActionDate` — the local-timezone date of the most recent care action; `null` if the user has never logged a care action

`utcOffset` param: integer, minutes offset from UTC (-840 to +840). The frontend should pass `new Date().getTimezoneOffset() * -1` to ensure streak calculation aligns with the user's local calendar days.

---

#### Streak States

| State | Condition | Description |
|-------|-----------|-------------|
| **New User / No Actions** | `currentStreak = 0` AND `lastActionDate = null` | User has never logged a care action. Show empty-state CTA. |
| **Streak Broken** | `currentStreak = 0` AND `lastActionDate` is not null AND is older than yesterday | User had a streak but missed at least one day. Show broken-state with sympathetic message. |
| **Active — Early (1–6 days)** | `currentStreak` 1–6 | Building momentum. Warm, encouraging tone. Leaf icon. |
| **Active — Established (7–29 days)** | `currentStreak` 7–29 | Strong habit forming. Elevated tone. Flame icon from day 7 onwards. |
| **Milestone: 7 days** | `currentStreak === 7` | One-week milestone. Celebration animation fires. |
| **Active — Extended (8–29 days)** | `currentStreak` 8–29 | Post-milestone continuation. Flame icon, elevated message. |
| **Milestone: 30 days** | `currentStreak === 30` | One-month milestone. Celebration animation fires. |
| **Active — Long (31–99 days)** | `currentStreak` 31–99 | Long-haul engagement. Enthusiastic tone. |
| **Milestone: 100 days** | `currentStreak === 100` | Century milestone. Biggest celebration animation. |
| **Active — Century+ (100+ days)** | `currentStreak > 100` | Legendary territory. Sustained milestone treatment. |

**Milestone trigger rule:** celebration animation fires when `currentStreak` equals exactly 7, 30, or 100. Users already past these thresholds (e.g., `currentStreak = 45`) do not see a celebration — they missed it in a prior session. The `currentStreak = 100` threshold also acts as a permanent milestone: users with streaks > 100 keep the 100-day milestone badge visible.

---

#### Visual Design — Profile Page Streak Section

**Placement:** Below the three existing stat tiles ("Plants in care", "Days as a Guardian", "Care actions completed") as a full-width card. The streak section is visually distinct — it has more visual weight than the stat tiles because it is the app's primary motivational element.

---

##### Streak Card (Active State — streak ≥ 1)

**Container:**
- `background: var(--color-streak-tile-bg)`
- `border-radius: 12px`
- `padding: 32px`
- `border: 1.5px solid var(--color-border)` — default border
- For milestone days only: add `border-left: 4px solid var(--color-streak-tile-border-milestone)` and change background to `var(--color-streak-tile-bg-milestone)`

**Section heading row (top of card):**
- Left: Label "Your Care Streak" — DM Sans, `font-size: 18px`, `font-weight: 600`, `color: var(--color-text-primary)`
- Right (desktop only): small pill showing last action date — "Last cared: [relative date, e.g., 'today' or '2 days ago']" — `font-size: 12px`, `color: var(--color-text-secondary)`, `background: var(--color-surface-alt)`, `border-radius: 24px`, `padding: 4px 10px`

**Tile body — two-column grid (desktop) / stacked (mobile):**

**Left tile — Current Streak:**
- Icon:
  - Streaks 1–6 days: Phosphor `Plant` icon, 40px, `color: var(--color-streak-icon-leaf)`
  - Streaks 7+ days: Phosphor `Fire` icon, 40px, `color: var(--color-streak-icon-fire)`
- Streak number: Playfair Display, `font-size: 48px`, `font-weight: 600`, `color: var(--color-streak-number)`, `line-height: 1`
  - Accompanied by `aria-label="Current care streak: [N] days"` on the container
- Sub-label: "day streak" — DM Sans, `font-size: 14px`, `color: var(--color-streak-label)`, lowercase, `margin-top: 4px`
- Milestone badge (conditional — only when `currentStreak === 7`, `30`, or `100+`):
  - Pill badge positioned below the sub-label
  - Content per milestone:
    - 7 days: "🎉 One week!"
    - 30 days: "🌟 One month!"
    - 100+ days: "🏆 100 days!"
  - Style: `background: var(--color-streak-milestone-badge-bg)`, `color: var(--color-streak-milestone-badge-text)`, `border: 1px solid var(--color-streak-milestone-badge-border)`, `border-radius: 24px`, `padding: 4px 12px`, `font-size: 12px`, `font-weight: 500`
  - `aria-label="Milestone: [N] day streak"` on the badge element

**Right tile — Longest Streak:**
- Icon: Phosphor `TrendUp`, 28px, `color: var(--color-streak-secondary-number)`
- Number: Playfair Display, `font-size: 32px`, `font-weight: 600`, `color: var(--color-streak-secondary-number)`
  - `aria-label="Longest streak: [N] days"` on the container
- Sub-label: "personal best" — DM Sans, `font-size: 13px`, `color: var(--color-streak-label)`, italic, `margin-top: 4px`
- If `longestStreak === currentStreak` and streak ≥ 7: add small note "(current record!)" in `color: var(--color-streak-icon-leaf)`, `font-size: 12px`

**Motivational message (full width, below tile body):**
- `margin-top: 20px`, `padding-top: 16px`, `border-top: 1px solid var(--color-border)`
- `aria-live="polite"` on this container so screen readers announce it when data loads
- Message content by state:

| `currentStreak` | Message | Weight |
|-----------------|---------|--------|
| 1 | "Great start! 🌱 You've begun your streak." | 400 |
| 2–6 | "Keep it up! [N] days and counting." | 400 |
| 7 | "One week strong! 🌿 You're building a real habit." | 500 |
| 8–29 | "You're on a roll — [N] days of consistent care!" | 400 |
| 30 | "30 days! 🌟 You're officially no longer a plant-killer." | 600 |
| 31–99 | "Your plants are so lucky to have you. [N] days!" | 400 |
| 100 | "100 days! 🏆 You are a certified Plant Guardian." | 600 |
| >100 | "[N] days. Legendary. Your plants will outlive us all." | 500 |

- Message `font-size: 14px` (600-weight messages: `font-size: 15px`)
- Active streak (1–6): `color: var(--color-text-secondary)`
- Active streak (7+): `color: var(--color-streak-icon-leaf)` (sage green — positive reinforcement)
- Milestone messages: `color: var(--color-streak-icon-leaf)`, `font-size: 15px`

---

##### Streak Card — Empty State (New User / No Actions)

When `currentStreak = 0` and `lastActionDate = null`.

Replace the tile body entirely with a centered illustration block:
- Phosphor `Plant` icon, 56px, `color: var(--color-streak-empty-icon)`, `margin-bottom: 16px`
- Heading: "Start your streak today!" — Playfair Display, 20px, `color: var(--color-text-primary)`
- Body: "Log your first care action to begin your streak. Come back every day and watch it grow." — DM Sans, 14px, `color: var(--color-text-secondary)`, `max-width: 400px`, centered, `line-height: 1.6`, `margin-top: 8px`
- CTA button: "Go to your plants" — Secondary variant, links to `/` (inventory), `margin-top: 20px`
- No "personal best" tile shown — there is no data yet

Section heading still reads "Your Care Streak." The card has the default border (no milestone accent).

---

##### Streak Card — Broken State (Streak Lost)

When `currentStreak = 0` and `lastActionDate` is not null.

Show the streak tile with broken/muted treatment:
- Left tile — Current Streak:
  - Icon: Phosphor `Plant` (wilted treatment — use muted color `var(--color-streak-broken-icon)`, 40px)
  - Streak number: "0" in Playfair Display, 48px, `color: var(--color-streak-broken-icon)` (muted)
  - Sub-label: "day streak"
  - No milestone badge
- Right tile — Longest Streak: shown normally (personal best is preserved as encouragement)
- Motivational message: "Your streak ended — but that's okay. 🌱 Every day is a fresh start." — 14px, `color: var(--color-text-secondary)`, neutral tone (do not use warning colors; this is sympathetic, not punishing)
- Card border: default (no milestone accent). Background: default tile background.
- The "last action date" pill still appears in the heading row showing when they last cared for a plant.

---

#### Milestone Celebration Animation

Triggered on the Profile page when the streak tile mounts and `currentStreak` is exactly 7, 30, or 100.

**Trigger logic:**
1. On mount, check `currentStreak` value
2. Check `sessionStorage.getItem(`streak_celebrated_${currentStreak}`)` — if already set, do NOT trigger
3. If not previously celebrated: fire the animation, then set `sessionStorage.setItem(`streak_celebrated_${currentStreak}`, 'true')`
4. This ensures the celebration fires at most once per browser session, even if the user navigates away and back

**Animation:**
- Confetti burst using `canvas-confetti` (or equivalent lightweight library — no heavy deps)
- Colors: `['#5C7A5C', '#A67C5B', '#C4921F', '#FFFFFF', '#4A7C59']`
- `particleCount`: 60 (7-day), 90 (30-day), 130 (100-day)
- `spread`: 80
- `origin`: `{ x: 0.5, y: 0.75 }` — centered below the streak number
- `startVelocity`: 35
- Duration: ~2.5 seconds via gravity decay
- The streak card itself also gets a brief "pop": `scale(1.0) → scale(1.04) → scale(1.0)`, duration `0.4s`, easing `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring — same as the "mark as done" celebration in SPEC-005)

**`prefers-reduced-motion: reduce`:**
- Skip confetti burst entirely
- Skip scale animation
- The milestone badge and motivational message are ALWAYS displayed regardless of motion preference — information must never be hidden behind animation

---

#### Compact Sidebar Streak Indicator

**Location:** In the App Shell sidebar (`AppShell.jsx` or the sidebar component), placed between the navigation links and the bottom user profile section.

**Visibility rule:** Rendered only when `currentStreak ≥ 1`. Not rendered (not just hidden) when `currentStreak = 0`. This keeps the sidebar clean for new users and users who have lost their streak.

**Interaction:** Clicking the indicator navigates to `/profile` (the Profile page). This doubles as a shortcut to the streak detail view.

---

##### Sidebar Expanded (Desktop, 240px)

Compact pill below the nav links:
```
┌─────────────────────────────────┐
│  🔥  7 day streak               │
└─────────────────────────────────┘
```

- Container: `display: flex`, `align-items: center`, `gap: 8px`, `padding: 8px 16px`, `margin: 4px 12px 8px`, `background: var(--color-streak-sidebar-bg)`, `border-radius: 8px`, cursor: pointer
- Hover: `background` darkens slightly — `rgba(92,122,92,0.14)`, `transition: background 0.15s ease`
- Icon:
  - Streaks 1–6: Phosphor `Plant`, 18px, `color: var(--color-streak-icon-leaf)`
  - Streaks 7+: Phosphor `Fire`, 18px, `color: var(--color-streak-icon-fire)`
- Text: streak count in `font-size: 14px`, `font-weight: 600`, `color: var(--color-text-primary)` + " day streak" in `font-size: 12px`, `color: var(--color-text-secondary)`
- `aria-label="Care streak: [N] days. Go to your profile."` on the container
- `role="link"` (or use an actual `<a>` wrapping the pill)
- `tabindex="0"`, keyboard activatable with Enter/Space

##### Sidebar Collapsed / Mobile Drawer Closed

When the sidebar is in icon-only or collapsed mode (tablet/mobile where the sidebar is a hamburger-triggered drawer):
- The streak indicator is revealed inside the open drawer using the same expanded layout as desktop
- On the collapsed icon sidebar (if ever implemented): show the icon alone with a small count badge overlaid at top-right:
  - Badge: 16px × 16px circle, `background: var(--color-streak-sidebar-badge-bg)`, `color: #FFFFFF`, `font-size: 10px`, `font-weight: 700`, `border-radius: 50%`
  - Counts ≥ 100 display as "99+"

**Loading behavior:** The sidebar indicator simply does not render until the streak API call resolves. No skeleton shown in the sidebar (avoids visual noise in a persistent navigation element).

---

#### Loading State

**Profile page streak section:**
- While `GET /api/v1/care-actions/streak` is in-flight: render a skeleton shimmer block in place of the streak card
- Skeleton structure:
  - Full-width container with `border-radius: 12px`, matching the card dimensions (~160px height)
  - Two side-by-side shimmer rectangles (`height: 100px`, `border-radius: 8px`, `background: var(--color-skeleton)`) representing the left and right tiles
  - Shimmer animation: same `@keyframes shimmer` used elsewhere in the app (left-to-right gradient sweep)
  - `aria-busy="true"` on the streak section container; `aria-label="Loading streak data"` on the skeleton wrapper

**Sidebar indicator:** No loading skeleton. Indicator simply absent until data resolves.

---

#### Dark Mode Token Definitions

All new CSS custom properties added to `design-tokens.css` in both `[data-theme="light"]` and `[data-theme="dark"]` blocks:

| Token | Light Value | Dark Value |
|-------|-------------|------------|
| `--color-streak-tile-bg` | `#FFFFFF` | `#1E2220` |
| `--color-streak-tile-bg-milestone` | `#F7FAF7` | `#1C2419` |
| `--color-streak-tile-border-milestone` | `#5C7A5C` | `#5C7A5C` |
| `--color-streak-icon-fire` | `#C4921F` | `#D4A832` |
| `--color-streak-icon-leaf` | `#5C7A5C` | `#6B9B6B` |
| `--color-streak-number` | `#2C2C2C` | `#F0EDE6` |
| `--color-streak-label` | `#6B6B5F` | `#9B9B8F` |
| `--color-streak-secondary-number` | `#6B6B5F` | `#9B9B8F` |
| `--color-streak-milestone-badge-bg` | `#FDF4E3` | `#2A2518` |
| `--color-streak-milestone-badge-text` | `#C4921F` | `#D4A832` |
| `--color-streak-milestone-badge-border` | `#C4921F` | `#D4A832` |
| `--color-streak-sidebar-bg` | `rgba(92, 122, 92, 0.08)` | `rgba(107, 155, 107, 0.12)` |
| `--color-streak-sidebar-badge-bg` | `#C4921F` | `#D4A832` |
| `--color-streak-broken-icon` | `#B0ADA5` | `#6B6B60` |
| `--color-streak-empty-icon` | `#B8CEB8` | `#4A5E4A` |

Note: `--color-skeleton` is assumed to already exist from prior token migrations. If not, add: light `#E0DDD6`, dark `#2E3330`.

---

#### Responsive Behavior

| Breakpoint | Profile Page | Sidebar |
|-----------|--------------|---------|
| Desktop (≥1024px) | Streak card below stat tiles; current + longest in 2-col grid inside card | Expanded pill in left sidebar (240px); always visible when streak ≥ 1 |
| Tablet (768–1023px) | Same layout, `padding: 24px`; tiles remain 2-col | Sidebar collapsed to hamburger; indicator appears inside the open drawer |
| Mobile (<768px) | Streak card full-width below stats; current streak and longest streak tiles stack vertically (single column); CTA full-width | Inside mobile drawer (opened via hamburger); same expanded layout as desktop |

---

#### Accessibility Summary

| Requirement | Implementation |
|-------------|---------------|
| Streak count | `aria-label="Current care streak: [N] days"` on the number container |
| Longest streak | `aria-label="Longest streak: [N] days"` on the personal best container |
| Milestone badge | `aria-label="Milestone: [N] day streak"` on the badge element |
| Motivational message | `aria-live="polite"` on the message container — announced to screen readers after data loads |
| Sidebar indicator | `role="link"`, `aria-label="Care streak: [N] days. Go to your profile."`, keyboard activatable |
| Loading skeleton | `aria-busy="true"` on streak section during fetch; `aria-busy="false"` when resolved |
| Confetti animation | Purely decorative — no ARIA; always respects `prefers-reduced-motion: reduce` |
| Milestone badge visibility | Badge always visible (not behind animation); milestone state never conveyed by color alone |
| Broken/empty states | All state descriptions include text — icon color changes are supplemental, not the sole signal |
| Color contrast | All text on tile backgrounds must meet WCAG AA (4.5:1 for normal text). Milestone badge: `#C4921F` on `#FDF4E3` — verify contrast at implementation time; use `font-weight: 600` if needed to reach 3:1 for large text threshold |
| Icon decorative treatment | All Phosphor icons are accompanied by visible text; standalone icons use `aria-hidden="true"` |
| No color-only info | Streak state is communicated via icon, numeral, text label, and motivational copy — never by color alone |
| Focus management | Sidebar indicator is in the natural tab order; confetti canvas is `aria-hidden="true"` and outside tab order |

---

#### Component Structure (Implementation Guidance for T-091)

```
ProfilePage.jsx
  └── StreakTile.jsx                    (new component — handles all streak states)
        ├── StreakLoadingSkeleton       (renders during fetch)
        ├── StreakEmptyState            (currentStreak=0, no lastActionDate)
        ├── StreakBrokenState           (currentStreak=0, lastActionDate exists)
        └── StreakActiveState           (currentStreak ≥ 1)
              ├── CurrentStreakDisplay  (icon + number + optional milestone badge)
              ├── LongestStreakDisplay  (personal best)
              ├── MotivationalMessage  (aria-live)
              └── MilestoneCelebration (confetti + scale animation, conditional)

AppShell.jsx (or sidebar component)
  └── SidebarStreakIndicator.jsx        (new component — shows when currentStreak ≥ 1)
```

**Data fetching strategy:**
- `ProfilePage.jsx` fetches streak data on mount: `GET /api/v1/care-actions/streak?utcOffset=<localOffset>`
- `AppShell.jsx` (or sidebar) also needs streak data. To avoid a second API call, consider one of:
  - Option A (recommended): a `useStreak()` custom hook backed by a React Context that shares a single fetch result across `ProfilePage` and `AppShell`
  - Option B (simpler): duplicate the fetch in `AppShell` with its own independent state — acceptable if caching is not yet in place; results in two parallel requests on Profile page load
- Either approach is acceptable for Sprint 19. Document the chosen approach in a code comment.

**`utcOffset` calculation:**
```js
const utcOffset = new Date().getTimezoneOffset() * -1;
// e.g., UTC-5 → getTimezoneOffset() = 300 → utcOffset = -300
// e.g., UTC+9 → getTimezoneOffset() = -540 → utcOffset = 540
```
Pass this value as the `utcOffset` query parameter on every streak fetch.

---

#### Streak Freeze / Grace Period (Advisory — Post-MVP)

This is a suggestion for a future sprint, not required for Sprint 19.

A "streak freeze" could allow users to preserve a streak when they miss a day due to illness or travel. Three approaches considered:

1. **Automatic 1-day grace (server-side):** Count the streak as active if the last action was 2 days ago instead of just 1. Simple but may feel unearned.
2. **Earned freeze token:** User earns a freeze every 7 days; can spend it to protect a streak once. Adds engagement depth but requires additional backend + UI.
3. **No freeze (current Sprint 19 implementation):** Honest and simple. A broken streak is a learning moment — "Every day is a fresh start." is the message we show.

**Recommendation:** Ship Sprint 19 without freeze. Revisit after user feedback. If feedback shows frustration with streak loss due to travel, implement option 2 (earned freeze) as it is the most satisfying game mechanic.

---

*SPEC-014 written by Design Agent on 2026-04-05 for Sprint #19.*

---

### SPEC-015 — Care History Section (Plant Detail Page)

**Status:** Approved
**Related Tasks:** T-092 (Design), T-094 (Frontend)
**Sprint:** #20
**Written by:** Design Agent — 2026-04-05

---

#### Description

The Care History section gives users a chronological, per-plant log of every care action they have marked done. It appears on the existing Plant Detail page — the same page that shows the plant's name, photo, and care schedule status badges. The goal is to close the feedback loop for novice plant owners: they can confirm they watered last Tuesday, spot patterns ("I fertilize every 6 weeks, not 4"), and feel confidence in their routine rather than anxiety about what they may have forgotten.

**Who uses it:** Primarily novice users who need reassurance, and intermediate users building conscious care habits. The history view is secondary to the care schedule — it should feel like a supportive companion panel, not a clinical audit log.

---

#### Entry Point — "History" Tab on Plant Detail Page

The Plant Detail page currently shows care schedule status (watering, fertilizing, repotting badges + mark-done CTA). SPEC-015 adds a **tab bar** below the plant name/photo hero section, above the schedule content:

```
[ Overview ]  [ History ]
```

- **Overview tab (existing):** Current care schedule status, mark-done actions, AI advice section — unchanged.
- **History tab (new — SPEC-015):** The care history log. Renders the full SPEC-015 layout described below.

**Tab bar design:**
- Tabs are text labels with an active indicator: a 2px bottom border in `#5C7A5C` (Accent Primary)
- Inactive tabs: `color: #6B6B5F` (Text Secondary), no underline
- Active tab: `color: #2C2C2C` (Text Primary), 2px bottom border `#5C7A5C`
- Tab bar bottom border: 1px `#E0DDD6` — the active tab's 2px indicator sits on top of this
- `font-size: 15px`, `font-weight: 500`, `padding: 12px 0`, `margin-right: 32px`
- Tab switch: instant (no animation needed), content below swaps
- On mobile: tab labels shrink to `font-size: 14px`, spacing between tabs: `margin-right: 24px`
- `role="tablist"` on the container; each tab is `role="tab"` with `aria-selected` and `aria-controls` pointing to the respective panel; panels use `role="tabpanel"`

---

#### Care History Layout (History Tab Content)

The History tab renders inside the same content container as the Overview tab. Max content width: 1280px (matching global convention), left-aligned in the Plant Detail layout.

**Top-level structure (top to bottom):**

```
┌──────────────────────────────────────────────────────────┐
│  Care Type Filter Bar                                    │
│  [ All ]  [ Watering ]  [ Fertilizing ]  [ Repotting ]  │
├──────────────────────────────────────────────────────────┤
│  Month Group Header: "April 2026"                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 💧 Watering    3 days ago     [note icon if notes] │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🌿 Fertilizing  12 days ago                        │  │
│  └────────────────────────────────────────────────────┘  │
│  Month Group Header: "March 2026"                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 💧 Watering    18 days ago                         │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  [ Load More ]  (centered, Ghost button variant)        │
└──────────────────────────────────────────────────────────┘
```

---

#### Care Type Filter Bar

A row of pill-style filter tabs directly below the Overview/History tab bar (within the History tab panel), with `margin-bottom: 24px`.

| Filter | careType param sent to API | Default |
|--------|---------------------------|---------|
| All | (no careType filter) | ✅ Active |
| Watering | `watering` | |
| Fertilizing | `fertilizing` | |
| Repotting | `repotting` | |

**Visual design:**
- Pills: `border-radius: 24px`, `padding: 6px 16px`, `font-size: 13px`, `font-weight: 500`
- Active pill: background `#5C7A5C`, text `#FFFFFF`
- Inactive pill: background `#F0EDE6` (Surface Alt), text `#6B6B5F`, border: none
- Hover (inactive): background `#E0DDD6`, text `#2C2C2C`
- Gap between pills: 8px
- On mobile: pills scroll horizontally if they overflow (single row, `overflow-x: auto`, no wrap); `scroll-snap-type: x mandatory`, each pill `scroll-snap-align: start`

**Behavior:**
- Clicking a filter pill immediately re-fetches the history list with `careType=<value>` (or no careType for "All")
- The active page resets to 1 (any previously loaded pages are cleared)
- A new loading skeleton is shown during the refetch
- Changing filter does NOT scroll the page to the top — the tab panel stays in view

**Accessibility:**
- Filter bar container: `role="group"` with `aria-label="Filter care history by type"`
- Each pill: `role="button"` or `<button>` element; active pill: `aria-pressed="true"`, inactive: `aria-pressed="false"`
- Do not use color alone to indicate active filter — active pill also changes text (white on sage) and can be identified by `aria-pressed`

---

#### Month Group Headers

Care history entries are grouped by calendar month. Within each month group, entries are ordered reverse-chronologically (most recent first), which matches the API's `performed_at DESC` ordering.

**Header visual:**
- Text: month name + year, e.g., "April 2026"
- `font-family: 'DM Sans'`, `font-size: 12px`, `font-weight: 600`, `color: #B0ADA5` (Text Disabled / muted label)
- `text-transform: uppercase`, `letter-spacing: 0.08em`
- `padding: 16px 0 8px` (top spacing from previous group or filter bar)
- A 1px `#E0DDD6` horizontal rule below the header label, full width of the list

**Grouping logic (frontend):** After fetching a page of items, group items by `new Date(item.performedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })`. When Load More appends the next page, new month group headers are inserted at the correct position in the running list.

---

#### Care History List Item

Each care event is a card row. The list container: `role="list"`, no extra `list-style`.

**Item anatomy (horizontal flex row):**

```
┌─────────────────────────────────────────────────────────────┐
│ [Care Icon]  [Care Type Label]   [Relative Date]  [Note 🗒]  │
└─────────────────────────────────────────────────────────────┘
```

| Column | Details |
|--------|---------|
| **Care Icon** | 32×32px icon, outlined (Phosphor Icons): Drop (`💧`) for watering, Plant (`🌿` / leaf) for fertilizing, Flower Pot for repotting. Icon color: care-type tint (see table below). Centered in a 40×40px circle with care-type background tint. |
| **Care Type Label** | `font-size: 15px`, `font-weight: 500`, `color: #2C2C2C`. Text: "Watering" / "Fertilizing" / "Repotting". |
| **Relative Date** | Right-aligned in the flex row. `font-size: 14px`, `color: #6B6B5F`. Text: e.g., "3 days ago", "Today", "Yesterday". Wrapped in a `<time>` element with `dateTime="<ISO-8601 value>"`. Absolute date shown on hover via `title` attribute AND a native tooltip (accessible via keyboard focus). Tooltip text format: "April 2, 2026 at 2:30 PM" (locale-appropriate). |
| **Note Icon** | Only rendered if `item.notes` is not null/empty. A small speech-bubble or note icon (`16px`, `color: #B0ADA5`) after the care type label, with `title="Has notes"` and `aria-label="This entry has notes"`. Clicking the icon expands an inline notes panel below the item row (see Notes Expansion below). |

**Care type icon tints:**

| Care Type | Icon Color | Icon Background |
|-----------|-----------|-----------------|
| Watering | `#4A7C59` (Status Green) | `#E8F4EC` |
| Fertilizing | `#A67C5B` (Accent Warm) | `#F5EDE4` |
| Repotting | `#6B6B5F` (Text Secondary) | `#F0EDE6` |

**Item card:**
- Background: `#FFFFFF` (Surface)
- `border: 1px solid #E0DDD6`
- `border-radius: 12px`
- `padding: 14px 20px`
- `margin-bottom: 8px`
- `box-shadow: 0 2px 8px rgba(44,44,44,0.06)` (Card Shadow)
- Hover: subtle lift — `box-shadow: 0 4px 12px rgba(44,44,44,0.10)`, `transform: translateY(-1px)`, `transition: all 0.2s ease`
- `role="listitem"` on each card
- `aria-label` on each card: `"Watering on April 2, 2026"` (always uses the absolute date for the aria-label, regardless of relative display) — e.g., `aria-label="Fertilizing on March 15, 2026. Has notes."`

**Notes Expansion (inline):**
- When the note icon is clicked, a notes panel slides open below the item row using a CSS `max-height` transition (0 → auto via JS, `transition: max-height 0.25s ease`)
- Notes panel: background `#F0EDE6` (Surface Alt), `border-radius: 8px`, `padding: 12px 16px`, `margin-top: 10px`, `font-size: 14px`, `color: #6B6B5F`, `font-style: italic`
- Note icon toggles open/closed — icon rotates 15° when open (CSS transform)
- `aria-expanded` on the note toggle button reflects current state

---

#### Relative Date Calculation

Compute relative date on the frontend from `item.performedAt` (ISO-8601, UTC). Display:

| Condition | Display |
|-----------|---------|
| Same calendar day (local time) | "Today" |
| 1 day ago | "Yesterday" |
| 2–6 days ago | "N days ago" |
| 7–13 days ago | "1 week ago" |
| 14–20 days ago | "2 weeks ago" |
| 21–27 days ago | "3 weeks ago" |
| 28+ days ago | "About N months ago" or just use the absolute date via `toLocaleDateString` |

Prefer `Intl.RelativeTimeFormat` for implementation — it handles locale automatically and is screen-reader friendly. The `<time>` element's `dateTime` attribute always carries the full ISO-8601 string.

---

#### Pagination — Load More

- Default: 20 items per page (`limit=20`), most recent first
- After the last item in the current list, render the **Load More button** if `page < totalPages`
- If `page >= totalPages` (all items loaded): the Load More button is hidden; render a friendly end-of-list message: `"You've seen all care history for this plant."` in `font-size: 13px`, `color: #B0ADA5`, centered, `padding: 16px 0`

**Load More button:**
- Variant: Ghost (transparent background, `color: #6B6B5F`, no border)
- Text: "Load More"
- Centered below the list: `margin: 16px auto`, `display: block`
- Width: `fit-content`, `padding: 10px 24px`
- Loading state: spinner icon (16px, `color: #6B6B5F`) replaces text; button disabled with `aria-busy="true"`
- On success: new items appended to the existing list (no scroll jump); month group headers inserted as needed
- On error: Load More button re-enables; a small inline error message below the button: `"Couldn't load more. Try again."` in `#B85C38`, `font-size: 13px`

**Focus management:** After Load More completes, focus is NOT moved (user stays where they were scrolling).

---

#### States

##### Loading State (Initial Fetch)

Shown while the first page of history is being fetched (`isLoading: true` before any data has loaded).

- Replace the filter bar and list with a skeleton layout
- **Filter bar skeleton:** 4 pill-shaped skeletons (`border-radius: 24px`, width 64/80/88/80px, height 32px, `background: #E0DDD6`) with a shimmer animation
- **List skeleton:** 4 card-shaped skeletons (`border-radius: 12px`, `height: 64px`, full width, `background: #E0DDD6`) with shimmer
- Shimmer: `background: linear-gradient(90deg, #E0DDD6 25%, #F0EDE6 50%, #E0DDD6 75%)`, `background-size: 200%`, animated `backgroundPosition` from `100%` to `-100%` over 1.4s infinite
- The history tab panel container: `aria-busy="true"` during skeleton display; `aria-busy="false"` once data renders or error displays
- `prefers-reduced-motion`: if the user has enabled reduced motion, skip the shimmer animation — use a static muted background instead

##### Empty State (No History Yet)

Shown when the API returns `total: 0` — the plant has no logged care actions yet. This is common for newly added plants.

**Layout:** Centered in the history panel, `padding: 48px 24px`, flex column, `align-items: center`, `gap: 16px`

**Elements:**
- Illustration: a small SVG/icon of a seedling or calendar with a leaf (64×64px, `color: #B0ADA5`) — use Phosphor `Plant` or `CalendarBlank` icon at 64px, outlined, `color: #C4C0B8`
- Heading: `"No care history yet."` — `font-size: 18px`, `font-weight: 600`, `color: #2C2C2C`, `font-family: 'DM Sans'`
- Body: `"Mark your first care action done and it will show up here."` — `font-size: 14px`, `color: #6B6B5F`, `text-align: center`, `max-width: 280px`
- CTA button: `"Go to Overview"` — Secondary variant, switches the active tab back to Overview tab so the user can find the mark-done controls
- If a care type filter is active and there are no results: show a filter-specific empty state: `"No [Watering/Fertilizing/Repotting] history yet."` with body `"Switch to 'All' to see all care actions."` — replace the CTA with a Ghost button `"Show All"` that resets the filter to "All"

##### Error State (Fetch Failed)

Shown when the API call fails (network error, 5xx, etc.). Must not break the rest of the Plant Detail page.

**Layout:** Inline within the history panel — replaces the list content. `padding: 32px 24px`, centered.

**Elements:**
- Icon: `Warning` or `WarningCircle` (Phosphor), 32px, `color: #B85C38`
- Message: `"Couldn't load care history."` — `font-size: 15px`, `font-weight: 500`, `color: #2C2C2C`
- Sub-message: `"Check your connection and try again."` — `font-size: 14px`, `color: #6B6B5F`
- Retry button: Secondary variant, text `"Try Again"`, re-triggers the fetch for page 1 with current filter
- The rest of the Plant Detail page (Overview tab content, plant info, etc.) is unaffected

---

#### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Desktop** (≥ 1024px) | Full layout as described. History panel fills the same column as the Overview tab content — typically 60–70% of the page width, leaving room for the right sidebar (if the plant detail page has one). List items are single-row flex. |
| **Tablet** (768px–1023px) | Same layout. Filter bar pill row scrolls horizontally if it overflows at narrow widths. |
| **Mobile** (< 768px) | History panel is full viewport width (minus 16px side padding each side). List item cards stack vertically — care type icon + label on one line, date on the next line (flex column on the item row at < 480px). Filter pills horizontally scrollable. Load More button: full width (`width: 100%`). |

**Touch targets:** All interactive elements (filter pills, Load More, note toggle, tab buttons) have a minimum 44×44px touch target on mobile, achieved via `min-height: 44px` and `padding` expansion as needed.

---

#### Dark Mode

All new elements use CSS custom properties from the app's existing dark mode variable set. Spec describes the expected dark-mode appearance:

| Element | Dark Mode Value |
|---------|----------------|
| Panel background | `var(--color-bg)` → dark: `#1A1A16` |
| Card background | `var(--color-surface)` → dark: `#242420` |
| Card border | `var(--color-border)` → dark: `#3A3A34` |
| Month header text | `var(--color-text-disabled)` → dark: `#6B6B5F` |
| Care type label | `var(--color-text-primary)` → dark: `#F0EDE6` |
| Relative date text | `var(--color-text-secondary)` → dark: `#9B9B8F` |
| Filter pill active bg | `var(--color-accent-primary)` → dark: `#5C7A5C` (unchanged) |
| Filter pill inactive bg | `var(--color-surface-alt)` → dark: `#2E2E28` |
| Filter pill inactive text | `var(--color-text-secondary)` → dark: `#9B9B8F` |
| Watering icon bg | dark: `#1E3028` |
| Fertilizing icon bg | dark: `#2E2018` |
| Repotting icon bg | dark: `#2A2A24` |
| Skeleton shimmer | dark: linear-gradient from `#2E2E28` → `#3A3A34` → `#2E2E28` |
| Notes panel bg | `var(--color-surface-alt)` → dark: `#2E2E28` |
| Tab active indicator | `var(--color-accent-primary)` → dark: `#5C7A5C` (unchanged) |

No hardcoded color values in new component code — all colors via `var(--color-*)` tokens.

---

#### Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Tab navigation | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` on tab bar |
| History list | `role="list"` on list container; `role="listitem"` on each card |
| Item description | `aria-label="[Care Type] on [Absolute Date]"` (e.g., `"Watering on April 2, 2026"`) — absolute date always used for screen reader label regardless of relative display |
| Items with notes | `aria-label` appended: `"Watering on April 2, 2026. Has notes."` |
| Note toggle | `<button>` with `aria-expanded="true/false"` and `aria-label="Toggle notes"` |
| Filter pills | `role="group"` with `aria-label="Filter care history by type"` on container; each pill `<button>` with `aria-pressed` |
| Date element | `<time dateTime="ISO-8601">` wraps all relative date text |
| Loading state | `aria-busy="true"` on history panel container during skeleton; `aria-busy="false"` after |
| Load More button | `aria-busy="true"` when loading next page |
| Color independence | Care types identified by label AND icon, not color alone. Filter active state identified by `aria-pressed` + visual change, not color alone. |
| Keyboard navigation | Tab through filter pills, list items (each card focusable), note toggles, Load More button. Focus ring: 2px solid `#5C7A5C`, `outline-offset: 2px`. |
| Reduced motion | Skeleton shimmer animation disabled; note expansion is instant (no `max-height` transition); card hover lift suppressed |
| Screen reader text | Care type icon: `aria-hidden="true"` (the icon is decorative; the `aria-label` on the card provides full context) |

---

#### Component Architecture (Suggested)

```
PlantDetailPage.jsx
  └── PlantDetailTabs.jsx          (new — Overview/History tab bar)
        ├── PlantOverviewPanel.jsx  (existing content, moved into tab panel)
        └── CareHistorySection.jsx  (new — SPEC-015 scope)
              ├── CareHistoryFilterBar.jsx   (filter pills)
              ├── CareHistoryList.jsx        (month-grouped list)
              │     └── CareHistoryItem.jsx  (individual card)
              ├── CareHistorySkeleton.jsx    (loading state)
              ├── CareHistoryEmpty.jsx       (empty state)
              └── CareHistoryError.jsx       (error state)
```

**API method** (to be added to `frontend/src/api.js`):
```js
// GET /api/v1/plants/:id/care-history
// params: { page?, limit?, careType? }
getCareHistory(plantId, params = {})
```

**State shape** for `CareHistorySection`:
```js
{
  items: [],          // flat array of all loaded items (across pages)
  total: 0,
  page: 1,
  totalPages: 1,
  filter: 'all',      // 'all' | 'watering' | 'fertilizing' | 'repotting'
  isLoading: false,   // true only on initial fetch (page 1, items empty)
  isLoadingMore: false, // true when Load More is in progress
  error: null,        // string | null
}
```

---

### SPEC-016 — Care Notes: Mark-Done Input & History Display

**Status:** Approved
**Related Tasks:** T-096 (Design), T-098 (Frontend)
**Date Written:** 2026-04-05
**Sprint:** #21

---

#### Overview

Care Notes lets users optionally capture a short freeform observation whenever they mark a care action as done. The note is stored alongside the care action and surfaced in the Care History view. The feature is entirely opt-in — the mark-done flow is unchanged for users who do not add a note. Null notes produce zero UI in the history list.

**Design constraints:**
- Japandi aesthetic — the note UI must feel like a quiet, natural extension of the existing mark-done flow, not an interruption.
- No modals. The note input expands inline beneath the mark-done button with a smooth animation.
- The note display in history is compact and unobtrusive — text only, no borders or extra chrome around it.

---

#### Entry Points

There are two surfaces where a user can mark a care action done, and both receive the note input:

| Surface | Component | Location of note input |
|---------|-----------|----------------------|
| Care Due Dashboard | `CareDuePage.jsx` — plant-care-type card | Inline, below the "Mark Done" button, toggled by "Add note" link |
| Plant Detail — Care Schedule | `PlantDetailPage.jsx` — Overview tab, care schedule row | Inline, below the "Mark Done" button for the relevant care type |

---

#### Entry Point A — Care Due Dashboard Card

**Current card anatomy (before this sprint):**
```
┌──────────────────────────────────────────────────────┐
│  [Plant photo or leaf icon]  Monstera                │
│  Watering · 3 days overdue                          │
│                                                      │
│                          [ Mark Done ]               │
└──────────────────────────────────────────────────────┘
```

**Updated card anatomy (Sprint 21):**
```
┌──────────────────────────────────────────────────────┐
│  [Plant photo or leaf icon]  Monstera                │
│  Watering · 3 days overdue                          │
│                                                      │
│                          [ Mark Done ]               │
│                          + Add note                  │
│  ┌────────────────────────────────────────────────┐  │
│  │ e.g. "Soil was very dry — used extra water"    │  │
│  │                                                │  │
│  │                                   0 / 280      │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**"Add note" toggle link:**
- Rendered as a ghost/text button: no background, no border, `color: var(--color-text-secondary)`, `font-size: 12px`, `font-weight: 500`
- Icon: `PencilSimple` (Phosphor, outlined, 12px) inline-left of the text
- Label: `"+ Add note"` in default state; `"− Remove note"` when the textarea is expanded
- Positioned flush-right, below the "Mark Done" button, aligned to the right edge of the card's action area
- Keyboard-accessible `<button>` element; `aria-expanded="false"` / `"true"` reflecting the expansion state; `aria-controls="note-input-{plantId}-{careType}"` linking it to the textarea

**Note textarea (expanded state):**
- Appears with `transition: max-height 0.3s ease, opacity 0.2s ease` — max-height animates from `0` to `120px`; opacity 0 → 1
- Background: `var(--color-surface-alt)` (`#F0EDE6` light / `#2E2E28` dark)
- Border: `1px solid var(--color-border)` (`#E0DDD6` light / `#3A3A34` dark); on focus: `2px solid var(--color-border-focus)` (`#5C7A5C`)
- Border radius: `8px`
- Padding: `10px 12px`
- Font: `14px`, `font-family: 'DM Sans'`, `color: var(--color-text-primary)`
- Placeholder text: `"e.g. 'Soil was very dry — gave extra water'"` in `color: var(--color-text-disabled)`
- Resize: `none` (fixed height, no resize handle)
- `maxLength={280}` enforced on the element
- `rows={3}` (approximately 72px tall with 14px line-height × 3)
- Full width of the card's content area minus 16px padding each side
- `id="note-input-{plantId}-{careType}"` — unique across the page when multiple cards are visible
- `aria-label="Care note for {plantName} {careType}"` (e.g., `"Care note for Monstera watering"`)
- `aria-describedby="note-counter-{plantId}-{careType}"` — linking to the character counter

**Character counter:**
- Positioned bottom-right of the textarea, visually inside the textarea border
- Text: `"{n} / 280"`, `font-size: 11px`, `color: var(--color-text-disabled)`
- Counter is hidden (or renders at `opacity: 0`) when character count is below 200
- Counter becomes visible (`opacity: 1`, `transition: opacity 0.15s`) when count reaches 200
- Counter text turns `color: var(--color-status-yellow)` (`#C4921F`) at 240 characters
- Counter text turns `color: var(--color-status-red)` (`#B85C38`) at 270–280 characters
- `id="note-counter-{plantId}-{careType}"` — matches the `aria-describedby` on the textarea
- Screen readers should announce: `aria-live="polite"` on the counter so character count changes are announced when typing slows; update announcement at 200, 240, 270, 280 characters only (not every keystroke)

**Collapsed state (default):**
- Textarea is not in the DOM (or has `display: none`) when collapsed — do not leave a hidden textarea that can be tab-focused
- "Add note" link is visible and focusable
- No blank space below the mark-done button

**Interaction sequence:**
1. User sees card with "Mark Done" button and "+ Add note" link
2. User clicks "+ Add note" → textarea expands with animation; link label changes to "− Remove note"; textarea receives focus automatically
3. User types a note (optional)
4. User clicks "Mark Done" — the note value (trimmed) is included in the `POST /api/v1/care-actions` request body as `notes`; if the textarea is collapsed or empty, `notes` is omitted from the request body (backend defaults to `null`)
5. On success: card is removed from the dashboard (existing mark-done behavior); textarea and link are torn down with the card
6. If user clicks "− Remove note" before marking done: textarea collapses with reverse animation; note value is discarded; link returns to "+ Add note"

---

#### Entry Point B — Plant Detail Page, Care Schedule Section

**Context:** In the Plant Detail Overview tab, each active care schedule type (watering, fertilizing, repotting) is shown as a row with a status badge and a "Mark Done" button. After Sprint 21, a "+ Add note" link appears below the "Mark Done" button for each row.

**Care schedule row anatomy (Sprint 21):**
```
┌────────────────────────────────────────────────────────────────────┐
│  💧  Watering          [Overdue 2 days]          [ Mark Done ]     │
│                                                  + Add note        │
│                        ┌─────────────────────────────────────────┐ │
│                        │ e.g. "Leaves were drooping..."          │ │
│                        │                                         │ │
│                        │                              0 / 280    │ │
│                        └─────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

**Note textarea placement:**
- Below the "Mark Done" button, right-aligned (same column as the button)
- On desktop (≥768px): textarea width matches the "Mark Done" button column width (≈ 240px minimum, expanding to fill available space right of the care type label)
- On mobile (<768px): textarea is full-width beneath the entire row, same as the button stacks to full-width

All behavior (toggle, animation, character counter, ARIA) is identical to Entry Point A. The `id` and `aria-label` attributes use the Plant Detail context:
- `id="note-input-detail-{careType}"` (e.g., `"note-input-detail-watering"`)
- `aria-label="Care note for {plantName} {careType}"` (e.g., `"Care note for Peace Lily fertilizing"`)

---

#### Submission Flow

The note is **always optional**. The mark-done action works identically to today when no note is provided.

| User action | `notes` value in POST body |
|-------------|---------------------------|
| Mark done, "Add note" never opened | Omit `notes` field entirely (backend defaults to `null`) |
| Mark done, "Add note" opened but textarea is empty | Omit `notes` field (empty string → backend stores as `null`; either approach is valid) |
| Mark done, "Add note" opened with text | Send `notes: trimmedValue` (trim whitespace before sending) |

**Client-side trim:** Before submitting, call `noteValue.trim()`. If the trimmed value is `""` (empty), omit the field.

**Hard character limit:** `maxLength={280}` is enforced on the textarea DOM element. The form/button should also guard against `note.length > 280` before submitting (belt-and-suspenders, since the backend also validates).

**POST body shape (when note is present):**
```json
{
  "plantId": "uuid",
  "careType": "watering",
  "notes": "Soil was very dry — gave extra water and misted leaves."
}
```

**Loading state during submission:**
- "Mark Done" button shows spinner and becomes disabled (existing behavior)
- The "+ Add note" link is also disabled (pointer-events: none, opacity 0.5) during the pending state
- The textarea is `disabled` during submission to prevent edits mid-flight

**Error state:**
- If the POST fails, the existing error toast is shown (no change)
- The textarea re-enables, preserving the user's note text
- The user can retry by clicking "Mark Done" again

---

#### Notes Display in Care History

The `CareHistoryItem` component (in `CareHistorySection.jsx`) already receives `notes` from the API. If `notes` is non-null and non-empty, a note preview is shown below the date line.

**History list item anatomy — with note:**
```
┌──────────────────────────────────────────────────────────┐
│  [💧]  Watering                          3 days ago      │
│        April 2, 2026                                     │
│        ─────────────────────────────────────────         │
│        "Soil was very dry — gave extra water and         │
│         misted leaves."                                  │
│                                              Show more ↓ │
└──────────────────────────────────────────────────────────┘
```

**History list item anatomy — without note (null):**
```
┌──────────────────────────────────────────────────────────┐
│  [💧]  Watering                          3 days ago      │
│        April 2, 2026                                     │
└──────────────────────────────────────────────────────────┘
```
No note row, no "No note" placeholder, no divider. The item is visually identical to the pre-Sprint-21 history items.

**Note text styling:**
- `font-size: 13px`
- `color: var(--color-text-secondary)` (`#6B6B5F` light / `#9B9B8F` dark)
- `font-style: italic`
- `line-height: 1.5`
- Padding: `8px 0 4px 0` (top gap from date line, small bottom padding before "Show more")
- A subtle `1px solid var(--color-border)` horizontal rule (full-width, no horizontal margins) visually separates the date from the note area when a note is present

**Divider (note separator):**
- Only rendered when `notes` is non-null
- `border-top: 1px solid var(--color-border)`
- `margin: 6px 0 8px 0`
- No divider when note is null

**Truncation (2-line clamp):**
- Default state: note text is clamped to 2 lines via `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden`
- If the full note fits within 2 lines, no "Show more" toggle is rendered
- If the full note overflows 2 lines, a "Show more" toggle button is rendered

**"Show more" / "Show less" toggle:**
- Rendered as a ghost text button: `font-size: 12px`, `color: var(--color-accent-primary)` (`#5C7A5C`)
- Icon: `CaretDown` (Phosphor, 10px) right of text in collapsed state; `CaretUp` in expanded state
- Label: `"Show more"` (collapsed) / `"Show less"` (expanded)
- Positioned flush-right, below the truncated text
- Clicking "Show more": removes the `line-clamp` CSS property, reveals full note text; label changes to "Show less" + caret rotates 180° (`transition: transform 0.2s ease`)
- No animation on the text itself — just the caret rotation and instant reveal (to remain lightweight in a list)
- `aria-expanded="false"` / `"true"` on the toggle button
- `aria-controls="note-text-{itemId}"` linking to the note text container
- `id="note-text-{itemId}"` on the note text `<p>` element

**State where full note ≤ 2 lines:**
- No divider is still present (the divider appears whenever `notes !== null`)
- No "Show more" button
- Note text is simply displayed in full, styled as above

---

#### Empty Note Handling (History)

When `notes` is `null` (or `undefined`):
- Render nothing. No divider, no italicized text area, no "No note" label, no empty space.
- The care history item renders in its original form (care type + date line only).
- This is the default state for all care actions recorded before Sprint 21.

**Guard condition in `CareHistoryItem`:**
```jsx
{notes != null && notes.trim() !== '' && (
  <div className="care-history-item__note">
    <hr className="care-history-item__note-divider" />
    <p id={`note-text-${id}`} className="care-history-item__note-text">
      {notes}
    </p>
    {/* Show more toggle — only if text overflows */}
  </div>
)}
```

---

#### States Summary

| State | Dashboard Card | Plant Detail Row | History Item |
|-------|---------------|-----------------|--------------|
| Default (no note) | "+ Add note" link visible | "+ Add note" link visible | No note UI |
| Note input open | Textarea expanded, "− Remove note" | Textarea expanded, "− Remove note" | — |
| Note typed, <200 chars | Counter hidden | Counter hidden | — |
| Note typed, 200–239 chars | Counter visible (muted) | Counter visible (muted) | — |
| Note typed, 240–269 chars | Counter yellow | Counter yellow | — |
| Note typed, 270–280 chars | Counter red | Counter red | — |
| Submitting | Button+link disabled, textarea disabled | Button+link disabled, textarea disabled | — |
| Submit success | Card removed | Row refreshes (existing behavior) | Note shown (if non-null) |
| Submit error | Error toast, textarea re-enabled | Error toast, textarea re-enabled | — |
| History item, note null | — | — | No note UI rendered |
| History item, note ≤ 2 lines | — | — | Full note, no toggle |
| History item, note > 2 lines | — | — | 2-line clamp + "Show more" |
| History item, note expanded | — | — | Full note, "Show less" |

---

#### Responsive Behavior

| Breakpoint | Dashboard Card | Plant Detail Row | History Item |
|------------|---------------|-----------------|-------------|
| Desktop (≥1024px) | Card layout unchanged; note textarea fills card content width below mark-done button | Textarea right-aligned, same column as button (~240–320px wide) | Note text wraps naturally within card |
| Tablet (768–1023px) | Same as desktop | Textarea full-width beneath the row (button + note stack vertically) | Same as desktop |
| Mobile (<768px) | Card is full-width; textarea is full-width below mark-done button | Textarea full-width, stacks below button | Note text wraps naturally; "Show more" toggle on its own line |

**Touch targets:** "Add note" link minimum touch target 44×44px (use `padding: 12px 8px` even though the visual text is smaller). "Show more" / "Show less" button minimum touch target 44×44px.

---

#### Dark Mode

All new elements use CSS custom properties from the existing dark mode variable set.

| Element | Light | Dark |
|---------|-------|------|
| Note textarea background | `var(--color-surface-alt)` → `#F0EDE6` | `#2E2E28` |
| Note textarea border | `var(--color-border)` → `#E0DDD6` | `#3A3A34` |
| Note textarea border (focus) | `var(--color-border-focus)` → `#5C7A5C` | `#5C7A5C` |
| Note textarea text | `var(--color-text-primary)` → `#2C2C2C` | `#F0EDE6` |
| Note textarea placeholder | `var(--color-text-disabled)` → `#B0ADA5` | `#6B6B5F` |
| "Add note" / "Remove note" link | `var(--color-text-secondary)` → `#6B6B5F` | `#9B9B8F` |
| Character counter (muted) | `var(--color-text-disabled)` → `#B0ADA5` | `#6B6B5F` |
| Character counter (yellow) | `var(--color-status-yellow)` → `#C4921F` | `#C4921F` |
| Character counter (red) | `var(--color-status-red)` → `#B85C38` | `#B85C38` |
| History note text | `var(--color-text-secondary)` → `#6B6B5F` | `#9B9B8F` |
| History note divider | `var(--color-border)` → `#E0DDD6` | `#3A3A34` |
| "Show more" / "Show less" | `var(--color-accent-primary)` → `#5C7A5C` | `#5C7A5C` |

No hardcoded color values in any new component code — all via `var(--color-*)` tokens.

---

#### Accessibility

| Requirement | Implementation |
|-------------|---------------|
| "Add note" toggle | `<button>` with `aria-expanded`, `aria-controls` pointing to textarea `id` |
| Note textarea | `aria-label="Care note for {plantName} {careType}"` |
| Character counter | `aria-describedby` on textarea → counter `id`; counter has `aria-live="polite"`, announces at 200 / 240 / 270 / 280 only |
| Textarea disabled during submit | `disabled` attribute (not just `pointer-events: none`) |
| History note container | `id="note-text-{itemId}"` for `aria-controls` reference |
| "Show more" toggle | `<button>` with `aria-expanded`, `aria-controls` linking to note `p` element |
| Keyboard navigation | Tab order: Mark Done button → Add note link → textarea (when open) → character counter (skip, non-interactive) |
| Focus management | When "Add note" is clicked, textarea receives focus via `ref.focus()` after animation starts |
| Reduced motion | When `prefers-reduced-motion: reduce`, textarea expansion is instant (no `max-height` transition); caret rotation on "Show more" is instant |
| Color independence | Character counter severity communicated via text value ("270 / 280") in addition to color; note presence in history communicated by the text content itself, not by color alone |
| Screen reader — note in history | `CareHistoryItem` `aria-label` is extended: `"Watering on April 2, 2026. Includes note."` when `notes` is non-null |

---

#### Component Changes Summary

| Component | Change |
|-----------|--------|
| `CareDuePage.jsx` | Add `noteValue` state per card (keyed by `{plantId}-{careType}`); add "+ Add note" toggle button; render note textarea on expand; pass `notes` to `careActions.create()` |
| `PlantDetailPage.jsx` | Same pattern as CareDuePage for each care-type row in the Overview tab; `noteValue` state keyed by `careType` |
| `CareHistorySection.jsx` / `CareHistoryItem.jsx` | Render note block when `notes` is non-null; implement 2-line clamp + "Show more" toggle |
| `CareHistorySection.css` (or equivalent) | Add `.care-history-item__note`, `.care-history-item__note-text`, `.care-history-item__note-divider`, `.care-history-item__show-more` styles; all using CSS custom properties |
| `frontend/src/api.js` | Update `careActions.create(payload)` to accept and pass through optional `notes` field |

---

#### File Locations

| File | Change |
|------|--------|
| `frontend/src/pages/CareDuePage.jsx` | Note input for mark-done flow |
| `frontend/src/pages/PlantDetailPage.jsx` | Note input for mark-done flow |
| `frontend/src/components/CareHistorySection.jsx` | Note display in history list item |
| `frontend/src/components/CareHistorySection.css` | Note styles (dark mode, truncation, toggle) |
| `frontend/src/api.js` | `careActions.create` updated to accept `notes` |

---

*SPEC-015 written by Design Agent on 2026-04-05 for Sprint #20.*
