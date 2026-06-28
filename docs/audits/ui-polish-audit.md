# UI Polish Audit

> Generated: 2026-06-28
> Skill: `make-interfaces-feel-better` (typography, surfaces, animations, performance)
> Design reference: `docs/design.md`
> Audit scope: all `.vue` files in `frontend/app/`

---

## Legend

| Priority | Meaning |
|----------|---------|
| **High** | Visible polish defect the user will notice daily |
| **Medium** | Subtle but compounds across the app |
| **Low** | Nice-to-have, edge case, or future-ready |

---

## 1. Typography

### 1.1 Font Smoothing — Root Level

**Issue:** `-webkit-font-smoothing: antialiased` is not set anywhere. On macOS, Jost will render heavier than intended.

**File:** `frontend/app/assets/css/main.css`

**Suggestion:** Add to `html` or `*` selector:

```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

| Page/Component | Priority |
|----------------|----------|
| Global (`main.css`) | **High** |

---

### 1.2 `text-wrap: balance` — Headings

**Issue:** No heading uses `text-balance`. On narrow (390px) screens, multi-word headings can orphan.

**Affected headings:**
- `onboarding.vue` — "Cook. Split. Done." (title)
- `auth.vue` — "Sign Up with ItoCook" / "Log In with ItoCook" (h2)
- `index.vue` — "Recent Dishes" (h2)

**Suggestion:** Add `text-balance` to `<h1>`, `<h2>`, `<h3>` globally.

| Page/Component | Priority |
|----------------|----------|
| All headings | **Low** (short strings, low orphan risk) |

---

### 1.3 `text-wrap: pretty` — Paragraphs & Captions

**Issue:** No paragraph or description uses `text-pretty`. Some multi-word descriptions could leave orphans.

**Affected:**
- `auth.vue:32-35` — description paragraph
- `onboarding.vue:29` — "One tap to join…"

**Suggestion:** Add `text-pretty` to `<p>` and description elements globally.

| Page/Component | Priority |
|----------------|----------|
| `auth.vue`, `onboarding.vue` | **Low** |

---

### 1.4 Tabular Numbers — Counters & Prices

**Issue:** No `tabular-nums` on dynamic numeric displays, causing layout jitter when values change.

**Affected:**
- `index.vue` — participant count ("3 of 10 confirmed")
- `HeroBlock.vue:94-97` — participant count / total count
- `NotificationBell.vue:34` — unread badge count
- `BalanceWidget.vue` — balance amounts (presumed)
- `FinanceWidget.vue` — transaction amounts (presumed)
- `RecipeCard.vue:32` — like counts
- `RecipeGridItem.vue:36` — like counts

**Suggestion:** Add `tabular-nums` (`font-variant-numeric: tabular-nums`) to all dynamic counter and price elements:

```css
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

| Page/Component | Priority |
|----------------|----------|
| `HeroBlock.vue` participant count | **Medium** |
| `NotificationBell.vue` unread badge | **Medium** |
| `BalanceWidget.vue` balance | **Medium** |
| `RecipeCard.vue` / `RecipeGridItem.vue` like count | **Low** |

---

## 2. Surfaces

### 2.1 Concentric Border Radius

**Issue:** Nested `rounded-2xl` (16px) with padding `< 16px` creates visually flat inner corners.

**Affected:**

- **`HeroBlock.vue`**: Outer `rounded-2xl` (16px) on the container, inner `rounded-2xl` (16px) on the child with `p-5` (20px padding). The outer `rounded-2xl` should be `rounded-[32px]` (20+12) if the inner stays `rounded-2xl` (12px), or 16+20=36px. Actually checking: outer is `rounded-2xl` (12px in Tailwind default scale). The child is also `rounded-2xl` with `p-5`. 12px outer + 12px inner + 20px padding means the concentric formula would give outer = 12 + 20 = 32px. So outer should be `rounded-3xl` (24px) or a custom value. But actually the skill says concentric applies when surfaces are close — 20px padding is large. Let me reconsider. The skill says: "If padding is larger than 24px, treat as separate surfaces." 20px is less than 24, so concentric applies.

  - `HeroBlock.vue` outer container: `rounded-2xl` (12px Tailwind default)
  - Inner: `rounded-2xl` (12px) with `p-5` (20px)
  - Concentric: outer = 12 + 20 = 32px → should use `rounded-3xl` (24px) or custom `rounded-[32px]`

