# ItoCook — Progress Log

## Current session — Push notifications + TZ fix + CRON Berlin local time (2026-06-30)
- [x] **Part A: Modified Morning Reminder flow** — CRON `0 */30 7-8 * * 1-5` (UTC, =9-10 CEST); added `check_time` exec + `time_ok` Condition to skip 8:30 UTC (10:30 CEST); replaced throw-based guard with Condition-based graceful skip
- [x] **Part B: Created Cook Stale Reminder flow** (ID `9611f64f`) — CRON `0 */30 7-8 * * 1-5`; chain: check_time → get_today → fetch_queue → check_stale → has_stale → build_payloads → notify_cooks
- [x] **Diagnosis: Schedule trigger caching** — Directus v11 uses node-cron; schedule jobs registered at process start. UI cron changes require container restart. Confirmed: change-then-restart works (test cron `0 7 13 * * 1-5` fired at 13:07 UTC after restart)
- [x] **TimeZone discovery** — Directus container runs UTC, not CEST. CRON adjusted to UTC hours (`7-8` = 9-10 CEST). `check_time` blocks `h===8 && m>=30` (10:30 CEST)
- [x] **docker-compose.yml indentation fix** — frontend service moved from indent 0 to indent 2 under services
- [x] **PART 1: Add push notifications to Cook Stale Reminder** — copied `push_ids` exec + `send_push` request from Morning Reminder exactly; linked chain: `notify_users` → `push_ids` → `send_push`. E2E test passed: flow triggered returns `{"sent":1,"failed":0}` on test cook `c9c1f137`
- [x] **PART 2: Fix container TZ to Europe/Berlin** — added `TZ: "Europe/Berlin"` to directus service in `docker-compose.yml`; recreated container (`docker compose up -d --force-recreate directus`). Node.js inside container correctly reports CEST hours (`new Date().getHours()` = 16, offset -120)
- [x] **PART 2: Restore CRON/exec to Berlin local time** — all 3 schedule flows updated:
  - Morning Reminder: CRON `0 */30 9-10 * * 1-5`, `check_time` blocks `h===10 && m>=30`
  - Cook Stale Reminder: CRON `0 */30 9-10 * * 1-5`, `check_time` blocks `h===10 && m>=30`
  - Duty Reminder: CRON `30 10 * * 1-5` (was `30 8`, now 10:30 Berlin local)
- [x] **E2E verification** — container restarted; flow triggered manually via webhook → returns `{"sent":1,"failed":0}`; schedule trigger restored

## Current session — Company account + guests + Company Pays All (2026-06-29)
- [x] **Directus: company_account collection** — singleton with `balance` (decimal, default 0), `updated_at`. Seeded with balance 0.
- [x] **Directus: company_transactions collection** — UUID PK, `amount`, `description`, `date_created`, `cook_queue` (M2O, nullable). User Policy read-only, Admin Policy full access.
- [x] **Directus: guests field on orders** — JSON (nullable) on `orders` collection.
- [x] **Directus: balance field scale fix** — `company_account.balance` numeric_scale changed from 5→2.
- [x] **Feat: Guest UI in cook.vue ready state** — Add Guest / remove buttons, name input per guest, company balance display, company pays label.
- [x] **Feat: Guest deduction server logic** — `confirm.post.ts` creates `company_transactions` per guest, updates company account balance dynamically (no hardcoded `/1`).
- [x] **Feat: Company Pays All toggle** — custom switch in cook.vue ready state (below deduction preview, above Guests). When enabled: server skips all user transactions/balances, creates single `company_transaction` for full amount, updates company balance. `deductedCompanyPaysAll` tracked for done state display.
- [x] **Fix: company_account singleton usage** — `finance.vue` `fetchCompanyAccount`/`submitCompanyTopup` and `confirm.post.ts` `updateCompanyBalance` now use singleton endpoints directly (`GET /items/company_account` returns `{ data: { balance } }`, `PATCH /items/company_account` without ID suffix). Removed all dynamic-ID-lookup, get-or-create, and `?limit=1` workarounds.
- [x] **Fix: Deduction guards** — `useDeduction.confirmDeduction` early return changed from `participants.length === 0` to `participants.length === 0 && !companyPaysAll`.
- [x] **Security: Server-side share recalculation** — share = `totalAmount / totalParticipants` (guests included), ignoring client-sent `p.share` values.
- [x] **Fix: company_account PATCH 404 on first use** — (now moot) `company_account` is a singleton, so PATCH always works. Removed all POST-to-create and dynamic-ID lookup logic from `finance.vue` and `confirm.post.ts`.
- [x] **Fix: companyPaysAll early return** — `confirm.post.ts` companyPaysAll branch now marks `cook_queue` as completed inside the `if` block then `return { success: true }` — no else branch DB writes (user balances/transactions) executed.
- [x] **Fix: Deduction preview hides individual rows when companyPaysAll** — `cook.vue` ready state: when toggle ON, deduction preview shows single line "Full amount → Company account" instead of per-user rows. Guests section hidden via `v-if="!companyPaysAll"`.
- [x] **Fix: company_transactions.amount scale** — Directus field `numeric_precision=10, numeric_scale=2` (was scale=5). `company_account.balance` already had correct scale=2.

## Current session — Join button fix + status badge (2026-06-29)
- [x] **Fix: Join blocked when queue status is `ready` or `cancelled`** — Join only allowed for `scheduled` or `cooking`. Removed all references to non-existent `completed` status. `activeEntryId`/`fetchTodayHero` now only picks `cooking` or `scheduled` entries (was `ready` fallback or `items[0]`). `weekSlots` and `isCurrentUserCookForSelected` keep `ready` for display. `recipe/[id].vue` `statusConfig` had stray `completed` case removed. `canJoin` was already correct.
- [x] **Feat: HeroBlock status badge** — added `queueStatus` prop; pill badge between title and buttons (`scheduled` → "Preparing..." bg-purple-100, `cooking` → "Cooking now 🍳" bg-green-pastel, `ready` → "Lunch is ready! 🎉" bg-green-pastel). Matches `recipe/[id].vue` `statusConfig` colors.
- [x] **Fix: HeroBlock Join button hidden for ready** — `v-if="queueStatus !== 'ready' && queueStatus !== 'cancelled'"` on Join button. Cook/Cook→ buttons unchanged.
- [x] **Fix: participant count for `ready` entries** — `index.vue` `fetchTodayHero()` split into `displayEntry` (cooking > ready > scheduled > null) and `joinEntry` (cooking > scheduled > null). `todayEntryId` set from `joinEntry` (null for ready), participants fetched manually for display when ready. `kitchen.vue` added `displayEntryId` computed + separate `displayParticipantCount` ref + combined watch on `[activeEntryId, displayEntryId]` to fetch participants for ready status. `heroParticipantCount` computed selects the right source.

