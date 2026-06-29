# ItoCook — Design Fix Prompts (PWA Session)

## Preface for the Agent

Before starting any task in this file, read and follow these rules:

1. **Read the project first.** Before changing any file, read it fully. Do not assume structure — check what actually exists.

2. **One fix at a time.** Run each prompt separately. Verify in browser after each one. Do not combine multiple prompts into one session unless explicitly told to.

3. **Do not break working functionality.** If a fix requires changing a component used in multiple places, check all usages first. Never remove business logic, routing, or data fetching.

4. **PWA behavior is the target.** The app is installed as a PWA on iPhone. All fixes must work in that context — no browser chrome, safe area insets apply, no overscroll, no double-tap zoom.

5. **Pages must not move or bounce.** Scrolling should only happen inside designated scroll containers, never on the root html/body. Overscroll bounce must be disabled globally.

6. **Minimum tap target is 44x44px.** Any interactive element (button, icon, tab) must meet Apple's minimum touch target size. Use padding or wrapper size to achieve this without changing visual size.

7. **No auto-zoom on input focus.** All inputs must have font-size: 16px minimum. Use inputmode="decimal" or inputmode="numeric" for number fields instead of type="number".

8. **Read the design system.** The file `docs/design.md` is the single source of truth for colors, typography, spacing and components. Do not invent new styles — use existing tokens.

9. **Read the skill.** This project has the `make-interfaces-feel-better` skill installed at `~/.config/opencode/skills/`. Read it before making any UI changes — it contains practical guidance on animations, micro-interactions, visual polish and PWA feel.

10. **Update progress.md after every task.** Add completed items under "Fixes — current session" in `docs/progress.md`.

---

## Prompt 1 — Layout bounce + Auth screen fixes

```
## Task: Fix layout bounce + auth screen issues

### Context
- Nuxt 4, app/layouts/default.vue and app/layouts/app.vue
- Auth page: app/pages/auth.vue
- PWA on iPhone — overscroll bounce is visible, white bar shows below onboarding screen

### Fix 1: Disable overscroll bounce on all layouts

Add to assets/css/main.css:

html, body {
  overscroll-behavior: none;
  overflow: hidden;
  height: 100%;
  width: 100%;
  position: fixed;
}

In BOTH app/layouts/default.vue AND app/layouts/app.vue — the inner scrollable content area must use overflow-y: auto with -webkit-overflow-scrolling: touch. Remove any white background or margin showing below the screen on onboarding.

### Fix 2: Auth page — default to "Log In" tab

In app/pages/auth.vue change the default active tab from 'signup' to 'login'. The "Log In" tab should be active (black pill) on first open.

### Fix 3: Auth page — clear inputs on tab switch

In app/pages/auth.vue, in the tab switching handler: when switching tabs, clear ALL fields of both forms and clear any validation error messages.

### Fix 4: Auth page — improve validation messages

In app/pages/auth.vue, update the validate() function with specific per-field messages displayed directly below each input in text-red-500 text-[12px] mt-1:

Sign Up:
- First Name empty → "Please enter your first name"
- Last Name empty → "Please enter your last name"
- Email empty → "Please enter your email address"
- Email invalid → "Email must be in format: name@company.com"
- Password empty → "Please enter a password"
- Password < 6 chars → "Password must be at least 6 characters"

Log In:
- Email empty → "Please enter your email address"
- Email invalid → "Email must be in format: name@company.com"
- Password empty → "Please enter your password"

### Do NOT change
Visual design, colors, images, routing, auth logic.

### After all fixes
Update docs/progress.md under "Fixes — current session".
```

---

## Prompt 2 — BottomTabBar, RecipeCard, recipe count, modal swipe

