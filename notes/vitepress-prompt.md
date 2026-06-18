# Prompt: Set up VitePress Documentation Site

Read AGENTS.md and all skills listed in the "Always read on project start" section.

## Goal

Create a VitePress documentation site inside `docs-site/` at the project root.
The site pulls content from existing `docs/` and `docs/architecture/` files,
presents them cleanly for a documentation audience, and includes a Screens section
with placeholder slots for screenshots.

Do NOT touch any files outside `docs-site/`.
Do NOT modify any existing `docs/` files.
Update `docs/progress.md` after done.

---

## Step 1 — Install VitePress

```bash
mkdir -p docs-site
cd docs-site
npm init -y
npm install -D vitepress
```

---

## Step 2 — Create VitePress config

Create `docs-site/.vitepress/config.ts`:

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ItoCook',
  description: 'Internal office kitchen coordination platform — Azubi-Projekt · ITO Consult GmbH',
  themeConfig: {
    nav: [
      { text: 'Overview', link: '/overview/what-is-itocook' },
      { text: 'Architecture', link: '/architecture/system-overview' },
      { text: 'Features', link: '/features/cook-queue' },
      { text: 'Screens', link: '/screens/home' },
      { text: 'Design System', link: '/design/colors' },
      { text: 'Roadmap', link: '/roadmap' },
    ],
    sidebar: {
      '/overview/': [
        {
          text: 'Overview',
          items: [
            { text: 'What is ItoCook', link: '/overview/what-is-itocook' },
            { text: 'Tech Stack', link: '/overview/tech-stack' },
            { text: 'Project Status', link: '/overview/status' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/architecture/system-overview' },
            { text: 'Database Schema', link: '/architecture/schema' },
            { text: 'Data Flows', link: '/architecture/data-flows' },
          ],
        },
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'Cook Queue', link: '/features/cook-queue' },
            { text: 'Recipe System', link: '/features/recipe-system' },
            { text: 'Finance & Balance', link: '/features/finance' },
            { text: 'Duty Schedule', link: '/features/duty' },
            { text: 'Shopping List', link: '/features/shopping-list' },
            { text: 'Auth & Security', link: '/features/auth-flow' },
          ],
        },
      ],
      '/screens/': [
        {
          text: 'Screens',
          items: [
            { text: 'Home & Kitchen', link: '/screens/home' },
            { text: 'Cook Panel', link: '/screens/cook-panel' },
            { text: 'Recipe System', link: '/screens/recipes' },
            { text: 'Finance', link: '/screens/finance' },
            { text: 'Duty', link: '/screens/duty' },
            { text: 'Shopping List', link: '/screens/shopping-list' },
          ],
        },
      ],
      '/design/': [
        {
          text: 'Design System',
          items: [
            { text: 'Colors & Typography', link: '/design/colors' },
            { text: 'Components', link: '/design/components' },
          ],
        },
      ],
    },
    footer: {
      message: 'ItoCook — Azubi-Projekt · ITO Consult GmbH · 2025–2026',
    },
  },
})
```

---

## Step 3 — Add scripts to package.json

In `docs-site/package.json` set scripts to:

```json
{
  "scripts": {
    "docs:dev": "vitepress dev",
    "docs:build": "vitepress build",
    "docs:preview": "vitepress preview"
  }
}
```

---

## Step 4 — Create landing page

Create `docs-site/index.md`:

```md
---
layout: home
hero:
  name: ItoCook
  text: Office Kitchen Coordination
  tagline: A shared expense platform for workplace lunch processes — cook scheduling, cost splitting, and balance tracking in one place.
  actions:
    - theme: brand
      text: Get Started
      link: /overview/what-is-itocook
    - theme: alt
      text: View Architecture
      link: /architecture/system-overview
features:
  - title: Cook Scheduling
    details: Daily cook assignment with a 6-state workflow — from scheduling through dish selection to financial closure.
  - title: Expense Splitting
    details: Automatic cost split among meal participants with per-user balance tracking and admin oversight.
  - title: Duty Roster
    details: Monthly kitchen cleaning schedule with confirmation flow and admin assignment tools.
  - title: Recipe System
    details: Shared recipe catalog with fork-on-cook pattern — each cook gets their own editable version.
  - title: Shopping List
    details: Build shopping lists from recipe ingredients. Auto-cleanup when a meal is confirmed or cancelled.
  - title: Balance Gate
    details: Users with balance below -30 EUR are blocked from joining or cooking until topped up by admin.