## Current status
- [x] **Roadmap updated** — Phase 6: ✅→🟡 (Steps 5–7 remain), Phase 6b: SW marked resolved, Chrome push marked wontfix, removed outdated "next session" block
- [x] **Phase 7a: Testing added** — between Phase 7 and Phase 8 with 7 checklist items (Vitest, composable tests, component tests, API tests, E2E, CI integration)
- [x] **UI Polish Audit** — `docs/audits/ui-polish-audit.md` created using `make-interfaces-feel-better` skill; 12 findings across typography, surfaces, animations, performance (3 High, 5 Medium, 4 Low priority)
- [x] **Harness: Superpowers Framework installed** — plugin `superpowers@git+https://github.com/obra/superpowers.git` added to `opencode.jsonc`; provides brainstorming, planning, TDD, code review, systematic debugging skills
- [x] **Harness: session-start skill created** — `~/.config/opencode/skills/session-start/SKILL.md`; agent reads progress+roadmap and outputs session brief before coding
- [x] **Harness: code-reviewer skill created** — `~/.config/opencode/skills/code-reviewer/SKILL.md`; agent runs checklist (TS, Vue, Directus, Design) before saying "done"
- [x] **Harness: .planning/ structure created** — `milestones/v1.0-REQUIREMENTS.md`, `phases/05-08/PLAN.md` for remaining phases
- [x] **Harness: self-diagnostic report** — `notes/Harness/harness-overview.md` written (agent self-diagnostic, 41+ skills cataloged, 9-layer harness documented)
- [x] **Harness: report updated** — harness-overview.md + harness-diagram.html + progress.md: security audit §3.1, codebase-health-check §3.2/§9 SKILLS, test suite §9 Tests / §7 VERIFICATION
- [x] **Task E: Admin Finances page** — balances overview (all users, color-coded), manual top-up form (select user + amount + note, creates transaction + updates balance), transaction history (last 50, date desc), pasta package price inline edit (reuses existing app_settings from Task F). Created Nuxt server routes: `GET /api/users/list` (admin proxy), `PATCH /api/settings/pasta-price`. Gate already in BottomTabBar (non-User role → ChartBar tab → /finance).
- [x] **Finance polish + low-balance restriction** — explicit minus sign for negative balances; tiered BalanceWidget coloring (bg-primary-pale/≥0, bg-red-50/-0.01 to -5, bg-red-100/< -5); `useBalanceCheck` composable (threshold -30); balance gate on Join (via `useParticipants.join`) and Become Cook (via `cook.vue.assignAsCook`); collapsible transaction history (show 5, expand to scrollable max-h-[400px] with toggle).
- [x] **Finance polish round 2** — removed "(owed)" label from negative balances; reorder sections to Balances → Manual Top-up → Pasta Package Price → Transaction History; BalanceWidget thresholds adjusted (>=5 default, 0–<5 mild red-50, <0 strong red-100); transaction history replaced with recipe/create.vue slider pattern (VISIBLE_COUNT=5, up/down arrows, translateY transition, touch handlers) + separate "Show all" button expanding to full list.
- [x] **Feat: Edit Recipe in scheduled state** — added "Edit Recipe" / "Add Recipe" button to `cook.vue` 'scheduled' state, reusing the same `recipeSearchDone`/`existingRecipeId` pattern from the 'cooking' state. Cook can now edit recipe details before starting to cook.
- [x] **Architecture overview** — `notes/architecture-overview.md` (full structural analysis)
- [x] **Code walkthrough** — `notes/itocook-full-overview.md` (step-by-step code tour)
- [x] **Directus API comments** — added `// directus api` comments to all call sites
- [x] Project structure set up (frontend/, api/, directus/)
- [x] Docker running (Nuxt + Directus + PostgreSQL)
- [x] iPhone frame layout, Onboarding, Auth, Tailwind, Jost, Phosphor Icons
- [x] Auth — real Directus signUp/login/logout, form validation, password toggle, middleware
- [x] Nuxt 4 app/ directory structure migrated
- [x] 5 Directus collections (cook_queue, orders, order_items, transactions, balances)
- [x] `recipes` collection with read/create/update/delete for User role
- [x] 4 seed recipes (Caesar Salad, Spaghetti Carbonara, Tomato Soup, Grilled Salmon)
- [x] All screens: Home, Profile, Kitchen, Cook Panel, Recipe Detail, Recipe Create/Edit
- [x] BottomTabBar with 5 tabs, app layout with iPhone frame, Dynamic Island
- [x] HeroBlock.vue — 3 states (loading/cook/empty), links to recipe
- [x] RecipeCard.vue — skeleton, category badge, dish image via `useRecipeImage`
- [x] WeekCalendar.vue — horizontal week pills, dot indicators, week navigation
- [x] BalanceWidget.vue, DutyWidget.vue
- [x] `useRecipeImage` composable — photo or category fallback PNG
- [x] `useParticipants` composable — shared participant count, hasJoined, join()
- [x] `useDirectus` composable — HTTP client
- [x] `useAuth` composable — signUp, login, logout, fetchUser, isTodayCook
- [x] **Fix: auto-redirect removed from auth.vue** — login always redirects to `/` (never `/cook`)
- [x] **Fix: Calendar → HeroBlock sync in kitchen.vue** — hero derives from selectedSlot reactively; recipeId + category fetched via watch on selectedSlot; participants fetched per selected day
- [x] **Fix: Recipe detail conditional Join** — `recipe/[id].vue` auto-discovers active cook_queue entries by dish_name; Join button only visible when active entry exists
- [x] **Fix: RecipeCard missing images** — `photo` field in Recipe interface; `<img>` tag with `useRecipeImage` in template; `photo` field passed from `index.vue` mapping
- [x] **Fix: Cook Panel eye icon** — "Edit" link replaced with eye icon button navigating to `/recipe/[id]` (view only) in `cook.vue`
- [x] **Fix: Ingredients default open** — `showIngredients` changed to `ref(true)` in `recipe/[id].vue`
- [x] **Fix: Extended edit permission** — `canEdit` computed in `recipe/[id].vue`: edit button visible if recipe owner OR today's cook with linked queue entry
- [x] **Fix: Status-based bottom controls** — `recipe/[id].vue` shows badges per queue status: "Scheduled for [date]", "Cooking in progress", "Lunch is ready!", "Cancelled"; Join button only for scheduled/cooking; "Lunch is ready!" only for cooking owner
- [x] **Fix: Calendar today highlight** — `WeekCalendar.vue` today (not selected) uses `bg-purple-100 text-purple-700` instead of plain white
- [x] **Task A': Split "Lunch is ready" from cost entry** — `markReady()` only sets `status: 'ready'` (no longer auto-transitions to receipt step); receipt form is shown in the `'ready'` state itself, accessible independently; overdue badge appears when past 14:00 same day; `confirmDeduction()` unchanged (split logic preserved, sets status to `'completed'`)
- [x] **Task C: Cook cancels cook_queue entry** — "Cancel Cooking" button appears in `dish`/`scheduled`/`cooking` states (not in `ready`/`done`); confirmation dialog before action; on confirm: PATCH `cook_queue → status: 'cancelled'`, DELETE all related confirmed orders, navigate to `/kitchen`; no balances/transactions touched
- [x] **Fix: hardcoded totalCount** — replaced `ref(8)` in `index.vue` and `kitchen.vue` with `useTotalUsers()` composable via Nuxt server route `/api/users/count` (admin-proxied to Directus `/users` endpoint). Fixes 403 on `/items/directus_users` for authenticated users. Verified: all 3 users have `status: "active"`; `/users?aggregate[count]=*&filter[status][_eq]=active` returns `{"data":[{"count":"3"}]}` (string, not object); parsing uses `parseInt(raw, 10)`.
- [x] **Fix: missing dutyLoading ref** — `const dutyLoading = ref(true)` was accidentally removed from `index.vue`; added back. Fixes Vue warning "Property 'dutyLoading' was accessed during render but is not defined on instance".
- [x] **Fix: naming collision in useTotalUsers.ts** — inner function named `fetch()` shadowed global `fetch`, causing `fetch('/api/users/count')` to call itself recursively → caught → `count.value = 0`. Renamed to `fetchCount`; callers unaffected (both destructure only `{ count: totalCount }`).
- [x] **Task F: Recipe pasta/inventory field** — added `pasta_packages` (integer, nullable) to `recipes` collection; created `app_settings` singleton with `pasta_package_price` (decimal, default 1.00); added number input in recipe create/edit form; created Nuxt server route `GET /api/settings/pasta-price` (admin proxy); created `useMealCost()` composable for computation; integrated pasta cost into `confirmDeduction()` — added to total before split, displayed as separate line in receipt preview and deduction breakdown; kept generic enough for future inventory items.
- [x] **Recipe photo upload** — replaced URL text input in `recipe/create.vue` with `RecipeImageUpload` component (file picker / drag & drop / paste from clipboard); client-side resize via canvas (max 1200px, JPEG quality 0.85, max 5MB); uploads to Directus Files (`recipe-photos` folder); stores file UUID in `recipes.photo` field. Added `uploadFile()` to `useDirectus.ts`. Refactored `useRecipeImage` to return `{ src, isUploaded }` object — UUIDs resolved to Directus asset URL. `RecipeCard.vue` and `HeroBlock.vue` show circular thumbnail (68–72px, rounded-full, border-white) for uploaded photos; demo category PNGs keep full-width display. Created `directus_files` create+read permissions for the User policy.
- [x] **TZ fix: container TZ set to Europe/Berlin** — directus service gets `TZ: "Europe/Berlin"` in docker-compose.prod.yml; CRON expressions written in Berlin local time; DST handled automatically by OS
- [x] **Cook Stale Reminder flow** — new Directus schedule flow (ID `9611f64f`) with push notifications; type `cook_reminder` added to notifications collection; full push chain (notify_users → push_ids → send_push) confirmed working E2E
- [x] **Push fix: Cook Stale Reminder push chain** — copied `push_ids` exec + `send_push` request from Morning Reminder; E2E test returned `{"sent":1,"failed":0}`
- [x] **CRON in Berlin local time** — all 3 schedule flows updated: Morning Reminder `0 */30 9-10 * * 1-5`, Cook Stale Reminder same, Duty Reminder `30 10 * * 1-5`. `check_time` blocks 10:30 for window 9:00–10:00.
- [x] **Chrome push error suppressed** — changed `console.error` to `console.debug` in usePushNotifications.ts for known Chrome FCM AbortError
- [x] **Manifest fix** — created `app/public/manifest.webmanifest` with valid JSON to prevent 404/parse errors in dev mode
- [x] **Docs: docs/architecture/notifications.md updated** — 4 corrections (table count, type list, flow architecture section, known limitations)
- [x] **Docs: docs/architecture/deployment-pwa.md created** — production deployment architecture, PWA setup, push notifications, nginx config, operational rules
- [x] **Docs: CONTEXT.md updated** — added cook_reminder, Cook Stale Reminder, company_account, company_transactions, guests, TZ cron convention, Directus Flows not version-controlled
- [x] **Docs: AGENTS.md updated** — added CRON restart rule and Flows-not-version-controlled rule

## Known issues
- **Phase 4 screens** — AI Recipe and Common screens still stubs/unfinished
- **Cook Page balance deduction** — uses user token directly, may need Directus permissions or server proxy for /items/balances and /items/transactions on behalf of other users
- **RecipeImageUpload paste on edit** — paste listener is not blocked when editing an existing recipe with a photo; paste triggers `processFile` which replaces the preview. Workaround: OK — the deferred pattern means nothing is uploaded until save, and old photo is cleaned up on save if replaced.
- **Schedule trigger changes require container restart** — Directus v11 uses node-cron; cron config read at process start. Any UI/MCP cron edit needs `docker compose restart directus` to take effect.
- **Chrome desktop push** — `AbortError: push service error` — Chrome uses FCM which has additional requirements. Low priority.
- **Morning Reminder on production uses throw-based guard** — not migrated to Condition operation; works correctly either way, low priority cosmetic issue.
- **`--build` does NOT `--force-recreate`** — env var changes (like TZ) require manual SSH step to recreate containers after deploy.

## Next session — plan
- Phase 6 Steps 5–7: status choices, ghost participants, notification preferences
- Phase 5: AI Recipe screen, Common screen
- Phase 7: ratings, receipt photo upload, estimated_price field, weekly vote
- Phase 7a: Automated tests setup

## Current session — Deploy & PWA (2026-06-23)
- [x] **frontend/Dockerfile.prod** — multi-stage build (`npm ci` → `npm run build` → `node output/server/index.mjs`)
- [x] **api/Dockerfile** — removed `--reload` flag
- [x] **docker-compose.prod.yml** — 4 services (postgres, directus, frontend, api), no dev volumes, domain URLs
- [x] **.github/workflows/deploy.yml** — auto-deploy via SSH on push to main
- [x] **@vite-pwa/nuxt** — installed, configured with `injectManifest` strategy (preserves custom sw.js)
- [x] **PWA manifest** — name, short_name, display standalone, icons
- [x] **PWA icons** — placeholder 192x192 + 512x512 PNGs in `public/icons/`
- [x] **docs/deployment.md** — deployment architecture diagram, file list, server setup, CI/CD docs
- [x] **docs/roadmap.md** — Phase 6b: Deploy & PWA added with checklist

