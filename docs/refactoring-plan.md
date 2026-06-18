# ItoCook — Architecture Review & Refactoring Plan

> Analysis date: 2026-06-17
> Scope: cook.vue (1202), recipe/[id].vue (1153), recipe/create.vue (395), kitchen.vue (475), finance.vue (630)
> Total: ~3855 lines across 5 page modules

---

## Zoom-Out: System Map

These 5 page modules sit at the outermost layer of the ItoCook application. Inwards are shared composables (`useDirectus`, `useAuth`, `useParticipants`, `useMealCost`, `useBalanceCheck`, etc.) and utilities (`dedupRecipes`, `ingredientIcons`). Deepest is the Directus API.

```
                          ┌──────────────────────────────────────────────┐
                          │              Page Modules                     │
  ┌───────────────────────┼──────────────────────────────────────────────┤
  │                       │                                              │
  │  cook.vue    recipe/[id].vue    recipe/create.vue                    │
  │  kitchen.vue          finance.vue                                    │
  │                                                                      │
  ├───────────────────────┼──────────────────────────────────────────────┤
  │           Shared Composable Layer (8 existing)                       │
  │  useDirectus  useAuth  useParticipants  useMealCost                  │
  │  useBalanceCheck  useTotalUsers  useRecipeImage  useParticipantsModal│
  ├───────────────────────┼──────────────────────────────────────────────┤
  │           Utility Layer (3 existing)                                 │
  │  dedupRecipes  ingredientIcons  popularIngredients                   │
  ├───────────────────────┼──────────────────────────────────────────────┤
  │                    Directus API (REST)                                │
  └──────────────────────────────────────────────────────────────────────┘
```

**Friction points identified:**
- Page modules are **shallow** — their inline business logic is nearly as complex as the interface they expose to the template
- 4 cross-cutting patterns are duplicated instead of shared (slider logic, shopping list cleanup, participant fetch, date helpers)
- `cook.vue` and `recipe/[id].vue` mix 3+ distinct responsibilities each: data fetching, business logic orchestration, and UI state management, all at the same seam

---

## Cross-Cutting Patterns (Shallow Modules)

### Pattern A: Vertical Slider — 4 independent implementations

| Occurrence | File | Lines | Parameters |
|---|---|---|---|
| Past dish history | `cook.vue` | 82–138 + state vars | H=60, visible=3 |
| Transaction history | `finance.vue` | 201–229 + template | H=72, visible=5 |
| Balance list | `finance.vue` | 234–264 + template | H=56, visible=5 |
| Cook recipes modal | `recipe/[id].vue` | 357–402 | H=72, visible=3 |

**Deletion test:** Delete one copy → 3 remain (no saving). Delete all 4 and replace with one composable → complexity concentrates into `useSlider.ts`. **Signal: strong.**

**Proposal:** `composables/useSlider.ts`

```ts
interface UseSliderOptions { visibleCount: number; itemHeight: number; gap?: number }
// returns { index, offset, canScrollUp, canScrollDown, scrollUp, scrollDown, onTouchStart, onTouchEnd, sliderHeight }
```

---

### Pattern B: Shopping List Cleanup — duplicated in 2 functions

`cook.vue` `cancelCooking()` lines 1012–1024 and `confirmDeduction()` lines 1106–1121 share identical logic: GET shopping_list_items by recipe ID or dish_name+date → DELETE each. **~14 lines duplicated.**

**Deletion test:** Extract → both callers simplify. Signal: moderate.

**Proposal:** Add `cleanupShoppingList(recipeId, dishName, cookDate, userId)` to composable. Can live in `useDeduction.ts` or standalone.

---

### Pattern C: Participants Fetch — duplicated in 2 pages

`cook.vue` `fetchParticipants()` (lines 798–811) and `recipe/[id].vue` `fetchParticipants()` (lines 918–930) make the same query and mapping.

**Note:** `useParticipants.ts` already exists but only returns a count, not the full participant list. Extending it to optionally return full names would deepen the existing module rather than creating a new one.

---

### Pattern D: Date Helpers — 5+ redefinitions