---
```

---

## Step 5 — Create Overview section

Read `docs/plan-main.md` and `docs/project-state.md` as sources.

### `docs-site/overview/what-is-itocook.md`

Extract from `docs/plan-main.md` sections 1 and 2.
Content to include:
- Problem statement — what currently happens in the office (messengers, Excel)
- What ItoCook solves
- Scalability table (office lunches / business trips / corporate events / office supplies)
- The core concept: "Splitwise for workplace processes, not just a cooking app"

### `docs-site/overview/tech-stack.md`

Extract from `docs/plan-main.md` section 2 and `docs/project-state.md` section 9.
Content to include:
- Tech stack table (Frontend / Backend / DB / Infrastructure / AI / Icons)
- Architecture diagram (ASCII from ARCHITECTURE.md)
- Brief explanation of why each technology was chosen

### `docs-site/overview/status.md`

Extract from `docs/project-state.md` sections 1 and 2.
Content to include:
- Frontend file structure tree
- Page status table with three tiers: ✅ Fully Working / 🟡 Partial / ⬜ Not Started
- Composables overview table (section 6 of project-state.md)

---

## Step 6 — Create Architecture section

### `docs-site/architecture/system-overview.md`

Source: `docs/ARCHITECTURE.md`
Content to include:
- Architecture at a Glance diagram
- All 8 Key Architectural Decisions with full explanations
- Collections overview table
- Links to feature docs

### `docs-site/architecture/schema.md`

Source: `docs/project-state.md` sections 3 and 4.
Content to include:
- Custom Collections table (all 9 collections, key fields, relations, policy)
- System Collections in Use table
- Relations diagram (text version from section 4)
- Full Mermaid ERD diagram (copy the erDiagram block exactly as-is)

### `docs-site/architecture/data-flows.md`

Source: `docs/project-state.md` section 5.
Content to include:
- All 6 flows as numbered step lists:
  - "Become Cook" Flow
  - "Save Dish" Flow
  - "Confirm Deduction" Flow
  - "Cancel Cooking" Flow
  - Signup Flow
  - Fork-on-Cook Flow
  - Shopping List Flow

---

## Step 7 — Create Features section

For each file below: read the source file carefully and copy the content
into the new location. Clean up formatting where needed but preserve
all technical detail, diagrams, and edge cases sections.

- `docs-site/features/cook-queue.md` ← source: `docs/architecture/cook-queue.md`
- `docs-site/features/recipe-system.md` ← source: `docs/architecture/recipe-system.md`
- `docs-site/features/finance.md` ← source: `docs/architecture/finance.md`
- `docs-site/features/duty.md` ← source: `docs/architecture/duty.md`
- `docs-site/features/shopping-list.md` ← source: `docs/architecture/shopping-list.md`
- `docs-site/features/auth-flow.md` ← source: `docs/architecture/auth-flow.md`

---

## Step 8 — Create Screens section

Screenshots are added manually by the developer later.
For each screen page: add a placeholder comment where the screenshot goes.
Screenshot files will live in `docs-site/public/screenshots/`.

### `docs-site/screens/home.md`

Content:
- What this screen is for: home dashboard, today's cooking status at a glance
- Who uses it: all users
- Available actions:
  - View who is cooking today and what dish
  - Tap "I'm having lunch" to join the meal
  - Tap "Become a cook" if no cook is assigned
  - View own balance (BalanceWidget)
  - View next duty assignment (DutyWidget)
  - Browse recent dishes
- Key components: HeroBlock (3 states), BalanceWidget, DutyWidget, WeekCalendar, RecipeCard
- Screenshot placeholder: `<!-- Screenshot: public/screenshots/home.png -->`

Also cover Kitchen tab on the same page:
- WeekCalendar — select any day to see who cooks
- Dish history with search
- ShoppingListWidget

### `docs-site/screens/cook-panel.md`

Content:
- What this screen is for: the cook's control panel for the entire meal lifecycle
- Who uses it: today's assigned cook + admin
- State machine — list all 6 states with what is shown and what actions are available:
  - `assign` — "I'm cooking today!" button
  - `dish` — enter dish name, category, pick recipe from history
  - `scheduled` — dish set, waiting to start; Edit Recipe / Cancel buttons
  - `cooking` — actively cooking; "Lunch is ready" button
  - `ready` — enter receipt amount + pasta packages, confirm deduction
  - `done` — meal completed, deduction confirmed
- Balance gate: blocked if balance < -30 EUR
- Fork-on-cook: briefly explain what happens when a shared recipe is picked
- Screenshot placeholders for: cook-assign.png, cook-dish.png, cook-ready.png

### `docs-site/screens/recipes.md`

Content:
- What this screen is for: browse, search, and manage recipes
- Available actions:
  - Search by dish name
  - Filter by category (Salad / Soup / Pasta / Meat / Fish / Vegan / Pizza)
  - Tap recipe → Recipe Detail
  - Like a recipe
  - "Cook This" → date picker → prefills Cook Panel
- Recipe Detail sub-page:
  - Photo, status badge, servings scaler with ingredient scaling
  - Join button (scheduled/cooking entries)
  - Edit recipe (owner or active cook)
- Recipe Create/Edit:
  - Photo upload (file picker, drag & drop, paste)
  - Ingredient editor with emoji preview
  - AddIngredientPopover quick-pick
- Screenshot placeholders: recipes-list.png, recipe-detail.png, recipe-create.png

### `docs-site/screens/finance.md`

Content:
- What this screen is for: financial overview and management
- Who uses it: Admin and Accountant roles only
- Available actions:
  - View all user balances (color-coded: green ≥ 0, mild red 0 to -5, strong red < -5)
  - Manual top-up: select user + enter amount + note
  - Edit pasta package price (inline)
  - Browse transaction history (slider with up/down arrows + "Show all")
- Screenshot placeholder: finance.png

### `docs-site/screens/duty.md`

Content:
- What this screen is for: kitchen cleaning duty roster
- Available actions for all users:
  - See who is on duty today
  - "Confirm Duty" button (only for the assigned user)
  - Browse monthly calendar (prev/next month)
  - Tap any cell to see details
- Additional actions for Admin:
  - Edit any cell: assign department + user
  - Create new assignments
- Screenshot placeholder: duty.png

### `docs-site/screens/shopping-list.md`

Content:
- What this screen is for: per-user ingredient shopping list
- How items get added: from Recipe Detail → share icon → "Add to Shopping List"
- Two views:
  - By Recipe tab — grouped by recipe, select-all per group
  - All Items tab — flat list, global select-all
- Check/uncheck individual items
- Delete all checked items
- Auto-cleanup: items deleted automatically when meal is confirmed or cancelled
- Screenshot placeholder: shopping-list.png

---

## Step 9 — Create Design System section

### `docs-site/design/colors.md`

Source: `docs/design.md` sections 1, 2, 3.
Content to include:
- Device geometry table (viewport, safe areas, border radius)
- Typography table (role / tailwind class / px / weight)
- Full color palette table (name / hex / tailwind token / usage)
- Tailwind config snippet showing all color tokens

### `docs-site/design/components.md`

Source: `docs/design.md` sections 4, 5, 7, 8.
Content to include:
- Button variants table with classes
- Input spec (height, border, focus, padding)
- Card spec (border radius, backgrounds, shadow)
- Bottom Tab Bar spec
- Icon usage table (context / style / size)
- Mobile UX constraints list

---

## Step 10 — Create Roadmap page

Create `docs-site/roadmap.md`:
Source: `docs/roadmap.md`
Copy content as-is — it is already well structured with phases and checkboxes.
Add a short intro paragraph at the top:

```md
# Roadmap