## Fixes — current session
- [x] **Fix: Safe area top inset (attempt 4)** — `app.vue` layout: status bar wrapper now has `bg-white` and `padding-top: env(safe-area-inset-top, 44px)`; content padding changed from `calc(60px + env(..., 0px))` to `calc(48px + env(..., 44px))`. Creates a persistent opaque top bar with solid background, preventing content from scrolling under it.
- [x] **Fix: Layout assignment** — `default.vue` reverted to transparent status bar (no white backdrop, no extra padding-top); `auth.vue` and `onboarding.vue` now explicitly set `layout: 'default'`. All 12 pages now have explicit layout assignments (recipe/today.vue was an empty stub and has been removed).
- [x] **Fix: HeroBlock Cook button (attempt 2)** — replaced `@click="$emit('become-cook')"` with `@click="onBecomeCook"` JS guard that checks `if (props.cook) return` before emitting. `:disabled` attr alone wasn't reliably blocking navigation in all cases.
- [x] **Chore: Remove empty recipe/today.vue** — file was a 6-line stub with no content, moved to notes/deleted/.
- [x] **UX: Cook page two-button dish selection** — `cook.vue` now has two-button layout in 'dish' state: (1) "Add to Schedule" single button when `dishName` matches recipe history via `_icontains`; (2) two buttons ("Add to Schedule" + "Create Recipe & Add to Schedule") when no match; "Create Recipe & Add to Schedule" navigates to `/recipe/create?returnTo=...` and returns with `newRecipe` param to auto-link; `recipe/create.vue` supports `returnTo` query param for navigating back after save
- [x] **UX: Status-based bottom controls** — `recipe/[id].vue` shows badges per queue status; Join only for `scheduled`/`cooking`; "Lunch is ready!" only for cooking owner
- [x] **UX: Calendar today highlight** — today's non-selected cell gets `bg-purple-100 text-purple-700`
- [x] **UX: Cook page status refresh** — `visibilitychange` listener re-fetches cook entry data when page becomes visible; status syncs with admin changes
- [x] **UX: HeroBlock Cook button date fix** — `@go-to-cook` passes `?date=` param instead of bare `/cook`
- [x] **UX: Cooking pot status icon** — recipe/[id].vue header shows `PhCookingPot` in status color when queue entry linked; `PhClock` added to scheduled badge
- [x] **UX: Profile My List** — dishes user participated in; red X → confirmation with 10h rule → delete order from DB; darker bg + "You are the cook" when user is cook
 - [x] **UX: Profile My Recipes** — recipes created by user; items use random pastel colors from design palette
 - [x] **Fix: RecipeGridItem image binding** — changed template to use `image.src` (Vue template unwraps refs) and added `alt` attribute for accessibility.

## Fixes — second session
- [x] **Bug: Recipe page heart hidden** — reverted cooking pot from header to bottom controls section; `PhHeart` restored unconditionally in top right corner;
- [x] **Bug: Cook page status mismatch** — `scheduled` and `cooking` split into separate states in `cook.vue` state machine; added `scheduled` template with "Start Cooking" button that sets status to `cooking`; `pageTitle` reflects correct state
- [x] **Bug: HeroBlock Cook redirects to home** — middleware `_nin` filter format fixed from single string to proper `_nin[]` array via `URLSearchParams.append`; cook middleware now correctly queries non-cancelled entries
- [x] **Bug: Profile My List empty on first load** — `onMounted` added to call `fetchMyOrders()` on initial page load; `switchTab` changed from lazy (`length === 0` guard) to always-fetch on tab switch
- [x] **Bug: Confirm dialog outside phone frame** — `Teleport to="body"` removed from profile.vue; fixed overlay rendered inside the `app` layout scope
- [x] **Bug: DELETE response JSON parse crash** — `useDirectus.ts` changed from `res.json()` to `res.text()` + conditional `JSON.parse`; handles 204 No Content (empty body from DELETE) without crashing
- [x] **UX: Cook X button → kitchen** — `router.push('/')` changed to `router.push('/kitchen')` in cook.vue
- [x] **UX: saveDish status by date** — today dish → status=`cooking`, future dish → status=`scheduled`; button text changes dynamically ("Start Cooking" / "Add to Schedule")
- [x] **UX: Unified status template** — recipe/[id].vue bottom controls: single dynamic template; icon/circle/text changes by status (`PhClock`/`PhCookingPot`/`PhCheckCircle`/`PhXCircle`); participants count always visible; Join/Start/Ready buttons adapt to status and ownership
- [x] **Bug: Admin can edit any recipe** — `canEdit` now checks `isEntryCook` (specific queue entry cook) instead of `isCurrentUserTodayCook` (any cook today); removed `fetchIsTodayCook` call from recipe page entirely
- [x] **Bug: _nin format in useAuth** — same fix as middleware: `URLSearchParams` single string → proper `_nin[]` array
- [x] **UX: Auto-join for cook** — `assignAsCook()` in cook.vue creates a `confirmed` order for the cook; cook appears in participants automatically; Join button shows as joined for the cook
- [x] **UX: Recipe ownership on cook** — `saveDish()` in cook.vue updates recipe's `cook` field to current user after matching; recipe appears in their "My Recipes" and shows their avatar
- [x] **UX: Recent Dishes grid** — home page switched to `grid grid-cols-2 gap-3`; RecipeCard redesigned: title → chef → rating → small image, no button, no category

## Fixes — third session
- [x] **Bug: Orphaned orders in Profile My List** — when a `cook_queue` entry is deleted from admin, linked `orders` entries with null FK no longer render (API filter `_nnull`); clicking "X" on an orphaned card deletes the order directly by ID, skipping the modal flow

## Fixes — fourth session
- [x] **Feat: HeroBlock fallback image** — `chef-cook.png` when queue entry has no linked recipe; "Chef is thinking..." placeholder text
- [x] **Rework: Fork on cook** — replaced shared `recipes.cook` PATCH + `cooked_recipes` junction with fork pattern. When user cooks another's recipe, a fork (copy with `forked_from` pointer, owned by cook) is created. `recipes.update` permission restored to `user_created Equals $CURRENT_USER`. Reuses existing fork on repeat. "My Recipes" back to simple `filter[user_created]` query.

## Fixes — fifth session
- [x] **UX: Schedule button for today** — `cook.vue` dish state shows single "Start Cooking" button when date is today (via `isToday` computed), immediately transitions to `cooking` state; existing two-button layout preserved for future dates
- [x] **UX: Author attribution in history picker** — `cook.vue` "Or pick from history" now displays `by <author> · <date>` beneath each recipe name; `fetchPastDishes()` fetches `cook.id,cook.first_name,cook.last_name,date_created` and maps to `cookName`/`dateLabel`
- [x] **Fix: Safe area top inset (attempt 3, superseded)** — `app.vue` content area uses `padding-top: calc(60px + env(safe-area-inset-top, 0px))`; `nuxt.config.ts` viewport meta updated to `viewport-fit=cover`.
- [x] **UX: HeroBlock empty-state CTA** — `HeroBlock.vue` shows centered empty-state ("No one's cooking yet — Be today's chef!") with "I'm cooking today!" CTA when `cook` is null; existing content preserved when a cook is assigned

## Fixes — seventh session
- [x] **Fix: Permissions 403 on PATCH/DELETE directus_files** — added `update` + `delete` permissions for User Policy on `directus_files` (all fields `*`); resolves the 403 from the PATCH fallback in `uploadFile()` that sets folder after upload
- [x] **Fix: Orphaned file cleanup on save failure** — `submitRecipe()` in `recipe/create.vue` now tracks `uploadedFileId` and calls `deleteFile()` if recipe save fails after upload
- [x] **Fix: Old photo cleanup on edit** — `recipe/create.vue` stores `originalPhoto` when loading recipe for editing; on successful save, deletes the old file if photo was replaced or cleared
- [x] **Fix: HeroBlock photo priority** — `kitchen.vue` now fetches `photo` field from matching recipe and passes it in `heroCook`; uploaded recipe photo takes priority over category demo image
- [x] **Fix: recipe detail hero image** — uploaded photos use `object-cover` (fill container) while demo images keep `object-contain` (fit inside)
- [x] **Fix: duplicate onMounted in RecipeImageUpload** — consolidated paste listener into single `onMounted`
- [x] **Fix: TS paste handler** — `item.getAsFile()` guarded by null check

## Fixes — eighth session
- [x] **Feat: Pizza category** — added `'pizza'` to CATEGORIES in `cook.vue` and `recipe/create.vue`; added `pizza.png` to `CATEGORY_IMAGES` in `useRecipeImage.ts`; added Pizza choice to Directus `recipes.category` field
- [x] **Fix: Today cook flow → scheduled first** — `saveDish()` in `cook.vue` now always sets `status: 'scheduled'` (was `'cooking'` for today); dish state template shows same buttons for all dates (no more "Start Cooking" shortcut for today); user goes through scheduled state with Edit/Start/Cancel options
- [x] **Fix: Prefill recipe form from history** — `recipe/create.vue` now searches for existing recipe by name (via `loadRecipeFromHistory`) when opened with `?name=` but no `?id=`; pre-fills description, photo, pasta_packages, ingredients, steps
- [x] **Fix: HeroBlock category display** — added `<span v-if="cook.category">` between dish name and "by cook.name" in `HeroBlock.vue` dish info
- [x] **Fix: HeroBlock cook button disabled for all when queue exists** — added `hasExistingQueue` prop to `HeroBlock.vue`; disables "I'm cooking today!" and "Cook" buttons both via `:disabled` + `pointer-events-none` + JS guard in `onBecomeCook()`; `index.vue` tracks `hasTodayQueue` explicitly from `items.length > 0`; `kitchen.vue` added `hasSelectedQueue` computed

## Fixes — ninth session
- [x] **Security fix: cookie flags + server auth** — `directus_token` cookie: `httpOnly: false` (required by JS Bearer-token pattern for cross-origin Directus), `secure: !import.meta.dev`; created `server/utils/auth.ts` (requireAuth helper); added auth check to all 7 server API routes (excl. signup.post)
- [x] **Security fix: confirmDeduction() moved to server admin-proxy** — created `server/api/deduction/confirm.post.ts` (requireAuth + admin token); `useDeduction.ts` now calls `/api/deduction/confirm` instead of direct Directus API; horizontal escalation risk eliminated. Found: User policy has unrestricted create/update on `balances` and `transactions` (policy `e563cf6a`) — no `$CURRENT_USER` filter — but this is now mitigated by admin-proxy.
- [x] **Security fix: .env/docker-compose hardening** — changed `DIRECTUS_ADMIN_PASSWORD` from `admin` to `ItoCook2026!dev`; rotated `DIRECTUS_KEY` and `DIRECTUS_SECRET` to random 32-hex values; set `CORS_MAX_AGE` from `5` to `600`; set `ACCESS_TOKEN_TTL` from `7d` to `24h`. ⚠️ Docker restart required for changes to take effect.
- **⚠️ Admin password was changed.** After Docker restart, Directus admin login will use the new password from `.env`. The old `admin` password no longer works.
- [x] **Security fix: rate limiting on signup** — in-memory rate limiter on `/api/auth/signup` (max 5 req / 60s per IP). Map resets on server restart. No npm packages added.