```
## Task: Fix BottomTabBar, RecipeCard images, recipe count, and modal swipe

### Context
- Nuxt 4 PWA on iPhone
- Files: app/components/BottomTabBar.vue, app/components/RecipeCard.vue, app/pages/index.vue, app/layouts/app.vue
- In installed PWA (Add to Home Screen) tab bar icons shift upward due to missing safe-area handling
- RecipeCard images get cropped awkwardly
- Recent Dishes shows 5 items — should show max 6 (even number for 2-column grid)
- Bottom sheet modals swipe-to-dismiss is janky

### Fix 1: BottomTabBar — fix icons shifting up in PWA

In app/components/BottomTabBar.vue:
- Outermost wrapper must be: position fixed, bottom-0, left-0, right-0, bg-white, border-t border-gray-100
- Add inline style to wrapper: style="padding-bottom: env(safe-area-inset-bottom, 0px)"
- The icons and labels container inside must be h-[64px] flex items-center justify-around
- Safe area padding goes BELOW the icons row, not around it — icons must stay vertically centered in the 64px zone
- Do NOT use backdrop-blur or bg-opacity — solid white only
- Do NOT add padding-bottom to the icons container itself

In app/layouts/app.vue:
- Main content area must have: style="padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px))"

In nuxt.config.ts confirm viewport meta includes viewport-fit=cover:
viewport: 'width=device-width, initial-scale=1, viewport-fit=cover'

### Fix 2: RecipeCard — fix image cropping

In app/components/RecipeCard.vue:
- The food image inside the card should have a fixed height of h-[140px]
- Use object-contain (not object-cover) so the full dish is visible without cropping
- Add bg-white or bg-primary-light/30 as image background so empty space looks clean
- Image wrapper should be w-full with rounded-b-2xl overflow-hidden

### Fix 3: Recent Dishes — limit to 6 items

In app/pages/index.vue:
- Where recipes are fetched or sliced for display, change the limit from 5 to 6
- This ensures the 2-column grid always ends evenly with no orphaned single card

### Fix 4: Bottom sheet modal — smoother swipe to dismiss

Find all bottom sheet / modal components used on the home screen (participants sheet etc):
- Add touch-action: pan-y to the drag handle and modal wrapper
- The swipe threshold to dismiss should be 80px of downward movement
- Add transition: transform 0.25s ease on the modal panel so it animates smoothly when dismissed
- Make sure the backdrop does not intercept touch events on the sheet itself
- If using @touchstart/@touchmove/@touchend handlers, ensure they call event.stopPropagation() to prevent page scroll fighting the modal drag

### Do NOT change
- Tab bar routing logic
- Recipe card data/props
- Modal open/close logic beyond swipe feel

### After all fixes
Update docs/progress.md under "Fixes — current session".
```

---

## Prompt 3 — Recipe create/edit page: layout, zoom, numeric keyboard

```
## Task: Fix recipe create/edit page layout, input zoom, and numeric keyboard

### Context
- app/pages/recipe/create.vue (and edit if separate)
- PWA on iPhone
- Issues: large purple gap top/bottom (page not filling screen), auto-zoom on input focus doesn't reset after keyboard closes, number inputs show text keyboard instead of numeric

### Fix 1: Prevent auto-zoom on input focus (global fix)

In assets/css/main.css, add:

input, textarea, select {
  font-size: 16px !important;
}

Explanation: iOS Safari auto-zooms when input font-size is below 16px. Setting all inputs to 16px prevents the zoom entirely so the viewport never changes. This fix applies globally to all pages.

### Fix 2: Numeric inputs — show number keyboard

In app/pages/recipe/create.vue, find all number-related input fields:
- Ingredient amount field: add inputmode="decimal" type="text"
- Pasta packages field: add inputmode="numeric" type="text"
- Any quantity or serving count inputs: add inputmode="decimal" type="text"

Do NOT use type="number" — it causes issues with decimal separators on iOS. Use type="text" with inputmode="decimal" instead.

### Fix 3: Recipe page layout — remove excess top/bottom space

In app/pages/recipe/create.vue:
- The page must use layout: 'app' via definePageMeta
- Remove any extra margin-top or padding-top beyond the standard layout safe area
- The white content card must fill the full screen width without floating in the middle with purple gaps around it
- Check if the page has a wrapping div with fixed height or min-h — replace with min-h-screen or h-full
- The purple background visible around the card means the card is not stretching correctly — make it w-full with no horizontal margin

### Do NOT change
- Form logic, validation, save/submit handlers
- Ingredient add/remove functionality
- Navigation (back button)

### After all fixes
Update docs/progress.md under "Fixes — current session".
```