`formatDateISO()`, `formatDateStr()`, `MONTH_NAMES`, `DAY_NAMES` are redefined verbatim in `cook.vue`, `kitchen.vue`, `recipe/[id].vue`, `finance.vue`, and likely `index.vue`. Pure functions, no dependencies.

**Proposal:** `utils/dates.ts`

---

## Per-Module Analysis

### 1. `cook.vue` — 1202 lines (shallowest module)

**Zoom-out:** This is the cook panel — a state machine with 6 states (assign → dish → scheduled → cooking → ready → done). It manages the entire lifecycle of a cooking session: who cooks, what dish, participant tracking, status transitions, receipt entry, financial deduction, and cancellation.

**What makes it shallow:** 7 distinct responsibilities are all inlined at the same seam (the page script). Each function calls Directus directly. Error handling is `console.error` + silent catch everywhere. The interface (props + emits) is empty — all data flows through inline `request()` calls.

#### Extraction candidates (deletion test applied):

| Candidate | Lines | Current depth | After extraction | Deletion test |
|---|---|---|---|---|
| `confirmDeduction()` + `loadPastaCost()` | 1034–1126 | 92 lines inline | ~30 in composable | **Strong** — N×3→N+1 round-trips |
| `cancelCooking()` | 996–1032 | 36 lines inline | ~15 in composable | Moderate |
| `searchExistingRecipe()` + fork logic in `saveDish()` | 850–948 | 100 lines inline | ~60 in composable | Moderate |
| History slider → `useSlider` | 82–138 | 55 lines | ~5 lines | Strong (4× duplication) |
| Date helpers | 607–661 | 50 lines | import | Strong (5× duplication) |
| State machine core | 710–755 | 45 lines | keep (page-specific) | Weak — template couples tightly |

**Top extraction — `confirmDeduction()`:**

Currently N participants × 3 sequential round-trips:
```
for each participant:
  1. POST /items/transactions
  2. GET /items/balances?filter[user]
  3. PATCH /items/balances/{id}
```
After correction:
```
1. POST /items/transactions (N in parallel)
2. GET /items/balances?filter[user][_in]=... (batch, 1 call)
3. PATCH /items/balances/{id} (N in parallel)
```

**Seam:** `useDeduction()` → `{ createTransactions, updateBalances, cleanupShoppingList }`

---

### 2. `recipe/[id].vue` — 1153 lines

**Zoom-out:** Recipe detail page. Shows full recipe with photo hero, ingredients with emoji icons, servings scaler, status badges (scheduled/cooking/ready/cancelled), participant count, join/cook buttons, shopping list share modal, like toggle, and cook-recipes modal.

**What makes it shallow:** 6 independent concerns inline at page level. Servings scaling and shopping list share are self-contained blocks of pure logic + API calls that any future page (AI Recipe) would need to duplicate.

#### Candidates:

| Candidate | Lines | Deletion test |
|---|---|---|
| `useRecipeServings` — scaleAmount, saveServingsToRecipe, presets | 556–640 (85) | **Strong** — AI Recipe will need same logic |
| `useRecipeShare` — addToShoppingList, copyIngredients, shareShoppingList | 968–1059 (90) | **Strong** — AI Recipe needs "Add to shopping list" |
| `useRecipeLikes` — fetchLikes, toggleLike | 880–916 (40) | Moderate — single page |
| Date picker + "Cook This" flow | 660–732 (70) | Moderate — reused in /recipes |
| Queue status machine | 738–788, 932–960 (80) | Weak — template-coupled |
| Cook recipes slider → `useSlider` | 836–874 | Strong (4× duplication) |
| `fetchParticipants()` | 918–930 (15) | Moderate — extend existing composable |

---

### 3. `recipe/create.vue` — 395 lines (least shallow)

**Zoom-out:** Recipe create/edit form. Photo upload (drag-drop-paste with canvas resize), ingredient management with AddIngredientPopover, steps editor, pasta packages field, prefilled from history by name, return-to-cook navigation.

