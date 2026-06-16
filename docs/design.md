# ItoCook — Design System Spec (Mobile MVP)

> This file is the single source of truth for all UI decisions.
> Always read this file before generating any component or screen.

---

## 1. Device Geometry (Viewport)

| Parameter | Value |
|---|---|
| Target device | iPhone 17 Pro (mockup) |
| Screen width | `390px` |
| Screen height | `844px` |
| Outer frame border radius | `rounded-[50px]` |
| Inner screen border radius | `rounded-[40px]` |
| Safe area top (under Dynamic Island) | `pt-[60px]` |
| Safe area bottom (under Home Indicator) | `pb-[34px]` |
| Horizontal content padding | `px-5` (20px) |

---

## 2. Typography

**Font:** `Jost` — loaded via Google Fonts (visual replacement for Lufga, same geometric grotesque style)

| Role | Tailwind | px | Weight |
|---|---|---|---|
| Heading (screen titles) | `text-[36px]` | 36px | `font-bold` |
| Title (cards, sections) | `text-[20px]` | 20px | `font-semibold` |
| Body (main text) | `text-[14px]` | 14px | `font-normal` |
| Caption (secondary text) | `text-[12px]` | 12px | `font-normal` |

```css
/* Global font import */
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap');

* {
  font-family: 'Jost', system-ui, sans-serif;
}
```

---

## 3. Color Palette

| Name | HEX | Tailwind Token | Usage |
|---|---|---|---|
| Primary | `#8966FA` | `primary` | Buttons, active icons, accents (full saturation only) |
| Primary Light | `#D2C5FF` | `primary-light` | Card backgrounds, section fills (pastel purple) |
| Primary Pale | `#E4DEF9` | `primary-pale` | Lighter purple fills, Preferences block |
| Auth Background | `#EDE8FF` | `auth-bg` | Auth screen background, transparent input blend |
| Secondary | `#FFE100` | `secondary` | Active highlights only |
| Yellow Pastel | `#FFF9B2` | `yellow-pastel` | Meal Plan card backgrounds |
| Green Pastel | `#E1FFB0` | `green-pastel` | Lunch/Dinner card backgrounds |
| Green Light | `#CBFFCF` | `green-light` | Alternative green fills (Journal) |
| Orange Pastel | `#FFDE96` | `orange-pastel` | Shopping list widget background (items pending) |
| Orange Light | `#FFD9C1` | `orange-light` | Alternative orange fills |
| Black | `#0A0116` | `app-black` | Main text, dark element backgrounds |
| White | `#FFFFFF` | `white` | Card backgrounds, text on dark |
| Background | `#F5F5F8` | `app-bg` | General screen background |
| Muted Text | `#6B7280` | `gray-500` | Secondary text, labels |

```js
// tailwind.config.ts — extend colors
colors: {
  primary: '#8966FA',
  'primary-light': '#D2C5FF',
  'primary-pale': '#E4DEF9',
  'auth-bg': '#EDE8FF',
  secondary: '#FFE100',
  'yellow-pastel': '#FFF9B2',
  'green-pastel': '#E1FFB0',
  'green-light': '#CBFFCF',
  'app-black': '#0A0116',
  'app-bg': '#F5F5F8',
  'gray-500': '#6B7280',
  'orange-pastel': '#FFDE96',
  'orange-light': '#FFD9C1',
  white: '#FFFFFF',
}
```

---

## 4. UI Components

### Buttons

```
Height:        h-14 (56px) — primary action buttons
               h-10 (40px) — secondary / inside cards
Border radius: rounded-2xl (standard)
               rounded-full (pill buttons like "Get Started")
Font:          font-semibold text-[16px]
```

| Variant | Classes |
|---|---|
| Primary filled | `bg-primary text-white` |
| Black filled | `bg-app-black text-white` (Generate Recipe) |
| Yellow filled | `bg-secondary text-app-black` (Fill in Data) |
| Ghost / Outline | `border border-gray-200 bg-white text-app-black` |
| Tab toggle (Log In / Sign Up) | `bg-app-black text-white rounded-full` active, `text-gray-500` inactive |

### Inputs

```
Height:        h-12 (48px)
Border radius: rounded-xl
Border:        border border-gray-200
Focus:         focus:border-primary focus:ring-0
Background:    bg-white
Placeholder:   text-gray-400 text-[14px]
Padding:       px-4
```

### Recipe Cards

```
Border radius: rounded-2xl
Background:    bg-primary-light (purple variant)
               bg-[#E8F5D0] (green — Meal Plan)
               bg-secondary/20 (yellow)
Shadow:        shadow-sm
Overflow:      overflow-hidden
Image:         absolutely positioned, overflows card edge
```