## Current session — security
- [x] **Security fix: signup input validation** — email regex, password 8+ chars with upper+lower+digit, name length 1-100
- [x] **Security fix: admin token caching** — created `server/utils/adminToken.ts` (in-memory cache with 23h TTL); refactored all 8 server routes (signup, deduction confirm, duty confirm/upsert, pasta-price get/patch, users count/list) to use `getAdminToken(config)` instead of per-request `POST /auth/login`
- [x] **Fix: TS errors from refactoring** — added null guard for `json.data.access_token` in `adminToken.ts`; restored `DirectusError` interface in `deduction/confirm.post.ts`

## Security audit — 2026-06-28
- [x] **Full security audit completed** — 4 layers audited (Nuxt routes, Directus policies, nginx, auth edge cases)
- [x] **3 CRITICAL findings** — `directus_users` unrestricted read (all fields exposed), `balances` create/update unrestricted, `transactions` create unrestricted
- [x] **2 HIGH findings** — `cook_queue` update unrestricted, `orders` update/delete unrestricted
- [x] **2 MEDIUM findings** — `update-me.patch.ts` accepts unrestricted body, missing CSP in nginx
- [x] **2 LOW findings** — missing security headers in nginx, `pasta_packages` in recipe update field list
- [x] All 11 server routes verified: all protected routes call `requireAuth(event)`
- [x] `docs/audits/security-audit.md` created with full findings and fix recommendations

## Current session — documentation
- [x] **Block 4: CONTEXT.md** — created `docs/CONTEXT.md` — domain glossary with 30+ terms; each entry includes 1-2 sentence definition, file/collection locations, and related terms. Conducted interview on ambiguous terms (cook in 3 meanings, deduction vs cost entry, fork, ghost participant, etc.). Interview resolved term splits and established glossary scope.
- [x] **Step 4.2: useDirectus.ts JSDoc** — added comprehensive JSDoc with business context, caller list, edge cases, and gotchas to `useDirectus.ts` (top-level composable, tokenCookie, request, uploadFile, deleteFile). Created `docs/ARCHITECTURE.md` with core-layer documentation and design rationale.
- [x] **Step 4.2: useAuth.ts JSDoc + TS fix** — fixed TS parsing crash in useDirectus.ts JSDoc (backticks and @link tags caused vue-tsc errors). Added full JSDoc to useAuth.ts with business context, edge cases (admin-proxy signup, silent catch in isTodayCook, no server-side logout, auto-login after signup), caller list, and Directus endpoints. Appended auth-layer section to `docs/ARCHITECTURE.md`.
- [x] **Step 4.2: cook.vue JSDoc** — expanded detailed JSDoc on script setup, state machine, all action functions (assignAsCook, saveDish, cancelCooking, markReady, etc.), key computeds, lifecycle hooks, interfaces. Appended Cook Panel section to `docs/ARCHITECTURE.md`.
- [x] **Step 4.2: useDeduction.ts JSDoc** — added detailed JSDoc to DeductionParams interface, useDeduction composable, all exported functions (loadPastaCost, cleanupShoppingList, confirmDeduction) and reactive state refs (deducting, pastaCost, pastaBreakdown). Documented admin-proxy pattern, dual-source pasta cost, two-strategy shopping list cleanup, best-effort error handling, and plain-object reactive wrapping requirement. Appended Deduction section to `docs/ARCHITECTURE.md`.
- [x] **Step 4.2: useParticipants.ts JSDoc** — added detailed JSDoc to ParticipantSummary interface, useParticipants composable, all exported refs (confirmed, hasJoined, loading, joinBlockedReason, participantsList) and functions (fetch, join). Documented reactive cookQueueId pattern, balance gate in join(), plain-object/reactive requirement, and silent error handling. Appended Participants section to `docs/ARCHITECTURE.md`.
- [x] **Step 4.2: useBalanceCheck.ts JSDoc** — added detailed JSDoc to useBalanceCheck composable, check() function, and MIN_BALANCE constant. Documented safe fallback on error, no-balance-record edge case, exported MIN_BALANCE. Appended Balance Gate section to `docs/ARCHITECTURE.md`.
- [x] **Step 4.2: useMealCost.ts JSDoc** — added detailed JSDoc to useMealCost composable, pastaPackagePrice ref, fetchPastaPrice() and computePastaCost() functions. Documented admin-proxy pattern, safe fallback price, caching, and pure-function design. Appended Meal Cost section to `docs/ARCHITECTURE.md`.
- [x] **Step 4.3: signup.post.ts JSDoc** — added detailed JSDoc to the Nuxt server route handler, `ipRequestLog`, and `DirectusError`. Documented admin-proxy registration flow, rate-limiting, server-side validation, and error forwarding. Appended Signup Proxy section to `docs/ARCHITECTURE.md`.
- [x] **Step 5-9: Remaining files JSDoc** — added JSDoc to all remaining files in one pass:
  - `server/utils/adminToken.ts` — token caching, Directus login, error edge cases
  - `middleware/cook.ts` — route guard redirect rules, bypass conditions
  - `utils/dedupRecipes.ts` — dedup algorithm, callers, edge cases
  - `utils/ingredientIcons.ts` — emoji lookup, match strategy, fallback
  - `components/HeroBlock.vue` — all exports, props, emits, image priority, functions
- [x] **Step 4.3: ARCHITECTURE_Documentation.md + architecture folder** — created `docs/ARCHITECTURE_Documentation.md` (high-level overview, 2 pages, tech stack, ASCII diagram, links to detail docs); created `docs/architecture/` folder with 6 files:
  - `auth-flow.md` — login, signUp, admin-proxy, tokens, middleware, rate limiting, edge cases
  - `cook-queue.md` — state machine diagram (ASCII), fork-on-cook pattern, cancel flow, participant lifecycle
  - `finance.md` — deduction flow step-by-step (7 steps), balance gate, pasta cost, admin-proxy, edge cases
  - `recipe-system.md` — fork pattern, dedup algorithm, photo upload pipeline, servings scaling, like counts
  - `shopping-list.md` — CRUD flow, auto-cleanup triggers (deduction confirm + cancel), two-strategy cleanup
  - `duty.md` — duty flow, admin edit mode, MonthCalendar reuse, department snapshot, edge cases