---

## Prompt 4 — Recipe detail page: hero size, steps, bottom gap, modal scroll

```
## Task: Fix recipe detail page — hero size, steps collapse, bottom gap, modal scroll

### Context
- app/pages/recipe/[id].vue
- PWA on iPhone
- Three issues: hero photo block too large, steps section has unnecessary collapse toggle, white gap at bottom of page, modals with lists use arrow-based scrolling instead of natural touch scroll

### Fix 1: Reduce hero photo block height

In app/pages/recipe/[id].vue, find the top hero section (purple background with dish photo):
- Reduce its height from whatever it currently is to h-[280px] or max-h-[280px]
- The dish image inside should be object-contain, centered, max-h-[220px]
- Do not change the purple background color or the author/cart badges overlapping the bottom edge

### Fix 2: Remove steps collapse toggle

In app/pages/recipe/[id].vue, find the Steps section:
- Remove the collapse/expand arrow button (chevron up/down toggle) from the Steps header
- Steps must always be fully visible — no showSteps ref or v-if/v-show toggling
- Keep the "Steps (N)" label and the numbered list as-is
- Note: Ingredients section may have its own toggle — leave that one alone, only remove Steps toggle

### Fix 3: Remove bottom gap

In app/pages/recipe/[id].vue:
- Find any empty div or padding at the very bottom of the page below the Start Cooking / Join button
- Remove extra pb-* or margin-bottom that creates white space below the last element
- The page content should end naturally and the layout's default pb handles the tab bar clearance

### Fix 4: Modal lists — replace arrow scroll with natural touch scroll

Find all bottom sheet / modal components on this page (e.g. "Recipes by [author]" sheet, participants sheet):
- Remove any up/down arrow buttons used for scrolling through list items
- Remove any translateY animation or VISIBLE_COUNT limiting logic that shows only N items at a time
- Replace with a simple overflow-y-auto scrollable list inside the modal
- The modal itself keeps its max-h (e.g. max-h-[70vh]) — the list inside scrolls naturally within that height
- Add -webkit-overflow-scrolling: touch for smooth iOS scroll

### Do NOT change
- Ingredients collapse toggle (keep it)
- Hero purple background color
- Modal open/close/swipe-to-dismiss logic
- Portions selector, author badge, action buttons

### After all fixes
Update docs/progress.md under "Fixes — current session".
```

---

## Prompt 5 — Profile page + Finance page: lists, select, transaction colors