**Assessment:** This module is reasonably **deep** for its size. `submitRecipe()` is self-contained with clear orchestration (upload photo → find queue → save recipe → cleanup on failure). Template and script are well-balanced. The only extraction worth considering is `useRecipeForm()` if AI Recipe page needs to create recipes too.

**Deletion test:** Extract `useRecipeForm()` → caller simplifies from 395 to ~200 lines, but there's only 1 caller today. **Defer** until a second adapter (AI Recipe page) emerges.

---

### 4. `kitchen.vue` — 475 lines

**Zoom-out:** Kitchen hub (Tab 2). Shows weekly calendar with cook assignments per day, selected day's HeroBlock, ShoppingListWidget, dish history with search and like counts. Data orchestrator — fetches cook_queue, recipes, and likes, passes to child components.

**Assessment:** Second deepest module. Well-structured. Main issue: date helpers duplicated, and the selected-day reactivity watch (lines 355–391) is somewhat coupled but not worth extracting alone.

| Candidate | Lines | Deletion test |
|---|---|---|
| Date helpers → `utils/dates.ts` | 238–259 (20) | Strong (5× duplication) |
| Dish history fetch + like batch | 426–454 (30) | Weak — one caller |

---

### 5. `finance.vue` — 630 lines

**Zoom-out:** Admin finance page. 4 sections: balances overview (slider → expand), manual top-up form (select user + amount + note → creates transaction + balance), pasta package price inline edit, transaction history (slider → expand).

**What makes it shallow:** The template is ~200 lines of duplication between slider mode and expanded mode for both balances and transactions. The item rows differ only in height and content structure. The slider/expand toggle pattern repeats verbatim.

#### Candidates:

| Candidate | Lines | Deletion test |
|---|---|---|
| Balance slider → `useSlider` | 234–264 + template | Strong (4× duplication) |
| Transaction slider → `useSlider` | 201–229 + template | Strong (4× duplication) |
| Template dedup via shared component | ~200 lines template | Moderate — reduces file by 30% |
| Date helpers | 267–270 | Strong (5× duplication) |

**Note:** The SliderList component already exists for profile. Reusing it here would eliminate both the script boilerplate and the template duplication.

---

## Proposed Extraction Order

### Phase 1: Cross-cutting (high leverage, low risk)
| Step | New module | Removes duplication from |
|---|---|---|
| 1 | `utils/dates.ts` | cook.vue, kitchen.vue, recipe/[id].vue, finance.vue, index.vue |
| 2 | `composables/useSlider.ts` | cook.vue, finance.vue ×2, recipe/[id].vue |
| 3 | Extend `useParticipants.ts` with `getFullList()` | cook.vue, recipe/[id].vue |

### Phase 2: Business logic (deep modules)
| Step | New module | Extracted from | Lines saved |
|---|---|---|---|
| 4 | `composables/useDeduction.ts` | cook.vue confirmDeduction + loadPastaCost | ~90 |
| 5 | `composables/useRecipeServings.ts` | recipe/[id].vue scaling logic | ~85 |
| 6 | `composables/useShoppingListCleanup.ts` | cook.vue (both cancel + confirm) | ~30 |
| 7 | Template dedup in finance.vue | finance.vue slider/expand duplication | ~200 |

### Phase 3: Polish (optional)
| Step | New module | Notes |
|---|---|---|
| 8 | `composables/useRecipeShare.ts` | Needed if AI Recipe page gets same buttons |
| 9 | `composables/useRecipeLikes.ts` | Single caller, low urgency |
| 10 | `composables/useRecipeForm.ts` | Defer until AI Recipe needs it |

---

## Target Module Map