## Refactoring session — Phase 1–2
- [x] **Refactoring analysis** — analyzed 5 pages (3855 total lines) for extraction opportunities; identified 13 composable candidates, 4 cross-cutting patterns (slider, shopping list cleanup, participants fetch, date helpers); primary target: `confirmDeduction()` in `cook.vue` (64 lines, 5+ sequential API calls per participant). Findings saved to `docs/audits/refactoring-plan.md`.
- [x] **Fix: Consistent avatar URLs** — standardized all `pravatar.cc` `u` parameter to use `user.id` across `app.vue`, `index.vue`, `recipe/[id].vue`, `profile.vue`. Previously used `email` or `displayCookName`, causing different avatars per screen for the same user.
- [x] **Fix: Avatars in finance Balances** — added user avatar (24px rounded-full) next to each name in both slider and expanded balance list on `finance.vue`.
- [x] **Fix: Avatars not showing in Balances block** — `/api/users/list` was missing `avatar` from query fields and interface. `balanceEntries` iterates this list, so `entry.user.avatar` was `undefined` for everyone. Added `&fields[]=avatar` to the admin-proxy query and `avatar: string | null` to the interface.
- [x] **Feat: Profile avatar upload** — click avatar to upload photo; resized client-side (max 400px JPEG); stored in Directus files, UUID saved to `directus_users.avatar`; `AvatarPlaceholder.vue` SVG fallback replaces Gravatar; header avatar on `index.vue` also updated; Directus permissions restricted to own-avatar-only update.
- [x] **Fix: Avatar upload bugs** — use server proxy (`/api/users/update-me`) for PATCH `/users/me` (CORS); removed folder parameter from `uploadFile` (folder expects UUID, not name).
- [x] **Fix: Pravatar removal from all avatar icons** — replaced pravatar in `finance.vue` (balances), `layouts/app.vue` (participant modal), `recipe/[id].vue` (cook pill) with conditional: uploaded photo → `AvatarPlaceholder` SVG. Added `avatar` field to all user/cook Directus queries. No pravatar references remain in `frontend/app/`.
- [x] **Task G1: Recipe detail author layout fix** — removed PhChefHat icon, moved author line into photo block (bottom-left pill), restored title/category/likes layout
- [x] **Task G2: Servings selector with ingredient scaling** — servings UI pills [base,10,15,20] + custom input below category; `scaleAmount()` with ratio scaling + whole-unit ceil; scaled amounts render in `text-primary font-semibold`; "Apply for N participants" button; `servings` field added to Directus fetch
- [x] **Fixes: 4 UI/logic fixes** — (1) Join button hidden for recipe cook, (2) Eye icon on Today's Dish in cook panel, (3) Servings selector hidden for non-cook users, (4) Author pill shows queue cook name dynamically + clickable modal with cook's recipes via slider
- [x] **Post-fix: Cook button** — entry cook sees "Start Cooking" / "View Cook Panel" button (→ /cook) instead of Join buttons
- [x] **Post-fix: Servings persistence** — `saveServingsToRecipe` now also scales ingredient amounts by ratio and saves both `servings` + `ingredients` to Directus; no flash/jump because `currentServings` is set to null after save (base = selection)
- [x] **Post-fix: Servings presets** — always 3 pills: [10, 15, 20]; if base differs, last preset (20) replaced with base value
- [x] **G3a: shopping_list_items collection** — created in Directus with fields (id, user M2O, recipe M2O, recipe_name, ingredient_name, amount, unit, emoji, is_checked, sort, date_created); permissions set for User policy (create/read=`*`, update=`is_checked,sort`, delete; all filtered by `$CURRENT_USER`)
- [x] **G3b: Shopping list page + Kitchen widget** — `shopping-list.vue` page with By Recipe / All Items tabs, toggle check, clear checked (individual DELETE loop); `ShoppingListWidget.vue` for kitchen page (unchecked count, tap → /shopping-list); kitchen header shows shopping cart icon (PhShoppingCart) instead of bell when user is cook for selected day
- [x] **G3c: Add to shopping list from recipe detail** — share icon in ingredients header opens bottom sheet modal with 3 actions: "Add to Shopping List" (POST each scaled ingredient to shopping_list_items), "Copy ingredients" (clipboard with formatted text + scaled amounts), "Share recipe" (navigator.share / clipboard fallback); success toast "Added N items to your shopping list"
- [x] **G3c polish: Widget design + share button visibility** — ShoppingListWidget now uses `bg-orange-pastel` when items pending, `bg-green-pastel` when all done; added `orange-pastel`/`orange-light` to tailwind config and design.md; share icon in recipe page enlarged to `w-9 h-9` with `bg-primary text-white`
- [x] **Fix: duplicate Start Cooking** — removed duplicate `isEntryCook` button from smart-adaptive section; only one Start Cooking exists inside status template with `startCooking` handler
- [x] **UX: participant count moved** — removed "N joined" from bottom controls; added `PhUsers` icon + count next to Portions pills row, shown when `queueEntry` exists
- [x] **Fix: all participants** — extended limit to 100, added `user.email` to fields, added `.filter(Boolean)` after map
- [x] **Fix: HeroBlock participant modal — mount in app.vue layout** — created global `useParticipantsModal.ts` composable (module-level refs); modal template moved to `app.vue` inside phone container (`relative`), so `absolute inset-0` covers the visible phone screen regardless of page scroll; `router.beforeEach` closes modal on navigation; pages (`index.vue`, `kitchen.vue`) call `pm.open(queueId)` on `@show-participants`; all local modal state/templates removed from pages
- [x] **Fix: Modal loader spinning forever** — root cause: `useParticipantsModal()` returns a plain object with `Ref` properties. Vue 3 templates do NOT auto-unwrap refs nested inside plain objects — `v-if="pm.loading"` always evaluated to the `Ref` object (truthy). Fix: wrapped `useParticipantsModal()` return value with `reactive()` in `layouts/app.vue` — `reactive()` triggers Vue's ref unwrapping in templates. `pm.loading` now correctly evaluates to the boolean value.
- [x] **Ingredient emoji icons + Add Ingredient quick-pick dropdown** — created `frontend/app/utils/ingredientIcons.ts` (emoji dictionary with 130+ entries + fuzzy `getIngredientIcon()` matcher) and `frontend/app/utils/popularIngredients.ts` (35 popular ingredients with default units); created shared `frontend/app/components/AddIngredientPopover.vue` (bottom-sheet with 2-column ingredient grid + "Custom ingredient" option); updated `recipe/create.vue` (popover opens from "+ Add" button, selects prefill name+unit, live emoji preview next to name input); updated `recipe/[id].vue` (replaced bullet dot with emoji icon in ingredient list). Shared component ready for AI Recipe page use.
- [x] **Task 5: Duty page top section** — "On duty today" card with live fetch from `cleaning_schedule`; department pill, user name, Confirm Duty button (PATCH /items/cleaning_schedule/{id}); confirmed badge in green-pastel; loading skeleton; empty state ("No duty assigned for today")
- [x] **Task 6: Monthly calendar on duty.vue** — inline month calendar (Mon–Fri) below today card; prev/next arrows; cell states (today/has entry/current user/confirmed/past); dot indicator; tap popover with user info + confirmed/pending badge; data fetch per displayed month
- [x] **Refactor: MonthCalendar component** — extracted from duty.vue into `app/components/MonthCalendar.vue`; reused in `recipe/[id].vue` date picker (replaces inline grid)
- [x] **UI tweaks:** taken dates in recipe calendar get `bg-gray-100` backdrop; DutyWidget shows "You are next" (larger, bold) when user is scheduled tomorrow
- [x] **Task 7: Admin edit mode for cleaning_schedule** — `isAdmin` check via role UUID; tap any calendar cell → popover (view/edit); department <select> (8 depts); user <select> filtered by department (fetched via `/api/users/list` with `department` field); PATCH existing / POST new entry via server proxy (`/api/duty/upsert`); re-fetch month after save
- [x] **Popover & Form fixes** — Fix 1: popover rendered inside phone frame (removed Teleport, `absolute` positioning in `relative` container). Fix 2: restructured `popularIngredients.ts` into 5 categorized `INGREDIENT_CATEGORIES`; popover now uses accordion (first category expanded, single-column list). Fix 3: `existingIngredients` prop greys out already-added items with ✓ badge. Fix 4: unit text input replaced with `<select>` (g/kg/ml/l/pcs/tbsp/tsp/bunch/to taste) with legacy value preservation. Fix 5: ingredient row widths fixed with `w-full overflow-hidden` and proper `flex-1 min-w-0`/`shrink-0` distribution.
- [x] **Fix: HeroBlock category image — root cause was missing category field on cook_queue** — added `category` string field to `cook_queue` collection (Directus); `cook.vue` `saveDish()` now persists `selectedCategory` to the queue entry; `kitchen.vue` `watch(selectedSlot)` fallback reads `category` from cook_queue item when no recipe match; Directus fields query updated to explicitly list `category`. HeroBlock now shows category image (e.g. pasta.png) when cook set name + category but no recipe yet.
- [x] **Fix: cook.vue requires both dish name AND category before enabling buttons** — added `canSchedule` computed (`dishName.trim().length > 0 && !!selectedCategory`); applied to all 4 schedule buttons in 'dish' state template; disabled styling changed to `opacity-40 cursor-not-allowed`.
- [x] **All Recipes page + Add to Queue flow** — new `/recipes` page (search + RecipeCard list with loading skeleton + empty state); "All Recipes →" link in kitchen.vue Dish History header; "🍳 Cook This" button on recipe detail with date picker bottom-sheet (14-day grid, taken dates disabled, navigates to `/cook?action=become&date=...&recipeId=...`); `cook.vue` reads `recipeId` query param and prefills dish name + category on entry into dish state.
- [x] **Fix: RecipeGridItem images on /recipes** — `RecipeGridItem.vue` prop `title` → `dish_name` to match Directus field; `useRecipeImage.ts` category lookup now lowercases key before matching (DB stores capitalized like "Salad" but map keys are lowercase like "salad").
- [x] **Fix: Like counts on Home + Kitchen** — `RecipeCard.vue` replaced `rating`+`PhStar` with optional `likeCount` prop + `PhHeart`; removed duplicate like badge from `recipe/[id].vue`; `index.vue` batch-fetches `recipe_likes` after loading recipes, passes per-recipe count to `RecipeCard`; `kitchen.vue` same batch-fetch for dish history items, renders `PhHeart` + count in each row.
- [x] **Fix: Category filter case-insensitive** — `recipes.vue` filter now lowercases both selected category and recipe category for comparison; search field also uses correct `dish_name` field.
- [x] **Fix: Reactive image in RecipeGridItem** — `const image = useRecipeImage(...)` → `:src="image.value.src"` (classic computed ref trap: destructuring `{ src }` loses reactivity). Added `likeCount` display + batch-fetch on `/recipes` page.
- [x] **Profile balance + transactions** — balance block (amount, Active pill, color-coded ±€X.XX) between Preferences and tabs; collapsible transaction history (5 rows default, Show all) with formatted date/description/amount
- [x] **SliderList component + profile refactor** — extracted reusable `SliderList.vue` (translateY slider with up/down arrows, slot-based items, touch/swipe support); refactored profile transactions, My List, and My Recipes to use SliderList with appropriate item heights and gaps
- [x] **Task 1: Schema + Department field + cleaning_schedule** — added `department` (string, nullable) to `directus_users` via Directus MCP; created `cleaning_schedule` collection (date, user→M2O, department, confirmed) with UUID PK; set User Policy permissions (read all, update own confirmed only); added `department` to User Policy `directus_users` read fields
- [x] **Task 2: Department selector in profile.vue** — added `<select>` dropdown below name/email, above Preferences, with German department options; PATCH on change via `/users/me`; pre-selects from `user.value.department`
- [x] **Task 3: Preferences bottom sheet** — Preferences card opens bottom sheet (fixed overlay + rounded-t-3xl), department selector moved inside, Done button, subtitle shows current department in primary color
- [x] **Fix: PATCH /users/me CORS** — created Nuxt server route `/api/users/update-me` for proxying the request
- [x] **Seed: 6 test users + cleaning_schedule** — created Klaus, Anna, Thomas, Sabine, Michael, Laura with departments; 9 cleaning_schedule entries for Jun 16–27 (weekdays)
- [x] **Fix: MCP user filter** — added `_nstarts_with=MCP` to both server routes (list + count); cause: first_name = "MCP User"
- [x] **Task 4: DutyWidget live data** — component fetches cleaning_schedule for the week; top line (department / "You're next!"), middle (duty name), bottom (status); gradient background; decorative SVG in top-left corner
- [x] **G3d: Shopping list polish** — added `cook_date` field to `shopping_list_items` (Directus); stored from queue entry when adding items; displayed next to recipe name in By Recipe view (e.g. "Wed, Jun 17"); tabs restyled with `bg-primary-pale`/`bg-primary text-white` and icons; weekly shopping comment added
- [x] **G3d: Permission gate + recipe page UX** — "Add to Shopping List" button only shown when `isEntryCook`; photo header heart replaced with shopping cart when cook (links to `/shopping-list`); added-to-list toast includes a "View cart" shortcut button
- [x] **G3d: Copy format fix** — changed clipboard format from `• 🐟 180 g Salmon fillet` to `• 🐟 Salmon fillet 180 g` (emoji → name → amount, matching page layout)
- [x] **Fix: Fork-on-cook — always link recipe to queue entry** — added `recipe` field (M2O) to `cook_queue` Directus collection; `saveDish()` now PATCHes `recipe` after creating a fork; HeroBlock in kitchen uses linked recipe ID first; `recipe/[id].vue` queue entry search filters by current user's cook ID to avoid matching wrong queue
- [x] **Fix: Auto-cleanup shopping list** — when `confirmDeduction()` runs, deletes `shopping_list_items` for the linked recipe (by recipe ID, fallback to dish_name + cook_date)
- [x] **Shopping list UX: colorful cart, per-group select-all, red delete** — empty state cart icon in red circle; each recipe group in By Recipe view has its own select-all checkbox in the header row (checkbox → name → date right-aligned); All Items view has global select-all + "Delete all checked" button; `PhTrash` changed to `text-red-500`
- [x] **Fix: Cancel queue → auto-cleanup shopping list** — `cancelCooking()` deletes `shopping_list_items` for the linked recipe (same logic as `confirmDeduction`)