- **`RecipeCard.vue`**: Outer `rounded-2xl`, inner image `rounded-xl` — this is actually closer. Let's check: outer `rounded-2xl` (12px) with `p-3` (12px). The non-compact template has an inner image with `rounded-xl` (8px). Concentric: outer radius = inner radius + padding = 8 + 12 = 20px. Current outer is 12px — should be `rounded-3xl` (24px) or `rounded-[20px]`.

- **`AddIngredientPopover.vue`**: Bottom sheet `rounded-t-2xl` (12px). Inner category buttons `rounded-xl` (8px) with no explicit padding on the sheet content container (it uses `px-5 pt-5`). The buttons inside the scroll area have no wrapping container — they're direct children of the scroll div. The scroll div has `-mx-5 px-5` but no border radius — so concentric doesn't apply here.

**Suggestion (HeroBlock):**
- Change outer to `rounded-3xl` or custom `rounded-[32px]`

**Suggestion (RecipeCard):**
- Change outer to `rounded-3xl` or `rounded-[20px]`

| Page/Component | Priority |
|----------------|----------|
| `HeroBlock.vue` | **Low** (slightly off nested radius) |
| `RecipeCard.vue` | **Low** |

---

### 2.2 Shadows Instead of Borders

**Issue:** Several components use solid borders where subtle `box-shadow` would look cleaner and adapt to backgrounds.

**Affected:**

- **`HeroBlock.vue`**: `.glass` button variant uses `border border-white/50` and `border border-primary/30`. These are on semi-transparent backgrounds (backdrop-blur). Shadows would adapt better here.
- **`HeroBlock.vue:47`**: `border border-primary/30 shadow-sm` — uses both border AND shadow. Drop the border, keep the shadow.
- **`AddIngredientPopover.vue`**: Category buttons have `bg-app-bg rounded-xl` with no border — fine. But the ingredient list items use `border-b border-gray-100` — these are dividers, fine per skill rules.
- **`auth.vue:165,171`**: Social login buttons use `border border-gray-200` — these are on white background, low risk, but shadow would look more premium.
- **Custom ingredient button in `AddIngredientPopover.vue:20`**: No border — good.

**Suggestion.** Replace container depth borders with `--shadow-border` in:
- `HeroBlock.vue` action buttons with backdrop-blur
- `auth.vue` social buttons

**Suggestion.** Use border for form inputs (required for accessibility outline) — keep as-is.

| Page/Component | Priority |
|----------------|----------|
| `HeroBlock.vue` action buttons | **Medium** |
| `auth.vue` social buttons | **Low** |

---

### 2.3 Image Outlines

**Issue:** No image in the app has the `outline` treatment. Images will lack consistent depth against varying backgrounds.

**Affected (all images):**
- `index.vue:7` — user avatar
- `HeroBlock.vue:113-124` — dish image
- `RecipeCard.vue:9,36,45` — recipe images
- `RecipeGridItem.vue:26` — grid images
- `RecipeImageUpload.vue:9-13` — uploaded photo preview
- `BottomTabBar.vue` — no images, fine
- `onboarding.vue:8` — chef image
- `auth.vue:4` — background image (decorative)

**Suggestion:** Add global image outline in `main.css`:

```css
img {
  outline: 1px solid rgba(0, 0, 0, 0.1);
  outline-offset: -1px;
}
```

Use `outline-black/10 dark:outline-white/10` on individual images if avoiding global style.

| Page/Component | Priority |
|----------------|----------|
| All images (global) | **High** |

---

### 2.4 Minimum Hit Area — Small Interactive Elements

**Issue:** Several small interactive elements are below 44×44px WCAG recommendation.

**Affected:**

- **`NotificationBell.vue:27`**: Bell button is `w-10 h-10` (40×40px) — borderline but acceptable (skill says 40×40 minimum).
- **`NotificationBell.vue:32`**: Badge is `w-4 h-4` (16×16px) — purely decorative, fine.
- **`RecipeImageUpload.vue:15`**: Trash button is `w-8 h-8` (32×32px) — **needs enlargement**. Add pseudo-element to expand hit area to 44×44.
- **`AddIngredientPopover.vue:48`**: "✓" badge text — decorative, no interaction.
- **`HeroBlock.vue:89`**: Participants area has `min-h-[44px]` — good.
- **`index.vue:4`**: Header area — entire row is clickable, ~44px.