```
## Task: Fix profile page — lists, select padding, transactions; fix finance page lists

### Context
- app/pages/profile.vue
- app/pages/finance.vue
- All pages: PWA on iPhone
- Issues: arrow-based scrolling on all lists (My List, My Recipes, Transactions, Balances), select input too small, debit transactions showing wrong color

### Fix 1: Replace arrow-scroll lists with "show N + button" pattern (profile.vue)

This applies to ALL three list sections in profile.vue: Transactions, My List, My Recipes.

For each list:
- Remove all up/down arrow buttons and translateY/VISIBLE_COUNT slider logic entirely
- Show only the last 5 items by default (slice the array to 5)
- Below the list add a single "Show all (N)" button styled as: text-primary text-[14px] font-medium, centered, w-full, py-3
- "Show all" toggles showAllTransactions / showAllMyList / showAllMyRecipes ref to true, which renders the full list in a scrollable container: overflow-y-auto max-h-[400px] with -webkit-overflow-scrolling: touch
- No separate page needed — expand inline

### Fix 2: Same pattern for Balances list in finance.vue

In app/pages/finance.vue, Balances section:
- Remove up/down arrow buttons and VISIBLE_COUNT logic
- Show first 5 users by default
- Add "Show all (N)" button below — same style as above
- On click: show full list in overflow-y-auto max-h-[500px] container

Transaction History in finance.vue:
- Same pattern: show last 5 by default
- "Show all (N)" expands to full scrollable list inline

### Fix 3: Fix debit transaction color in finance.vue

In the Transaction History list, debit entries (negative amounts) are showing green color — this is wrong.
- Negative amounts must use text-red-500
- Positive amounts (credits) use text-green-600
- Check the amount sign: if amount < 0 → red, if amount > 0 → green

### Fix 4: Preferences select — increase padding

In profile.vue, find the Department select input inside the Preferences modal/sheet:
- Add padding: px-4 py-4 (not py-2)
- Min height: h-[52px]
- Font size: text-[16px] to prevent iOS auto-zoom
- Border radius: rounded-xl
- Border: border border-gray-200
- Background: bg-primary-pale or bg-white

### Do NOT change
- List item card design (colors, content)
- Modal open/close behavior
- Finance page top-up form
- Routing or data fetching logic

### After all fixes
Update docs/progress.md under "Fixes — current session".
```

---

## Prompt 6 — Notifications page: close button, remove arrow scroll

```
## Task: Fix notifications page — close button and remove arrow scroll

### Context
- app/pages/notifications.vue (or wherever the notifications list renders)
- PWA on iPhone

### Fix 1: Add close/back button

Add a close button (X) in the top right corner of the notifications page:
- Style: w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center
- On click: router.back()
- Position it in the same header row as the "Notifications" title and "Dismiss all" button

### Fix 2: Remove arrow scroll, use natural page scroll

- Remove all up/down arrow buttons and VISIBLE_COUNT / translateY slider logic from the notifications list
- Render all notifications in a simple vertical list
- No max-height limit on the list itself — let the page scroll naturally
- Keep "Dismiss all" button and individual read/unread circle checkboxes on each card

### Do NOT change
- Notification card design (icon, text, timestamp, colors)
- Read/unread state logic
- Dismiss all functionality

### After all fixes
Update docs/progress.md under "Fixes — current session".
```

---

## Prompt 7 — Kitchen page: week nav tap targets + All Recipes top gap

```
## Task: Fix kitchen page week nav buttons + all recipes page top gap

### Context
- app/pages/kitchen.vue
- app/components/WeekCalendar.vue (or wherever prev/next week arrows are)
- app/pages/recipes/index.vue or wherever "All Recipes" page renders
- PWA on iPhone

### Fix 1: Week navigation arrows — increase tap target, prevent double-tap zoom

In WeekCalendar.vue or kitchen.vue, find the prev/next week arrow buttons (< and >):
- Increase tap target to minimum w-11 h-11 (44px) — this is Apple's recommended minimum
- Add touch-action: manipulation to each button — this disables double-tap zoom on the button itself
- Style: rounded-full bg-gray-100 flex items-center justify-center
- Do NOT change the icon size inside, only the button wrapper size

### Fix 2: All Recipes page — reduce top gap

In the All Recipes page:
- There is extra padding-top or margin-top above the "All Recipes" title
- Reduce it so the title sits closer to the top of the content area
- The gap should match other pages like Notifications — just enough for the status bar safe area

### Do NOT change
- Week calendar layout or day selection logic
- All Recipes grid layout, search, category filter
- Any other kitchen page elements

### After all fixes
Update docs/progress.md under "Fixes — current session".
```

---

## Prompt 8 — Cook Panel: fill screen height, fix confirm button color