## Refactoring session — Phase 1–2
- [x] **Phase 1: Replace manual sliders with SliderList.vue** — history slider in `cook.vue`, both sliders (balances + transactions) in `finance.vue`, cook recipes slider in `recipe/[id].vue`. Removed scroll/touch/arrow code (~140 lines total).
- [x] **Phase 1: Extract useParticipants.participantsList** — extended `useParticipants.ts`; migrated `cook.vue` + `recipe/[id].vue` off local `fetchParticipants()`/`participants` ref.
- [x] **Phase 1: Create utils/dates.ts** — 7 shared date functions; 8+ files can import instead of redefining.
- [x] **Phase 2, candidate 1: Create useDeduction.ts** — extracted `confirmDeduction`, `loadPastaCost`, `cleanupShoppingList` from `cook.vue` (~90 lines); parallelized transactions (`Promise.all`) + batch-fetch balances (`_in` filter); `cleanupShoppingList` shared with `cancelCooking`.
- [x] **Fix: pasta-price PATCH 500** — `app_settings` is a singleton; PATCH `/items/app_settings/{id}` rejected by Directus ("Route doesn't exist"). Removed ID lookup, PATCH `/items/app_settings` directly.
- [x] **Fix: cook→recipe navigation missing ?cq=** — recipe page could not find queue entry by dish_name; added `?cq=${cookEntry.id}` to all recipe links.
- [x] **Phase 2, candidate 2: useRecipeServings.ts** — extract all serving/scaling logic (~85 lines) from `recipe/[id].vue` into composable.
- [x] **Fix: canAddToList restriction** — "Add to Shopping List" button only shown when `isEntryCook` (queue cook).
- [x] **Phase 2, candidate 3: Template dedup** — extracted shared receipt info rows into `ReceiptSummary.vue`, used in ready state breakdown.
- [x] **Phase 2, candidate 4: Finance template dedup** — extracted BalanceRow + TransactionRow components, replaced slider/expanded templates in finance.vue.
- [ ] **Phase 2, candidate 5: useDateNavigation.ts** — extract date-nav from `recipe/[id].vue`, `finance.vue`, `cook.vue`.
- [ ] **Task B': Reminder mechanism for overdue cost entry (groundwork)
- [ ] **Task D: Ghost participants / leave-join logic
- [ ] **AI Recipe** — chat with AI, JSON recipe render, serving recalculation
- [ ] **Common screen** — group purchases, announcements, polls
- [ ] **Notifications** — feed, quick actions
- [ ] **Receipt photo upload**