**Suggestion:** For `RecipeImageUpload.vue` trash button, add:

```vue
<button class="relative w-8 h-8 after:absolute after:inset-[-6px] ...">
```

| Page/Component | Priority |
|----------------|----------|
| `RecipeImageUpload.vue` trash button | **Medium** |
| `NotificationBell.vue` icon | **Low** (40×40 is acceptable) |

---

### 2.5 Optical Alignment — Icon + Text Buttons

**Issue:** Icons with text padding are not optically adjusted.

**Affected:**

- **`HeroBlock.vue:46-52`**: "Cook →" button — icon left side has `gap-2` with no padding side adjustment.
- **`HeroBlock.vue:24-25`**: "I'm cooking today!" — chef hat icon with `gap-2`.

**Suggestion:** Add `pl-4 pr-3.5` pattern for buttons with icon on the right, `pl-3.5 pr-4` for icon on the left.

| Page/Component | Priority |
|----------------|----------|
| `HeroBlock.vue` all button icons | **Low** |

---

## 3. Animations

### 3.1 Enter Animations (Missing)

**Issue:** No page or component has staggered enter animations. Content appears in a single frame.

**Affected (all pages):**
- `index.vue` — hero block + widgets + recipe grid all appear at once
- `cook.vue` — cook panel with multiple sections
- `kitchen.vue` — queue items list
- `recipe/[id].vue` — recipe details with sections
- `profile.vue` — profile sections
- `finance.vue` — transactions list
- `shopping-list.vue` — list items
- `notifications.vue` — notification items
- `duty.vue` — calendar grid

**Suggestion (highest-ROI pages):**
- `index.vue`: Stagger hero (0ms) → widgets (+100ms) → recipe grid (+200ms)
- `cook.vue`: Stagger cook info (0ms) → ingredients (+100ms) → action buttons (+200ms)
- Use CSS `@keyframes` with `nth-child` delays (no JS library needed)

| Page/Component | Priority |
|----------------|----------|
| `index.vue` (hero → widgets → recipes) | **Medium** |
| `cook.vue` (sections) | **Medium** |
| `kitchen.vue` (queue items) | **Medium** |
| Other pages | **Low** |

---

### 3.2 Exit Animations (Missing)

**Issue:** Modal components disappear instantly — no exit transition.

**Affected:**

- **`ActionBlockedModal.vue`**: Uses `v-if="show"` — disappears immediately.
- **`AddIngredientPopover.vue`**: Bottom sheet uses `v-if="show"` — slides up on enter but no exit animation.
- **Participants modal in `layouts/app.vue`**: Uses `v-if="pm.show"` — no exit animation.

**Suggestion:** For modals that appear via `v-if`, add a CSS transition approach. Wrap the content in a transitioning container:

```vue
<transition name="fade-up">
  <div v-if="show" class="...">
    ...
  </div>
</transition>
```

With CSS:
```css
.fade-up-enter-active, .fade-up-leave-active {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
.fade-up-enter-from, .fade-up-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
```

| Page/Component | Priority |
|----------------|----------|
| `ActionBlockedModal.vue` | **Medium** |
| `AddIngredientPopover.vue` | **Medium** |
| Participants modal (`app.vue`) | **Low** |

---

### 3.3 Scale on Press — Wrong Values

**Issue:** All buttons use `active:scale-[0.98]` instead of the recommended `active:scale-[0.96]`.

**Affected:** Every button and clickable element in the codebase:
- `onboarding.vue:37`
- `auth.vue:94,165,171`
- `index.vue` — through `RecipeCard`, `HeroBlock`
- `HeroBlock.vue:26,47,53,65`
- `RecipeCard.vue:6`
- `RecipeGridItem.vue:24`
- `RecipeImageUpload.vue:15`
- `NotificationBell.vue:27`
- `AddIngredientPopover.vue:17,27,41`
- `BottomTabBar.vue:11`

**Suggestion:** Global search-and-replace: `active:scale-[0.98]` → `active:scale-[0.96]`.

