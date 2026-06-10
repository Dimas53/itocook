# ItoCook — Roadmap

> This file is the big picture of the project. Small steps are in `docs/progress.md`.
> Agent reads this file at the start of each session to understand the context and not dive into details of the wrong phase.

---

## Phase 1: UI Skeleton ✅ 2026-06-02
**Goal:** can open the app, navigate through screens, see the final layout of all screens. No real data — only UI.

### M1: UI Foundation & Design System ✅
- [x] Design system — tokens, fonts, Tailwind config
- [x] iPhone frame layout (`layouts/default.vue`), Dynamic Island
- [x] Onboarding screen — flex layout, TypeScript
- [x] Auth screen — basic layout
- [x] Tailwind config full sync — all 13 tokens
- [x] Nuxt config — main.css connected

### M2: Layout & Global Navigation ✅
- [x] `components/` directory created
- [x] `BottomTabBar.vue` — 5 tabs, Phosphor icons, active/inactive
- [x] Tab bar integrated in `default.vue`, hidden on `/onboarding` and `/auth`

### M3: Core Authentication Flow ✅
- [x] auth.vue — form, validation, errors, loading state
- [x] Fake login (hardcoded user)
- [x] Redirect after login to Home
- [x] `darkStatus` — uncomment `invert` in layout
- [x] Route protection — redirect to `/auth` if not logged in

---

## Phase 2: First Live Flow ✅ 2026-06-03
**Goal:** Login works with a real backend, token is saved, basic user session is pulled from Directus.

- [x] Set up Directus SDK / HTTP client as composable (`useDirectus`)
- [x] Rewrite `useAuth` — send real POST to Directus `/auth/login` and save token in cookies
- [x] Set up global middleware to check live token via Directus (request to `/users/me`)
- [x] Display on the main page (`index.vue`) the first real data from Directus: name, email
- [x] Registration — via server proxy (admin API), User role is assigned
- [x] Set up dynamic redirect after login: if user is today's cook → Cook page, otherwise → Home

---

## Phase 3: Directus Schema Setup ✅ 2026-06-03
**Goal:** create all collections via Directus MCP before starting screen layout. Schema-first approach.

- [x] `cook_queue` collection (fields: date, cook user relation, dish name, status)
- [x] `orders` collection (fields: user relation, cook_queue relation, status)
- [x] `order_items` collection (fields: order relation, quantity)
- [x] `transactions` collection (fields: user relation, amount, type, description, date)
- [x] `balances` collection (fields: user relation, amount)

---

## Phase 4: Feature Screens
**Goal:** Final layout of all app screens according to the current screen map.
Each screen is adapted to the real data structure from Directus.
Agent reads `docs/design.md` before laying out each screen.

---

### Navigation (Bottom Tab Bar) — update icons and routing ✅