```
frontend/app/
├── composables/
│   ├── useDirectus.ts            (existing) 
│   ├── useAuth.ts                (existing)
│   ├── useParticipants.ts        (existing — extend with getFullList)
│   ├── useParticipantsModal.ts   (existing)
│   ├── useBalanceCheck.ts        (existing)
│   ├── useMealCost.ts            (existing)
│   ├── useTotalUsers.ts          (existing)
│   ├── useRecipeImage.ts         (existing)
│   ├── useSlider.ts              ← Phase 1
│   ├── useDeduction.ts           ← Phase 2
│   ├── useRecipeServings.ts      ← Phase 2
│   ├── useShoppingListCleanup.ts ← Phase 2
│   ├── useRecipeShare.ts         ← Phase 3
│   ├── useRecipeLikes.ts         ← Phase 3
│   └── useRecipeForm.ts          ← Phase 3 (optional)
├── utils/
│   ├── ingredientIcons.ts        (existing)
│   ├── popularIngredients.ts     (existing)
│   ├── dedupRecipes.ts           (existing)
│   └── dates.ts                  ← Phase 1
```

## File Size Reduction Targets

| Module | Current | Target | Reduction |
|---|---|---|---|
| `cook.vue` | 1202 | ~800 | −400 (33%) |
| `recipe/[id].vue` | 1153 | ~750 | −400 (35%) |
| `finance.vue` | 630 | ~400 | −230 (36%) |
| `kitchen.vue` | 475 | ~420 | −55 (12%) |
| `recipe/create.vue` | 395 | ~380 | −15 (4%) |

---

## Audit 2026-06-18 — Remaining Opportunities

### 🔥 Trivial (5–10 min each)

1. **`formatDateISO` — replace local copies with auto-import** — `kitchen.vue:254`, `index.vue:168`, `middleware/cook.ts:18` all redefine the same function already in `utils/dates.ts:7`. (18 lines saved)

2. **`formatUserName()` — shared utility** — Pattern `[first, last].filter(Boolean).join(' ') || 'Unknown'` repeated **13 times** across 8+ files (kitchen.vue, index.vue, cook.vue, recipe/[id].vue, profile.vue, duty.vue, useParticipants.ts, layouts/app.vue, DutyWidget.vue). Extract to `utils/` as `formatUserName(user, fallback?)`. (~25 lines saved)

3. **`getMonday` + `MONTH_NAMES` + `formatDateStr` in `kitchen.vue`** — Identical copies of what's already in `utils/dates.ts`. Replace with auto-imported versions. (12 lines saved)

4. **`parseISODate(iso: string): Date`** — `new Date(str + 'T12:00:00')` repeated **8 times** in 6 files (kitchen.vue, cook.vue, recipe/[id].vue, shopping-list.vue, profile.vue, WeekCalendar.vue). Extract to `utils/dates.ts`. (~8 lines saved)

5. **`parseJsonField<T>(val): T | null`** — `typeof x === 'string' ? JSON.parse(x) : x` repeated in `recipe/[id].vue` and `recipe/create.vue` for ingredients/steps. Extract to utility. (~12 lines saved)

6. **Dead code removal** — Commented-out template block in `index.vue:47-72` (16 lines), stale `console.log` in `recipe/[id].vue:993`.

### ⚡ Easy (15–20 min)

7. **`ActionBlockedModal.vue`** — The "Action blocked" overlay (heading + message + OK button with `#app-shield` icon) is duplicated in `index.vue`, `kitchen.vue`, `recipe/[id].vue`, `cook.vue`. Extract as shared component. (~60 lines saved)

8. **`useCookQueueStatus()`** — `startCooking()` and `markReady()` are nearly identical in `cook.vue` and `recipe/[id].vue` (both do PATCH status + set local status). Extract to composable. (~30 lines saved)

9. **`formatDateReadable(iso: string): string`** — `shopping-list.vue:252` and `profile.vue:469` define identical date formatters (`toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })`). Extract to `dates.ts`. (8 lines saved)

### 🧩 Medium (20–30 min)

10. **`batchFetchLikeCounts(recipeIds): Record<string, number>`** — The batch-fetch loop (`request → filter[recipe][_in] → countMap`) is duplicated in `index.vue:264-275` and `kitchen.vue:440-450`. Extract as composable or util.

11. **Split `onMounted` in `index.vue` (89 lines)** — Does 3 distinct things: (a) fetch cook queue + hero data, (b) fetch recipes + dedup, (c) batch-fetch likes. Extract hero logic to `useTodayHero()` or similar.
