# ItoCook — Progress Log

## Current status
- [x] Project structure set up (frontend/, api/, directus/)
- [x] Docker running (Nuxt + Directus + PostgreSQL)
- [x] iPhone frame layout (`layouts/default.vue`)
- [x] Onboarding screen — fully fixed (flex layout, TypeScript)
- [x] Auth screen — form, validation, errors, loading state
- [x] Tailwind CSS installed with custom config
- [x] Jost font imported, global styles in `main.css`
- [x] Phosphor Icons installed
- [x] Tailwind config full sync — all 13 color tokens registered
- [x] `auth-bg: '#EDE8FF'` added to tailwind + design.md
- [x] Auth screen refactored — auth-bg token, transparent inputs, rounded-xl, branding fixed
- [x] Auth input interaction states — bg-white/40, focus:bg-white, focus:border-primary
- [x] Auth browser warnings fixed — Transition → v-show, autocomplete + name attributes
- [x] Nuxt config fixed — main.css uncommented, stale .nuxt cache cleared
- [x] `onboarding.vue` — `absolute inset-0` → `h-full`, added `lang="ts"`
- [x] `components/BottomTabBar.vue` — 5 tabs with Phosphor icons, active/inactive style
- [x] `default.vue` — tabbar embedded, hidden on /onboarding and /auth
- [x] `default.vue` — `darkStatus` invert uncommented
- [x] `composables/useDirectus.ts` — HTTP client for Directus API
- [x] `composables/useAuth.ts` — real signUp/login/logout/fetchUser via Directus
- [x] `middleware/auth.global.ts` — token validation via GET /users/me
- [x] `auth.vue` — real Sign Up and Log In (no setTimeout, no fake)
- [x] `index.vue` — display real user data (name, email, balance, role)
- [x] `server/api/auth/signup.post.ts` — server proxy for registration via Directus admin
- [x] `docker-compose.yml` — CORS_ENABLED, CORS_ORIGIN, NUXT_DIRECTUS_ADMIN_EMAIL/PASSWORD
- [x] `nuxt.config.ts` — runtimeConfig for admin email/password + server directusUrl
- [x] **Role User assigned automatically** on signup (via `signup.post.ts`)
- [x] **Directus MCP connected** (http://localhost:8055/mcp) — agent can manage schema
- [x] **Chrome DevTools MCP connected** (port 9222) — agent can inspect browser
- [x] **`ssr: false`** at top level, `experimental.viteEnvironmentApi: true` (Nuxt 4 SPA crash fix)
- [x] **Dynamic redirect** after login: cook → `/cook`, otherwise → Home
- [x] **`/cook` page** — basic stub with button
- [x] **`cook_queue`** collection — date, cook (M2O users), dish_name, status
- [x] **`orders`** collection — user (M2O users), cook_queue (M2O cook_queue), status
- [x] **`order_items`** collection — order (M2O orders), quantity
- [x] **`transactions`** collection — user (M2O users), amount, type, description, date
- [x] **`balances`** collection — user (M2O users), amount
- [x] **O2M alias fields** — `cook_queue` → orders, `orders` → items
- [x] **Profile page** — `pages/profile.vue` with avatar, tabs, recipe lists
- [x] **Home header** — updated with clickable profile, avatar and bell icon
- [x] **`app.vue` layout** — iPhone frame, Dynamic Island, safe area, scroll
- [x] **Floating BottomTabBar** — pill, backdrop-blur, absolute positioning
- [x] **HeroBlock.vue** — 3 states: loading, cook assigned, empty
- [x] **HeroBlock.vue** — click on dish name → emit `view-dish`, text wrap via `break-words max-w-[55%]`
- [x] **RecipeCard.vue** — dish card with skeleton and mock data
- [x] **BalanceWidget.vue** — fetch balance from Directus balances collection
- [x] **DutyWidget.vue** — nearest duty widget
- [x] **Home screen** — full screen: HeroBlock, participant counter, BalanceWidget + DutyWidget in grid, search, RecipeCard with mock data
- [x] **Recipe Detail stub** — `pages/recipe/today.vue` with mock data (Caesar Salad)
- [x] **Recipe Detail redesign** — ekilu-style: photo 280px with buttons, white card -mt-6, rating, cook, description, ingredients, fixed Join button at bottom
- [x] **Nuxt 4 directory structure** — all app code moved to `app/` (`app.vue`, `pages/`, `components/`, `composables/`, `layouts/`, `middleware/`, `assets/`), dev server verified

## Known issues
- **Sign Up works** through server proxy (`server/api/auth/signup.post.ts`) — creates user via admin token
- **CORS on Directus** — enabled (`CORS_ENABLED`, `CORS_ORIGIN: http://localhost:3000`)
- **Balance and Today's Cook** on index.vue — placeholders (€0.00 / —). Will be populated after setting up Directus collections
- **Phase 4 screens** — Kitchen, AI Recipe, Duty, Common, Cook Page, Recipe Detail, Finance, Notifications all stubs or unfinished

## Next session — plan

### Phase 4: Feature Screens
**Goal:** Final layout of all screens according to the current screen map.

- [x] Navigation (BottomTabBar) — 5 tabs with new icons, routes for Phase 4, Admin logic
- [x] Home screen — HeroBlock, "I'm eating"/"Become a cook" buttons, counter, BalanceWidget, DutyWidget, search, RecipeCard
- [x] HeroBlock.vue — 3 states (loading/cook/empty)
- [x] RecipeCard.vue — card with mock data and skeleton
- [x] BalanceWidget.vue — query to balances via Directus
- [x] DutyWidget.vue — widget for duty
- [ ] Kitchen screen — cook queue, dish history, search, ratings
- [ ] AI Recipe — chat with AI, JSON recipe render, serving recalculation
- [ ] Duty screen — duty calendar, confirmation, auto-assignment
- [ ] Common screen — group purchases, announcements, polls
- [ ] Cook Page — balance deduction, check, auto share calculation
- [ ] Recipe Detail — populate with real data from cook_queue, ingredients, steps, serving recalculation
- [ ] Finance page — balance table, alerts, history, report
- [ ] Notifications — feed, quick actions
- [ ] Reusable components: RecipeCard, HeroBlock, BalanceWidget, ParticipantCounter, DutyWidget

## Git log
- `94fc7a4` — feat(onboarding): replace absolute layout with flex, add lang=ts
- `376d90f` — feat(layout): add BottomTabBar with 5 tabs, wire into default layout
- `adff924` — feat(auth): add fake login flow, form validation, route protection, darkStatus
- `5a16375` — chore: update git log in progress.md
- `ef1d539` — feat(auth): replace fake login with real Directus auth + signup proxy
- `96cde43` — chore: update git log in progress.md
- `b130126` — feat(docs): sync progress log, reorder roadmap phases, update AGENTS workflow
- `7caac6a` — feat(schema): create 5 Directus collections + dynamic login redirect
- `ba67cc7` — fix(frontend): typescript and syntax cleanup
- `46c47da` — fix(auth): replace Transition v-if with v-show, add autocomplete attributes
- `4d4b236` — fix(auth): smooth opacity-only field transition, stable form height
- `514a823` — chore: add camera indicator to notch, commit frequency rules, update progress
- `(not committed)` — feat(layout): create app.vue layout with safe area padding, redesign BottomTabBar to floating pill
- `aef7403` — feat(profile): add profile page, home header block with avatar, Gravatar → pravatar
- `da4b884` — feat(layout): add app layout with floating BottomTabBar and stub pages
- `b847eb4` — feat(navigation): update BottomTabBar with Phase 4 icons, routes, and admin logic
- `e5a2f1c` — feat(home): build Home screen with HeroBlock, RecipeCard, BalanceWidget, DutyWidget
- `8c3d1b4` — chore(home): add hero decorative assets, polish HeroBlock layout
- `11a4f05` — feat(recipe): add Recipe Detail page with ekilu-style layout, collapsible ingredients, sticky join button