- [x] Tab 1 — Home: icon `ph:cooking-pot`
- [x] Tab 2 — Kitchen: icon `ph:calendar-blank`
- [x] Tab 3 — AI Recipe: icon `ph:sparkle` (for Admin it's replaced with `ph:chart-bar` → Finance Page)
- [x] Tab 4 — Duty: icon `ph:broom`
- [x] Tab 5 — Common: icon `ph:users`
- [x] Tab replacement logic when Admin/Accountant logs in: `ph:sparkle` → `ph:chart-bar`

---

### Main Screens (Tabs)

#### Tab 1 — Home (`pages/index.vue`) ✅
UI: top part custom, bottom part (cards + search) — from ekilu Home screen reference.

- [x] Header: greeting + user name + avatar (→ Profile)
- [x] Hero block: who's cooking today + dish name + lunch status
- [x] Button "I'm having lunch" / "Skip" (with timer — only until 24h before lunch)
- [x] Button "Become a cook" — shown only if no cook is assigned for today
- [x] Lunch participant counter (X of N confirmed)
- [x] Widget: my balance (mini, tap → Profile)
- [x] Widget: upcoming kitchen duty (tap → Duty tab)
- [x] Search dish history (tap opens Kitchen tab with search focus)
- [x] Office's latest dish cards — `RecipeCard.vue` (tap → Recipe Detail)

#### Tab 2 — Kitchen (`app/pages/kitchen.vue`) ✅
UI: custom. Combines cook queue + dish history.

- [x] "Today" block: cook + dish + status + participant counter
- [x] Button "Become a cook" (if not assigned)
- [x] Weekly cook queue — slots by day, "Sign up" button
- [ ] Weekly menu (if planned by cook in advance)
- [x] Dish history: list with search, cook name, date, rating
- [x] Select a dish from history → navigate to Recipe Detail (stub)
- [ ] Anonymous dish ratings (stars + text, directly in the card)

#### Tab 3 — AI Recipe (`pages/ai-recipe.vue`)
UI: from ekilu AI Recipe screen reference — take almost 1-to-1.

- [ ] Chat interface with AI (cooking questions only)
- [ ] Render recipe from JSON response: title, servings, time, ingredients, steps
- [ ] Button "Add to recipes" → creates a draft in Kitchen
- [ ] Button "Add to shopping list" → ingredients go to the list on Cook Page
- [ ] Portion recalculation: input field for quantity → new request to AI with recipe context
- [ ] Ingredient substitution via AI → button "Replace in recipe"

#### Tab 4 — Duty (`pages/duty.vue`)
UI: custom. Duty calendar.

- [ ] "On duty today" block: name + department
- [ ] "Confirm duty" button — only for the assigned user
- [ ] Monthly calendar — viewable by everyone
- [ ] Schedule editing — Admin only (inline edit or modal)
- [ ] Auto-assignment by department — button for Admin
- [ ] Notifications to assigned users (trigger from Directus Flow)

#### Tab 5 — Common (`pages/common.vue`)
UI: custom. Office pool collections, announcements, votes.

- [ ] Company announcements feed (text + date, Admin creates)
- [ ] Active pool collections: name, goal (amount), collected, participants
- [ ] "Participate" button + contribution amount input
- [ ] Collection progress bar
- [ ] History of closed pool collections
- [ ] Create a pool collection — Admin or anyone (configurable)
- [ ] Weekly vote: best dish / cook (optional, Phase 7)

---

### Inner Screens (No Tab)

#### Profile (`pages/profile.vue`) 🟡
UI: from ekilu Profile reference — basic layout, add balance block.
Navigation: avatar in the header on any screen.

- [x] Avatar, name, position, department
- [ ] Balance block: current balance + "Request top-up" button (amount input)
- [ ] My transaction history (list: date, dish, amount)
- [ ] Notification settings: push / email / WhatsApp (toggle)
- [ ] My ratings and reviews
- [ ] Statistics: how many times cooked, been on duty
- [x] Log out

#### Cook Page (`pages/cook.vue`) 🟡
UI: entirely custom. The most important business screen.
Navigation: "Become a cook" button from Home or Kitchen. Auto-opens on login if user = today's cook.
Middleware: `cook.ts` — blocks non-admin/non-cook users. `?action=become` query param bypass.

- [x] Status: "You're the cook today" + date
- [x] Dish selection: from history (Kitchen) or enter a new name
- [x] Participant counter: who confirmed + list of names
- [x] "Lunch is ready" button → status change
- [x] Enter receipt amount
- [x] Auto-calculation of each participant's share and deduction preview
- [x] "Confirm deduction" button → transactions + balance updates in Directus
- [ ] Upload receipt photo
- [ ] Shopping list from recipe (if a recipe from history is selected)

#### Recipe Detail (`pages/recipe/today.vue`) 🟡
UI: from ekilu Recipe Detail reference (Spiced Fried Chicken) — almost 1-to-1.
Navigation: dish card on Home, Kitchen, Cook Page.

- [x] Dish photo (fullscreen at the top)
- [x] Name, cook, date, rating
- [x] Ingredients + collapsible
- [ ] Cooking steps
- [ ] "Cooking this today" button (cook only — if user = Cook)
- [ ] Ratings and reviews (anonymous)
- [ ] Edit recipe — only author-cook or Admin

#### Finance Page (`pages/finance.vue`)
UI: custom. Only for Admin and Accountant.
Navigation: Tab 3 is replaced by Finance when Admin logs in.

- [ ] All employee balances (table or card list)
- [ ] Alerts: red badge when balance < −10 €
- [ ] Manual balance top-up (Admin enters amount for the user)
- [ ] All transaction history with filters (by user, by period)
- [ ] Manual expense entry (store purchases)
- [ ] Period report: total spent, average per person

#### Notifications (`pages/notifications.vue`)
UI: lightweight screen, not a separate tab.
Navigation: `ph:bell` icon in the header (with unread badge).

- [ ] Notification feed (date, type, text)
- [ ] Quick actions directly from notification: "I agree", "Confirm duty"
- [ ] Mark all as read

---

### Reusable Components ✅

- [x] `RecipeCard.vue` — dish card (photo, name, cook, rating, date)
- [ ] `CategoryPill.vue` — category / filter pill
- [x] `HeroBlock.vue` — "who's cooking today" block (Home + Kitchen)
- [x] `BalanceWidget.vue` — mini balance widget
- [ ] `ParticipantCounter.vue` — lunch participant counter (embedded in HeroBlock)
- [x] `DutyWidget.vue` — upcoming duty widget

---

## Phase 5: Core Business Logic
**Goal:** can complete one full workday through the app — from "who's cooking" to balance deduction.
> Schema setup: use Directus MCP to create all collections before writing frontend code.
> Agent should read current schema first, then create: cook_queue, orders, order_items, transactions, balances.
- [ ] "I'm cooking today" — record in `cook_queue`, notify everyone
- [ ] Dish selection — from history or new name
- [ ] "I'm having lunch" — record in `order_items`, cancel within 24h
- [ ] "Lunch is ready" — status changes, notify participants
- [ ] Enter receipt amount → calculate each participant's share
- [ ] Deduct from each participant's balance → record in `transactions`
- [ ] User's balance updates on Home screen

---

## Phase 6: FastAPI + Notifications
**Goal:** business logic is moved to a microservice, notifications work automatically.

- [ ] FastAPI endpoint: calculate amount per participant
- [ ] FastAPI endpoint: trigger notifications (email)
- [ ] Morning reminder if no cook is assigned (8:00–10:00)
- [ ] "Lunch ready" notification to participants
- [ ] Alert for negative balance (< −10 €)
- [ ] Kitchen duty reminder

---

## Phase 7: Additional Features
**Goal:** the app is convenient to use every day, with financial control.

- [ ] AI assistant (OpenRouter, `gemini-2.0-flash-lite`) — cooking questions only
- [ ] Recipes — create, edit, photo
- [ ] Dish history — list with search
- [ ] Recalculate recipe for a new number of participants
- [ ] Shopping list — from recipe / manually
- [ ] Anonymous ratings and reviews on dishes
- [ ] Duty calendar — viewable by everyone, editable by admin
- [ ] Finance page — all balances and transactions (admin/accountant)

---

## Phase 8: MVP Launch
**Goal:** 10 colleagues use the app for a week, feedback is collected.

- [ ] Test week with real users
- [ ] Collect feedback
- [ ] UX fixes based on results
- [ ] Mini guide for users
- [ ] Full access for accounting

---

## Optional (Post-MVP)
- [ ] Receipt OCR — auto-read amount from photo
- [ ] Add products from receipt to database
- [ ] Integration with Recipe API
- [ ] Export shopping list
- [ ] Weekly vote: best dish / best cook
- [ ] Scaling: business trips, corporate events, office purchases