| Page/Component | Priority |
|----------------|----------|
| All buttons (global) | **Medium** |

---

### 3.4 Transition Specificity — `transition-all` Usage

**Issue:** Several components use `transition-all` instead of listing exact properties.

**Affected:**

- **`HeroBlock.vue:47,65`**: `transition-all` on backdrop-blur button.
- **`auth.vue:13`**: `transition-all duration-200` on tab indicator — only `background-color` and `color` change.
- **`Auth.vue:50,58,67,76,114,124`**: `transition-colors` — correctly specific. 👍
- **NotificationBell.vue:27**: `transition-transform` — correctly specific. 👍
- **BottomTabBar.vue:11**: `transition-transform` — correctly specific. 👍

**Suggestion:** Replace `transition-all` with `transition-[background-color,box-shadow]` or similar explicit properties.

| Page/Component | Priority |
|----------------|----------|
| `HeroBlock.vue:47,65` | **Low** (minor perf, noticeable only on many re-renders) |
| `auth.vue:13` tab toggle | **Low** |

---

### 3.5 Contextual Icon Animation

**Issue:** No icon swap uses cross-fade animation — icons snap instantly.

**Affected:**

- **`NotificationBell.vue:28-29`**: `PhBellRinging` ↔ `PhBell` swaps via `v-if`/`v-else` — no animation.
- **`BottomTabBar.vue:14-18`**: Active tab icon just changes color class — no transition.
- **`auth.vue:84`**: Eye icon toggle (`PhEye` ↔ `PhEyeClosed`) — no animation.

**Suggestion:** For the NotificationBell, use the CSS cross-fade pattern from the skill (both icons in DOM, absolutely positioned, transition scale/opacity/filter). For tab icons, a color class swap with `transition-colors` is sufficient.

| Page/Component | Priority |
|----------------|----------|
| `NotificationBell.vue` icon swap | **Low** (functional, not cosmetic) |
| `auth.vue` eye icon toggle | **Low** |

---

## 4. Performance

### 4.1 `will-change` Missing on Animated Elements

**Issue:** Elements that animate on every user interaction (scale on press) don't hint the browser to promote their compositing layer.

**Affected:** All buttons with `active:scale-[0.96]` — the button gets promoted on first press, causing potential micro-stutter on first interaction. Safari is most affected.

**Suggestion:** Add `will-change: transform` to frequently-pressed interactive elements. Best as a utility class:

```css
.will-change-transform {
  will-change: transform;
}
```

Apply to high-frequency buttons (tab bar, hero buttons, auth buttons).

| Page/Component | Priority |
|----------------|----------|
| `BottomTabBar.vue` buttons | **Low** (first-press micro-stutter only) |
| `onboarding.vue` button | **Low** |

---

### 4.2 `transition: all` — Performance

(Already covered in 3.4 — `transition-all` vs specific properties.)

---

## 5. Summary

### Quick Wins (High Priority, Low Effort)

| # | Issue | Change |
|---|-------|--------|
| 1 | Font smoothing | Add `-webkit-font-smoothing: antialiased` to `main.css` |
| 2 | Image outlines | Add `outline-black/10 -outline-offset-1` to all `<img>` |
| 3 | Scale value | Replace `active:scale-[0.98]` → `active:scale-[0.96]` globally |

### Medium Effort (Medium Priority)

| # | Issue | Change |
|---|-------|--------|
| 4 | Tabular numbers | Add to participant counts, badge, balance, like counts |
| 5 | Enter animations | Stagger `index.vue` and `cook.vue` sections |
| 6 | Exit animations | Add `<transition>` to `ActionBlockedModal` and bottom sheets |
| 7 | Shadow over borders | Replace depth borders on `HeroBlock.vue` buttons |

### Future / Nice-to-Have (Low Priority)

| # | Issue | Change |
|---|-------|--------|
| 8 | Concentric radius | Adjust `HeroBlock.vue` and `RecipeCard.vue` outer radius |
| 9 | Icon cross-fade | Animate `NotificationBell.vue` icon swap |
| 10 | `will-change` | Add to high-frequency interactive elements |
| 11 | Optical alignment | Adjust icon padding on buttons |
| 12 | `text-wrap` properties | Add `text-balance` and `text-pretty` globally |