## Deploy session — 2026-06-24
- [x] **Server cleanup** — stopped/removed OpenWebUI, `docker system prune -af`, old nginx configs removed
- [x] **DuckDNS** — `itocook.duckdns.org` created; `/opt/duckdns/duck.sh` with token; cron `*/5 * * * *`
- [x] **Server dir setup** — `/opt/itocook/` with `.env` (4 `openssl rand` passwords + VAPID keys)
- [x] **Git clone** — repo cloned to `/opt/itocook/app`
- [x] **Deploy files** — `Dockerfile.prod`, `docker-compose.prod.yml`, `.github/workflows/deploy.yml`
- [x] **PWA setup** — `@vite-pwa/nuxt` installed, manifest + icons + sw.js with push handling
- [x] **Fix: public/ → app/public/** — moved `public/` inside `app/` for Nuxt 4 compat; PWA module now finds sw.js
- [x] **Fix: :src binding for images** — changed `src="/images/..."` → `:src="'/images/...'"` to avoid Vite module resolution errors in all layouts (+ onboarding.vue, auth.vue)
- [x] **Fix: generateSW strategy** — switched from `injectManifest` to `generateSW` due to `swSrc`/`swDest` same-file conflict in Nuxt 4's `app/public/` dir
- [x] **Docker ports** — added `127.0.0.1:PORT:PORT` mappings for frontend, directus, api in docker-compose.prod.yml
- [x] **Nginx proxy** — created `docs/nginx-itocook.conf`, deployed to `/etc/nginx/sites-available/itocook`, enabled with certbot HTTPS
- [x] **HTTPS** — `certbot --nginx` for `itocook.duckdns.org` (expires 2026-09-21)
- [x] **All 3 services verified** — Frontend (200), Directus admin (200), API (200) on https://itocook.duckdns.org
- [ ] **SSH deploy key** — still needs to be added to GitHub Secrets for auto-deploy
- [ ] **Push notifications** — not tested yet (need real device with add-to-home-screen)

## Current session — JSDoc pass
- [x] **Composables JSDoc** — `useLikes`, `useRecipeServings`, `useParticipantsModal`, `useRecipeImage`, `useTotalUsers`
- [x] **Utils JSDoc** — `dates.ts`, `format.ts`, `popularIngredients.ts`
- [x] **Components JSDoc** — `ActionBlockedModal`, `WeekCalendar`, `DutyWidget`, `TransactionRow`, `BalanceRow`, `ReceiptSummary`, `ShoppingListWidget`, `AvatarPlaceholder`, `MonthCalendar`, `BalanceWidget`, `SliderList`, `RecipeGridItem`, `RecipeCard`, `AddIngredientPopover`, `RecipeImageUpload`, `BottomTabBar`
- [x] **Pages JSDoc** — `index`, `kitchen`, `shopping-list`, `recipe/create`, `duty`, `finance`, `profile`, `recipes`, `onboarding`, `auth`, `common`, `ai-recipe`
- [x] **Server routes JSDoc** — all 9 API routes (deduction confirm, settings pasta-price, users list/count, duty upsert/confirm, update-me)
- [x] **Server utils JSDoc** — `auth.ts` (requireAuth)
- [x] **Middleware JSDoc** — `auth.global.ts`
- [x] **Layouts JSDoc** — `app.vue`, `default.vue`
- [x] **Skipped** `pages/recipe/[id].vue` (986 lines > 500 — needs explicit confirmation)
- [x] **TS check** — no new TS errors introduced
- [x] **recipe/[id].vue** — file-level + function-level JSDoc on all handlers

## Current session — VitePress docs site
- [x] **VitePress setup** — `docs-site/` created with vitepress, config, landing page
- [x] **Overview section** — what-is-itocook, tech-stack, status pages
- [x] **Architecture section** — system-overview, schema (with Mermaid ERD), data-flows
- [x] **Features section** — 6 pages copied from `docs/architecture/` (cook-queue, recipe-system, finance, duty, shopping-list, auth-flow)
- [x] **Screens section** — 6 pages with descriptions and screenshot placeholders
- [x] **Design System section** — colors, typography, components specs
- [x] **Roadmap page** — all 8 phases copied from `docs/roadmap.md`
- [x] **Build verification** — `npm run docs:build` passes cleanly

## Current session — onboarding redesign
- [x] **UX: Onboarding redesign** — chef mirrored, logo PNG, copy: Cook. Split. Done.
- [x] **UX: Onboarding splash** — always shown on app open, auto-redirect after 2.5s based on auth state
- [x] **UX: Onboarding as entry point** — /onboarding is now the default redirect for unauthenticated users, auto-proceeds after 2.5s

## Fixes — current session
- [x] **UX: Onboarding visual improvements** — added radial dot pattern overlay (CSS radial-gradient, white@8%, 24px grid); removed feature pills; changed background from flat `bg-primary` to vertical gradient `#8966FA → #5B3FD4` via inline style with layered `background-image`

## Current session — mobile layout fix
- [x] **Mobile layout: iPhone frame hidden on real devices** — added `@media (max-width: 480px)` CSS block in `main.css`; added semantic classes (`iphone-frame`, `iphone-screen`, `dynamic-island`, `status-bar`, `bottom-tab-bar`, `app-content`) to layouts and components; frame, border, shadow, Dynamic Island, status bar fully hidden on mobile; BottomTabBar switches to `fixed` with safe-area padding; content uses `padding-top: 16px` via `.app-content`.
- [x] **Fix: black border on mobile** — added `border: none !important` to `.iphone-screen`
- [x] **Fix: BottomTabBar floating style preserved** — tab bar keeps `left-4 right-4` and `rounded-3xl` on mobile, only position becomes `fixed`
- [x] **Fix: desktop padding-top restored** — returned inline `style="padding-top: calc(48px + ...)"` in `app.vue`

## Phase 6 — In-App Notifications
- [x] **Step 0: Create `notifications` collection in Directus** — collection with fields: id (uuid PK), user (M2O→directus_users), type (dropdown: 7 types), message (text), read (boolean, default false), date_created (auto). Permissions for User policy: read (own only, filter `user = $CURRENT_USER`), update (only `read` field, same filter), create/delete DENY.
- [x] **Step 1: 4 Directus Flows + 1 Utility Flow** — Cook Assigned (event→cook_queue.items.create), Lunch Ready (event→cook_queue.items.update→ready), Balance Low (event→balances.items.update→amount<-10), Morning Reminder (schedule 8:00 Mon-Fri). Utility Flow `[Util] Create Notification` (operation trigger, item-create). All flows tested except schedule.
- [x] **Step 2: useNotifications composable + NotificationBell component** — `useNotifications.ts` (fetch, markAsRead, markAllAsRead, unreadCount, poll 60s), `NotificationBell.vue` (PhBell/PhBellRinging, badge with unread count, @click → /notifications). Bell installed on all 4 pages (index, kitchen, finance, duty).
- [x] **Step 3: Notifications page** — `app/pages/notifications.vue` with list of cards (icon per type, timeAgo, read/unread styling), skeleton loading, empty state (PhBellSlash), tap-to-markAsRead, auto markAllAsRead after 3s on mount.
- [x] **FIX 1:** CORS fix — created `server/api/notifications/read.patch.ts` (admin-proxy batch PATCH), updated `useNotifications.ts` to use `$fetch('/api/notifications/read')` instead of calling Directus CORS endpoint directly.
- [x] **FIX 2:** Icon mapping fix — replaced `PhTriangle` → `PhWarning` for `balance_low` type in notifications.vue (correct icon component now renders).
- [x] **FIX 3:** Server route `read.patch.ts` — fixed batch PATCH body format: `{ keys: [...ids], data: { read: true } }` (was wrong `filter` format → 500). Added `console.error` logging.
- [x] **FIX 4:** Removed tap-to-read from individual cards in `notifications.vue` — `handleTap` removed, `@click` removed, `cursor-pointer`/`active:scale` removed. Only "Mark all read" button remains functional.
- [x] **FIX 5:** Removed auto markAllAsRead (`setTimeout` 3s) from notifications.vue — user controls read state manually.
- [x] **FIX 6:** Read cards opacity-70 → opacity-60. Polling interval 60000 → 20000 in useNotifications.ts.

## Fixes — current session (2026-06-27)
- [x] **Fix: add `<link rel=manifest>` to app.head in nuxt.config.ts so PWA manifest is discoverable by browser**
- [x] **Fix: add user field when saving push subscription to Directus** — `usePushNotifications.ts` now passes `user: user.value?.id` in POST to `push_subscriptions`
- [x] **Fix: add Read permission for push_subscriptions in Directus User policy** — required for `GET /items/push_subscriptions` to check existing endpoint before re-subscribing
- [x] **Fix: closing div tag in notifications.vue** — added missing `</div>` for `.px-5.pb-[100px]` wrapper
- [x] **Fix: deploy.yml — use --build flag in up command** — replaced `build` + `up -d` with `up -d --build`
- [x] **Feat: push notifications working on iPhone ✅** — tested and confirmed working on iPhone after PWA install
- [x] **Feat: Flow "Cook Cancelled"** — notifies all users when cook cancels; `cook_cancelled` type added to `notifications` collection; created on local + production
- [x] **Feat: Flow "Nightly Notification Cleanup"** — deletes notifications older than 7 days at 3am via schedule trigger; 4 ops chain (calc_cutoff → fetch_old → extract_ids → delete_old); created on local + production
- [x] **Chore: remove push debug panel** — debug panel removed from notifications.vue; `subscribe()` reverted to clean signature without `onLog`; console.log/console.error restored

## Fixes — current session (Cook Assigned flow)
- [x] **Fix: Condition filter syntax** — dot notation `$trigger.payload.status` → nested objects `$trigger > payload > status`
- [x] **Fix: Transform duplicate removed** — transform `build_payloads` (8e42b084) was on the same grid cell as exec — removed
- [x] **Fix: Exec code fetch_users.data** — `item-read` returns array directly, not `{data: [...]}` — fixed with `Array.isArray` guard
- [x] **Fix: Child flow templates** — `{{$trigger.body.*}}` → `{{$trigger.*}}` (operation-triggered flow places data on root `$trigger`)
- [x] **Fix: Trigger items.create → items.update** — notifications now fire only on `dish_name` update (dish selection), not on empty record creation
- [x] **Fix: Condition dish_name._nnull** — removed `status` check (on `items.update` only changed fields are in payload); added `$trigger.payload.dish_name._nnull` check
- [x] **Fix: Cook name "Someone"** — exec code now finds cook UUID in `fetch_users` array via `users.find(u => u.id === cookId)`
- [x] **Fix: Message format with date** — added `fetch_entry` operation (`item-read` on `$trigger.keys[0]`) to get full record; exec uses `fetch_entry.date` for "Jun 22" formatting
- [x] **Fix: Admin permissions on notifications** — created `read`+`update` permissions for Admin policy (`50751c00`) with filter `user._eq = $CURRENT_USER`; also added `filter[user][_eq]=$CURRENT_USER` in `useNotifications.ts` for frontend (admin_access bypass)
- [x] **Tested:** update cook_queue with dish_name → 44 cook_assigned notifications created, data cleared
- [x] **Fix (Lunch Ready flow):** Fetch Confirmed Orders filter `$trigger.key` → `$trigger.keys[0]`
- [x] **Fix (Lunch Ready flow):** exec code `fetch_orders.data` → `Array.isArray` guard (same bug as Cook Assigned)
- [x] **Tested:** update cook_queue status → ready → `lunch_ready` notification created for user with confirmed order
- [x] **Fix (Balance Low flow):** exec code — DUMMY_USER → `fetch_balance.user` with Array.isArray guard
- [x] **Fix (Balance Low flow):** reconnected chain — `check_amount` → `fetch_balance` → `exec_notify` → `do_create`
- [x] **Fix (Balance Low flow):** entry point changed from `exec_notify` → `check_amount`
- [x] **Fix (Balance Low flow):** `$trigger.key` → `$trigger.keys[0]` in fetch_balance (same as Lunch Ready)
- [x] **Fix (Balance Low flow):** operation positions fixed (fetch_balance/exec_notify overlap at 37,1)
- [x] **Tested:** update balance 0 → -15 → `balance_low` notification for `a56ff53c`
- [x] **Fix (Morning Reminder):** Condition `No cook today?` removed, replaced with Run Script with `Array.isArray` guard + `throw Error` if cook exists
- [x] **Fix (Morning Reminder):** exec `build_payloads` — `fetch_users.data` → `Array.isArray` guard
- [x] **Fix (Morning Reminder):** old Condition operation deleted via REST API
- [x] **Tested:** flow triggered manually → 11 `morning_reminder` notifications for 11 active users, data cleared
- [x] **Fix (avatars):** Public policy on `directus_files` — added `read` (all fields `*`, no filter). Avatars now accessible without session (incognito, other browsers)
- [x] **Step 4: Duty Reminder Flow** — created and tested. CRON `0 8 * * 1-5`. Chain with two branches:
  - **Manual** (keys from UI): `check_mode`(exec, `body.keys`) → `route`(condition) → `fetch_entry`(item-read, key=`check_mode.key`) → `build_manual`(exec) → `notify_users`(trigger → Utility)
  - **Schedule** (no keys): → `get_today` → `fetch_all`(item-read date=check_mode.today, confirmed=false) → `build_schedule`(exec, Array.isArray guard) → `notify_schedule`(trigger → Utility)
- **Bug found & fixed:** `$trigger.keys` does not exist — keys are in `$trigger.body.keys`. All notifications were going to Klaus because exec could not find keys and went through the schedule branch (today only Klaus is unconfirmed).
- [x] **Step 4b: Duty Assigned event flow** — `items.create` on `cleaning_schedule` → exec (`$trigger.payload.user` + `date`) → trigger (Utility flow). Created and tested. Record creation → notification to assigned user "You have been assigned to kitchen duty on YYYY-MM-DD. Please confirm!"

## Web Push Notifications — implementation
- [x] **STEP 1: .env + docker-compose** — VAPID vars were already added (previous session). NUXT_PUBLIC_VAPID_PUBLIC_KEY was also already in .env.
- [x] **STEP 2: push_subscriptions collection** — collection already existed in Directus. Added permissions: User policy (create + read own + delete own), Admin policy (full access).
- [x] **STEP 3: FastAPI /send-push endpoint** — `api/requirements.txt` updated (pywebpush, requests). `api/app/main.py` — new endpoint `POST /send-push`. Logic: login to Directus as admin, fetch subscriptions by user_id, send Web Push via pywebpush. Returns `{ sent, failed }`.
- [x] **STEP 4: Service Worker** — created `frontend/public/sw.js` (push event + notificationclick). Created placeholder icon `frontend/public/images/icon-192.png`.
- [x] **STEP 5: Nuxt composable + server route** — created `usePushNotifications.ts` (register SW, subscribe, urlBase64ToUint8Array). Created `server/api/push/vapid-key.get.ts`. `nuxt.config.ts` — added `vapidPublicKey` to runtimeConfig.public.
- [x] **STEP 6: subscribe() after login** — `useAuth.ts` login() calls `usePushNotifications().subscribe()` after fetchUser (non-blocking, catch silent).
- [x] **STEP 7: Directus Flows — webhook step** — added exec + request operations to all 6 flows to call `/send-push`:
  - **Cook Assigned** — extract user IDs from fetch_users, calls API with user_ids + message
  - **Lunch Ready** — extract user IDs from fetch_orders, calls API with user_ids
  - **Balance Low** — calls API with `{{exec_notify.user}}`
  - **Morning Reminder** — extract user IDs from fetch_users, calls API
  - **Duty Reminder** — two branches: manual (single user) + schedule (user_ids from fetch_all)
  - **Duty Assigned** — calls API with `{{$trigger.payload.user}}`
- [x] **Docker** — api container recreated (new env vars), pywebpush and requests installed.
- [x] **Fix: push_subscriptions empty after login** — root cause 1: `create` permission (ID 78) for User policy had `presets: null`. Directus rejects POST because `user` field is `required: true`, but frontend's `subscribe()` doesn't send `user`. Fixed: `presets: { user: "$CURRENT_USER" }`.
- [x] **Fix: push_subscriptions not created on page reload** — root cause 2: `subscribePush()` was only called inside `login()`. On page reload with active session, no subscription was created. Fixed: added `subscribePush().catch(() => {})` to `middleware/auth.global.ts` after `fetchUser()`.
- [x] **Fix: push_subscriptions not created when subscription already exists** — root cause 3: `pushManager.subscribe()` throws `DOMException` if subscription already exists. Fixed: added `getSubscription()` check — reuse existing, create new if none.
- [x] **Fix: Cook Assigned flow restored** — Directus condition `$trigger.payload.dish_name._nnull` throws `Validation failed — Value is required` when field is absent from payload. Solution: condition always passes (`$trigger.event._nnull`), check moved to `build_payloads` exec — `if (!$trigger.payload.dish_name) return []`. Empty array causes trigger flow to create nothing. Chain: `check_status (always pass) → fetch_users → fetch_entry → build_payloads (dish_name check) → notify_users → push_ids → send_push`.
- [x] **Fix: Firefox duplicate pushes** — root cause: `subscribe()` POSTed to Directus on every reload, creating subscription copies. `/send-push` sent to all copies → user got N notifications. Fix: `subscribe()` now GETs by endpoint → skip if exists (no PATCH due to CORS).
- [x] **Fix: push_ids sends on every cook_queue update** — `push_ids` exec was sending `user_ids: [...all...]` even when `build_payloads` was empty. Fix: `if (payloads.length === 0) return { user_ids: [], url: '/' }` — nothing sent on non-dish_name updates.
- [x] **Feat: notification click → /kitchen?date=...** — click on Cook Assigned push navigates to `/kitchen?date=YYYY-MM-DD` instead of `/`. SW focuses existing tab (focus + navigate), opens new one if none exists. FastAPI `PushRequest` + `send_push()` accept `url: str = '/'`.
- [x] **Chore: CORS origin 127.0.0.1** — added `http://127.0.0.1:3000` to `CORS_ORIGIN` for Chrome Dev. Did not solve FCM issue — Chrome cannot register push subscription on localhost. Firefox works stably.
- [x] **iPhone push** — tested and working on iPhone after PWA install
- [x] **Feat: Cook Cancelled Flow** — notifies all users when cook cancels via Directus Flow; adds `cook_cancelled` type to notifications collection
- [x] **Feat: Nightly Notification Cleanup Flow** — deletes notifications older than 7 days at 3am (calc_cutoff → fetch_old → extract_ids → delete_old); created on local + production
- [x] **Docs: updated CONTEXT.md with PWA/push terms**
- [x] **Docs: created docs/architecture/notifications.md — full notification system doc**
- [x] **Docs: updated docs/architecture/cook-queue.md — Cook Cancelled notification flow section**
- [x] **Docs: updated docs/ARCHITECTURE.md — Phase 6b PWA+Push section**
- [x] **Docs: updated docs/server-pwa-deploy.md — push status, known issues, checklist**

## Current session — docs cleanup (2026-06-28)
- [x] **docs/design.md updated** — Screen Inventory replaced with actual screens (Kitchen, Cook, Finance, Notifications, Recipe Create/Edit); Bottom Tab Bar updated to match real tabs (Home/Kitchen/AI-Finance/Duty/Common); File Structure rewritten for Nuxt 4 `app/` directory; Safe area values synced with app.vue
- [x] **docs/roadmap.md updated** — Phase 6c added (refactoring, JSDoc, security audit, harness); Phase 4 marked ✅; missing completed items added to Phase 6 (Cook Cancelled Flow, Nightly Cleanup, push integration)
- [x] **Retrospective .planning/ created** — 6 retrospective PLAN.md files for completed phases (01-ui-skeleton, 02-first-live-flow, 03-directus-schema, 04-feature-screens, 06-notifications-pwa, 06c-refactoring-docs). Each documents goal, completed tasks, key decisions, file changes, and completion date. No invented content — only data from progress.md + roadmap + git log.

## Current session — test collection (2026-06-29)
- [x] **Created `test_items` collection in Directus** — fields: `id` (UUID PK), `name` (string, required), `description` (text), `category` (dropdown: appetizer/main/dessert)
- [x] **Added 6 test items** — 2 per category: Bruschetta + Garlic Bread (appetizer), Pasta Carbonara + Chicken Parmigiana (main), Tiramisu + Panna Cotta (dessert)
- [x] **Updated `common.vue` page** — fetches from `/items/test_items` via `useDirectus()`, groups by category with icons (PhForkKnife/PhBowlFood/PhCake), loading skeleton + error + empty states, scrollbar-hide

## Current session — Company account + guests feature (2026-06-29)
- [x] **Directus: company_account collection** — singleton with `balance` (decimal, default 0) and `updated_at` (timestamp). Seeded with balance 0.
- [x] **Directus: company_transactions collection** — UUID PK, `amount` (decimal), `description` (string), `date_created` (auto timestamp), `cook_queue` (M2O→cook_queue, nullable). Permissions: User policy read-only, Admin policy full access (via admin_access).
- [x] **Directus: guests field on orders** — JSON field (nullable) for storing guest names paid by company account.
- [x] **Feat: Guest UI in cook.vue ready state** — "Add Guest" button appends to local guests ref, each guest row has name input + "Company pays" label + remove button. Company balance displayed as `PhBuildings Company: €X.XX`. Guests included in totalParticipants for share calculation. Deduction preview shows guest lines with "(Company)" tag.
- [x] **Feat: server/api/deduction/confirm.post.ts updated** — accepts `guests` array from request body, calculates `totalParticipants = participants.length + guests.length`, recalculates share server-side from `totalAmount / totalParticipants`. For each guest: creates `company_transactions` record (amount = -share, description = "Guest: {name}", cook_queue_id). Updates company_account balance by subtracting `share * guests.length`. No orders created for guests. Empty guests array → behavior identical to previous flow.
- [x] **Feat: useDeduction.ts updated** — added `guests` to DeductionParams interface, passes filtered guest names array to server route.
- [x] **Feat: Finance page Company Account section** — balance card (color-coded like BalanceWidget: green for >=5, mild red for >=0, strong red for <0). Manual top-up form (amount + description → INSERT company_transactions + PATCH company_account). Transaction history (last 20, sorted by date_created desc, green/red amounts with +/- prefix). All between Balances Overview and Manual Top-up sections.

## Fixes — browser errors (2026-06-30)
- [x] **Fix: Chrome push AbortError noise** — changed `console.error` to `console.debug` in `usePushNotifications.ts:75` so the known Chrome FCM AbortError doesn't pollute browser console
- [x] **Fix: Manifest syntax error** — created `app/public/manifest.webmanifest` with valid JSON manifest (name, icons, theme_color, display) so the browser doesn't get a 404/HTML parse error on `/manifest.webmanifest` in dev mode; PWA module only generates it in production

## Current session — Directus flows reminder — UTC fix + restart diagnosis (2026-06-30)
- [x] **PART A: Morning Reminder flow modified** — CRON `30 8 * * 1-5` → `0 */30 7-8 * * 1-5` (UTC, =9-10 CEST). Added `check_time` exec + `time_ok` Condition at start to skip 8:30 UTC (10:30 CEST). Replaced throw-based `check_no_cook` exec with Condition-based approach: exec returns `{ exists: queue.length > 0 }`, new `has_no_cook` Condition branches gracefully.
- [x] **PART B: New "Cook Stale Reminder" flow created** (ID `9611f64f`) — Schedule CRON `0 */30 7-8 * * 1-5`. Chain: `check_time` → `time_ok` → `get_today` → `fetch_queue` (cook_queue date=today, status=scheduled, fields: id,cook) → `check_stale` (exec) → `has_stale` (Condition) → `build_payloads` (type: `cook_reminder`) → `notify_users` (trigger → [Util] Create Notification, iterationMode=parallel). Only reminds the cook personally.
- [x] **Timezone discovery** — `docker compose exec directus date` returns UTC. CRON `0 */30 9-10 * * 1-5` was firing at 11:00-12:30 CEST (wrong). Fixed to `0 */30 7-8 * * 1-5` for 9:00-10:30 CEST window. `check_time` exec adjusted: blocks `h===8 && m>=30` (8:30 UTC = 10:30 CEST).
- [x] **Schedule trigger restart diagnosis** — Directus v11 uses node-cron; schedule jobs registered at process start. UI cron changes require container restart. Confirmed via E2E test: set test cron `0 7 13 * * 1-5`, restarted container, verified flow fired at 13:07 UTC via `/activity` endpoint: `run directus_flows 9611f64f` + `run directus_flows 718c090b` (Util flow) + `create notifications` (E2E pass ✅).
- [x] **docker-compose.yml indentation fix** — frontend service was at indent 0 (broken yaml); fixed to indent 2 under services. Allows `docker compose restart directus` without yaml parse errors.

## Git log
- `4aa3bc2` — docs: add retroactive specs, update harness, rewrite AGENTS.md
- `fceb844` — chore: remove outdated docs/deployment.md (superseded by docs-site/overview/deployment.md)
- `4ae6e14` — docs(docs-site): add notifications + deployment pages, update roadmap, status, schema, data-flows, system-overview, tech-stack, nav, index
- `10a916b` — chore: remove old superseded server-pwa-deploy draft
- `56ef63c` — chore: move server-pwa-deploy.md from docs/ to notes/ (keep latest version in notes)
- `d486da2` — docs: update architecture docs, glossary, roadmap, progress after Phase 6b
- `6f4b546` — feat(flows): add Cook Stale Reminder, push notifications, TZ=Europe/Berlin fix
- `eaab3b5` — feat(hero-block): add completed status badge and display
- `a260c88` — fix(auth): block Join for ready/cancelled, add status badge to HeroBlock
- `b0744ff` — docs(roadmap): add Phase 7a Testing, fix Phase 6/6b remaining statuses
- `b3aae1d` — feat(recipe): add base servings field and dynamic portion presets
- `95ec2d0` — fix(roadmap): mark receipt photo upload and shopping list from recipe as done
- `e573808` — docs: fix design.md, roadmap.md, add retrospective planning files
- `34f5aba` — docs(harness): update overview, diagram, cheatsheet with security audit and test plan
- `db5aa18` — fix(ui): swipe-to-dismiss bottom sheets, full-month date picker, block future cook actions
- `3f4de82` — fix(nginx): fix JS MIME type for Directus admin assets
- `a1264f7` — fix(duty): allow clicking days in next/prev month in calendar
- `e0a44b5` — feat(push): dedup subscriptions, click → /kitchen?date=, fix non-dish_name push
- `570c5eb` — feat(notifications): add individual read checkbox, rename Dismiss all
- `bd0b8d0` — fix(notifications): fix all 4 Directus notification flows + frontend filter
- `0e52a36` — feat(notifications): Phase 6 Steps 2-3 — NotificationBell, /notifications page, CORS proxy, server route fixes
- `13d75fa` — feat(ui): onboarding gradient bg + dot pattern, finance header, bottom bar color
- `558b193` — fix(layout): iphone screen bg-app-bg, status bar bg-app-bg, remove pb-[100px] from content
- `8f59ada` — chore(docs): move audit files to docs/audits/
- `7e602c6` — feat(mobile): responsive layout — hide iPhone frame on real devices, BottomTabBar fixed positioning, add safe-area padding
- `0cf36c6` — docs: create project-state.md in docs/ with updated file structure, flows, composables, security measures
- `939a2d1` — chore: snapshot current state before JSDoc pass
- `b05f707` — docs: add JSDoc annotations across all frontend files
- `2e7803e` — docs(docs-site): add VitePress documentation site with screenshots
- `17479c3` — docs: update roadmap checkboxes — mark completed items (duty, profile balance, recipe steps, shopping share)
- `5d3cc65` — feat(onboarding): splash screen as entry point with 2.5s auto-redirect
- `89218c2` — feat(deploy): add deployment config, PWA setup, and docs
- `e01656a` — fix: cq param in HeroBlock, recipe_name on order create, sort cook_queue, cleanup onboarding comments
- `92e2fa2` — fix(pwa): add manifest link tag to app head
- `80920e0` — debug(pwa): add visible push debug panel on notifications page
- `17985d7` — fix(pwa): pass user id when saving push subscription
- `17bed0f` — chore(pwa): remove push debug panel
- `1629b8f` — fix(notifications): add missing closing div tag
- `7507871` — fix(deploy): use --build flag in up command to always rebuild on deploy
- `6461fd2` — feat(pwa): add Cook Cancelled flow + ICON_MAP entry + mark iPhone push done
- `4c3c5ec` — docs: update CONTEXT, architecture/notifications, JSDoc for push/PWA, server-pwa-deploy
- `00e21eb` — chore(docs): move skills-cheatsheet to docs/, add autonomous skill selection rules to AGENTS.md