Development is organized into 8 phases. Phases 1–4 are complete or in progress.
Phases 5–8 cover remaining screens, notifications, IHK documentation, and MVP launch.
```

---

## Step 11 — Create public/screenshots directory

```bash
mkdir -p docs-site/public/screenshots
```

Create `docs-site/public/screenshots/README.md`:

```md
# Screenshots

Add screenshots here manually by running the app and capturing screens.

Expected files:
- home.png — Home page with HeroBlock
- kitchen.png — Kitchen tab with WeekCalendar
- cook-assign.png — Cook Panel in assign state
- cook-dish.png — Cook Panel in dish selection state
- cook-ready.png — Cook Panel in ready state with receipt form
- recipes-list.png — All Recipes page
- recipe-detail.png — Recipe Detail page
- recipe-create.png — Recipe Create/Edit page
- finance.png — Finance page (admin)
- duty.png — Duty page with MonthCalendar
- shopping-list.png — Shopping List page
```

---

## Step 12 — Verify

Run:
```bash
cd docs-site && npm run docs:dev
```

Check:
- Landing page renders with hero and 6 feature cards
- All sidebar navigation links resolve without 404
- Mermaid ERD diagram in architecture/schema.md renders correctly
- Screenshot placeholder comments are visible in source but not in rendered output
- No broken markdown (unclosed code blocks, malformed frontmatter)

Report:
- Which pages rendered correctly
- Any broken links or render errors
- Which screenshot files are still missing (expected — list them)

Update `docs/progress.md` after done.