```
## Task: Cook Panel — fill screen, fix confirm button color

### Context
- app/pages/cook.vue
- PWA on iPhone
- All cook states (scheduled, cooking, ready, done) show content only in top portion, large empty grey area below
- "Confirm Deduction" button appears grey/disabled when it should be active primary color

### Fix 1: Cook panel card — fill the screen height

In app/pages/cook.vue, find the main content card/wrapper that wraps all state templates (scheduled, cooking, ready, done):
- Change it from fitting content height to min-h-screen or at minimum stretch the card to fill available space
- The purple/green/yellow state card should be: min-h that fills from top to bottom with no grey gap
- Use flex flex-col with the inner content pushing to fill: the card wrapper should be flex-1 or min-h-[calc(100vh-120px)]
- This applies to ALL states — scheduled, cooking, ready, done

### Fix 2: "Confirm Deduction" button — use primary color

In the 'ready' state (Enter Receipt screen) in cook.vue:
- The "Confirm Deduction" button is currently grey (bg-gray-700 or similar)
- Change it to bg-primary text-white
- Only activate (remove opacity-50 or disabled state) when receipt amount > 0
- When amount is 0 or empty: bg-gray-300 text-gray-500 cursor-not-allowed
- When amount > 0: bg-primary text-white active:scale-[0.98]

### Do NOT change
- Any business logic (deduction calculation, status transitions)
- Button labels or icons
- Participant list layout
- Receipt input field

### After all fixes
Update docs/progress.md under "Fixes — current session".
```

---

## Prompt 9 — Finance page inputs + Duty page select padding

```
## Task: Fix input zoom on finance page + select padding on duty page

### Context
- app/pages/finance.vue
- app/pages/duty.vue
- PWA on iPhone
- Finance page: inputs cause auto-zoom on focus and don't reset; amount field shows text keyboard instead of numeric
- Duty page: Department and User select inputs too small, need more padding

### Fix 1: Finance page — prevent input zoom, numeric keyboard

In app/pages/finance.vue, find all input fields:
- Amount/number input (Manual Top-up amount, Pasta Package Price): add inputmode="decimal" type="text" and font-size: 16px via inline style or class text-[16px]
- All other text inputs (Note field, Select user): add text-[16px] to prevent iOS auto-zoom
- The global fix in main.css (input { font-size: 16px }) should already cover this — if finance.vue overrides font size anywhere, remove that override

### Fix 2: Finance page — amount input numeric keyboard

The amount input in Manual Top-up section:
- Must have inputmode="decimal" so iOS shows numeric keyboard with decimal point
- Must NOT have type="number" — use type="text" with inputmode="decimal"

### Fix 3: Duty page — increase select input padding

In app/pages/duty.vue, find the Edit Assignment section with Department and User select inputs:
- Both selects must have: px-4 py-4 h-[52px] text-[16px] rounded-xl border border-gray-200
- Apply same styling as the Preferences select fixed in profile.vue earlier
- The label text above each select ("Department", "User") should have mb-1 mt-3 text-[12px] text-gray-500

### Do NOT change
- Finance form submit logic
- Duty calendar layout or assignment save logic
- Any other inputs on these pages

### After all fixes
Update docs/progress.md under "Fixes — current session".
```

---

## Prompt 10 — BottomTabBar: disable double-tap zoom globally

```
## Task: Fix BottomTabBar double-tap zoom

### Context
- app/components/BottomTabBar.vue
- assets/css/main.css
- PWA on iPhone
- Double-tapping any tab bar icon triggers iOS double-tap zoom

### Fix: Disable double-tap zoom on tab bar and all interactive elements

In app/components/BottomTabBar.vue:
- Add style="touch-action: manipulation" to the entire tab bar wrapper element
- Add style="touch-action: manipulation" to every individual tab button/div wrapper

In assets/css/main.css, add globally:
button, a, [role="button"] {
  touch-action: manipulation;
}

This is the only reliable way to disable iOS double-tap zoom on interactive elements. Applies to the entire app so all buttons, links and tab items are covered.

### Do NOT change
- Tab routing logic or active state detection
- Any other styling or layout

### After fix
Update docs/progress.md under "Fixes — current session".
```