### Bottom Tab Bar

```
Height:        h-[70px]
Background:    bg-white
Border top:    border-t border-gray-100
Icon size:     size-6 (24px)
Active:        text-primary or bg-app-black text-white (circle)
Inactive:      text-gray-400
Tabs:          Home, Meal Plan, AI Recipe, Journal, Learning
```

### Avatar / Badge

```
Size:          w-10 h-10 (40px)
Border radius: rounded-full
Border:        ring-2 ring-primary (user avatar)
```

---

## 5. Icons

**Package:** `@phosphor-icons/vue`

| Context | Style | Size |
|---|---|---|
| Bottom navigation | `regular` → `fill` (active tab) | `size-6` (24px) |
| Inside cards / buttons | `fill` | `size-5` (20px) |
| Inline with text | `regular` | `size-4` (16px) |

```vue
<script setup>
import { House, CalendarBlank, Sparkle, Notebook, Books } from '@phosphor-icons/vue'
</script>
```

---

## 6. Screen Inventory

| Screen | Route | Description |
|---|---|---|
| Onboarding | `/onboarding` | Purple background, 3D chef illustration, "Quick & Easy Recipes!" |
| Auth | `/auth` | Log In / Sign Up toggle, form fields, Apple sign-in |
| Home | `/` | Greeting, search bar, category pills, recipe cards |
| Recipe Detail | `/recipe/:id` | Hero image, macros, description, ingredient/instruction tabs |
| Meal Plan | `/meal-plan` | Personalization banner, Lunch/Dinner recipe cards |
| AI Recipe | `/ai-recipe` | Ingredient input tags, Generate button, history list |
| Journal | `/journal` | Calorie tracker, macro rings, meal cards (Breakfast/Lunch/Dinner) |
| Learning | `/learning` | Filter tabs (Nutrition/Sustainability/Fitness), article list |
| Profile | `/profile` | Avatar, Edit button, Preferences, My Lists / My Recipes tabs |

---

## 7. Mobile UX Constraints

- **No hover effects** — use `active:scale-[0.98] transition-transform` for tap feedback instead
- **Scroll inside screen frame** — `overflow-y-auto` with `scrollbar-hide` (no system scrollbars)
- **All sizes in fixed px** (not `rem`) — mobile-only app, no responsive breakpoints needed
- **Safe areas** — always `pt-[60px]` top (Dynamic Island), `pb-[100px]` bottom (tab bar + home indicator)
- **Overflow images on cards** — `overflow-visible` on card wrapper, `absolute` on `<img>`
- **Section background colors** alternate: purple → green → yellow → orange (see Journal, Learning screens)

---

## 8. Screen-Specific UI Patterns

### Home — recipe card
- Background: `bg-primary-light` (`#EDE8FF`)
- Dish image: circular, `absolute right-0 top-0`, overflows right edge of card
- Time badge: `bg-app-black text-white text-[12px] rounded-full px-3 py-1`
- "See Recipe" button: `bg-white rounded-full px-5 py-2 text-[14px] font-medium`

### Recipe Detail — hero zone
- Top half: `bg-primary-light` with dish centered on `radial-gradient` background
- Bottom half: white card with `rounded-t-3xl`, slides up over hero
- Macro cards: green (`bg-[#CCFF90]`) and purple (`bg-primary-light`)

### AI Recipe — ingredient input
- Ingredient tags: `bg-white border border-gray-200 rounded-full px-3 py-1 text-[13px]`
- Generate button: `bg-app-black text-white h-14 rounded-2xl w-full`
- Promo banner: gradient from white to `#FFE100`

### Learning — article cards
- Each card has a unique pastel background: purple, white, yellow, green
- Decorative circle pattern: `opacity-20` SVG layered behind content

---

## 9. File Structure (Frontend)

```
frontend/
├── assets/
│   └── css/
│       └── main.css       ← @import Jost + global styles
├── layouts/
│   └── default.vue        ← iPhone frame + Dynamic Island + <slot>
├── pages/
│   ├── index.vue          ← Home
│   ├── auth.vue
│   ├── onboarding.vue
│   ├── meal-plan.vue
│   ├── ai-recipe.vue
│   ├── journal.vue
│   ├── learning.vue
│   ├── profile.vue
│   └── recipe/
│       └── [id].vue
└── components/
    ├── BottomTabBar.vue
    ├── RecipeCard.vue
    ├── CategoryPill.vue
    └── MacroRing.vue
```