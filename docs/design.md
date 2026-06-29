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
| Safe area top (under Dynamic Island) | `calc(48px + env(safe-area-inset-top, 44px))` |
| Safe area bottom (under Home Indicator) | Desktop: `auto` (handled by BottomTabBar `bottom: 16px`); Mobile: `calc(70px + env(safe-area-inset-bottom, 0px))` |
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
Height:        h-[64px]
Background:    rgba(99, 73, 182, 0.71) with backdrop-filter: blur(2px)
Border radius: rounded-3xl
Position:      absolute, left-4 right-4, bottom-16px
Icon size:     size-5 (20px)
Active:        bg-white rounded-full w-12 h-12, text-app-black
Inactive:      text-white/80
Tabs:          Home (PhCookingPot), Kitchen (PhCalendarBlank), AI Recipe or Finance (PhSparkle/PhChartBar), Duty (PhBroom), Common (PhUsers)
Tab 3 swap:    Admin/Accountant role → shows Finance (PhChartBar) instead of AI Recipe (PhSparkle)
Hide on:       /profile, /cook, /auth, /onboarding
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
| Onboarding | `/onboarding` | Purple gradient bg, chef illustration, logo, auto-redirect after 2.5s |
| Auth | `/auth` | Log In / Sign Up toggle, form validation, password toggle, real Directus auth |
| Home | `/` | Greeting + avatar, HeroBlock (who's cooking), balance/duty widgets, recipe cards with like counts |
| Kitchen | `/kitchen` | Today's cook + HeroBlock, week calendar, dish history with search, "All Recipes" link |
| Cook Panel | `/cook` | State machine (assign→dish→scheduled→cooking→ready→done), receipt entry, deduction confirm |
| Recipe Detail | `/recipe/[id]` | Photo hero, servings scaling, ingredients with emoji, steps, status badges, Join/Start/Ready buttons, shopping list share |
| Recipe Create/Edit | `/recipe/create` | Photo upload (file/drag/paste), ingredient quick-pick popover, pasta packages, return-to support |
| All Recipes | `/recipes` | Search + category filter, RecipeCard grid with like counts, "Cook This" date picker |
| AI Recipe | `/ai-recipe` | Chat with AI, JSON recipe render (stub — not yet implemented) |
| Finance | `/finance` | Admin only. All balances (color-coded), manual top-up, transaction history slider, pasta price edit |
| Duty | `/duty` | Today's duty card with confirm button, monthly calendar (Mon-Fri), admin edit mode |
| Common | `/common` | Announcements, pool collections (stub — not yet implemented) |
| Profile | `/profile` | Avatar upload, name/department/preferences, balance + transactions, My List, My Recipes tabs, logout |
| Shopping List | `/shopping-list` | By Recipe / All Items tabs, check/uncheck, select-all, clear checked, auto-cleanup on deduction |
| Notifications | `/notifications` | Notification feed with icons per type, mark as read, mark all read, skeleton loading, empty state |

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
frontend/app/                     ← Nuxt 4 app directory
├── app.vue                       ← Phone frame + BottomTabBar + global participants modal
├── assets/css/main.css           ← Jost font + global styles + mobile layout overrides
├── components/
│   ├── BottomTabBar.vue          ← 5-tab nav bar with role-based Finance swap
│   ├── HeroBlock.vue             ← Today's cook card (3 states: loading/cook/empty)
│   ├── RecipeCard.vue            ← Recipe grid card with like count
│   ├── RecipeGridItem.vue        ← Smaller recipe item for /recipes grid
│   ├── RecipeImageUpload.vue     ← Photo upload with drag/drop/paste + client resize
│   ├── AddIngredientPopover.vue  ← Quick-pick ingredient bottom sheet
│   ├── MonthCalendar.vue         ← Reusable month grid (Mon-Fri) for duty + date picker
│   ├── WeekCalendar.vue          ← Horizontal week pills for kitchen page
│   ├── BalanceWidget.vue         ← Mini balance display for home page
│   ├── DutyWidget.vue            ← Upcoming duty card for home page
│   ├── ShoppingListWidget.vue    ← Cart icon + unchecked count for kitchen page
│   ├── NotificationBell.vue      ← Bell icon with unread badge
│   ├── ReceiptSummary.vue        ← Cost breakdown lines for cook panel
│   ├── SliderList.vue            ← Reusable translateY slider with touch support
│   ├── BalanceRow.vue            ← Single balance line for finance page
│   ├── TransactionRow.vue        ← Single transaction line for finance page
│   ├── AvatarPlaceholder.vue     ← SVG fallback when no avatar photo
│   └── ActionBlockedModal.vue    ← Blocked action explanation modal
├── composables/
│   ├── useDirectus.ts            ← Core HTTP client wrapping fetch
│   ├── useAuth.ts                ← Login/signup/logout/fetchUser
│   ├── useParticipants.ts        ← Meal participants state
│   ├── useParticipantsModal.ts   ← Global participant list modal
│   ├── useDeduction.ts           ← confirmDeduction + pasta cost + shopping cleanup
│   ├── useBalanceCheck.ts        ← Balance gate threshold check
│   ├── useMealCost.ts            ← Pasta package cost computation
│   ├── useRecipeImage.ts         ← Recipe photo or category fallback PNG
│   ├── useRecipeServings.ts      ← Serving scaling logic
│   ├── useLikes.ts               ← Recipe like/unlike
│   ├── useNotifications.ts       ← Poll + markAsRead + markAllAsRead
│   ├── usePushNotifications.ts   ← SW register + subscribe + VAPID
│   ├── useTotalUsers.ts          ← Total active user count
│   └── useSwipeDismiss.ts        ← Touch swipe-to-dismiss
├── layouts/
│   ├── app.vue                   ← Phone frame + Dynamic Island + tab bar + global modal
│   └── default.vue               ← Minimal layout for auth/onboarding (transparent status bar)
├── middleware/
│   ├── auth.global.ts            ← Route guard + token check + push subscribe
│   └── cook.ts                   ← Non-cancelled cook check, redirect to /cook if assigned
├── pages/
│   ├── index.vue                 ← Home
│   ├── auth.vue
│   ├── onboarding.vue
│   ├── kitchen.vue               ← Kitchen calendar + dish history
│   ├── cook.vue                  ← Cook panel state machine
│   ├── recipes.vue               ← All recipes with search + filter
│   ├── recipe/[id].vue           ← Recipe detail
│   ├── recipe/create.vue         ← Recipe create/edit form
│   ├── shopping-list.vue         ← Shopping list management
│   ├── notifications.vue         ← Notification feed
│   ├── duty.vue                  ← Duty calendar + admin edit
│   ├── finance.vue               ← Admin finance page
│   ├── ai-recipe.vue             ← AI chat (stub)
│   ├── common.vue                ← Announcements + polls (stub)
│   └── profile.vue               ← User profile + balance + lists
├── public/
│   ├── images/                   ← Static images (onboarding, categories, icons)
│   ├── icons/                    ← PWA icons (192x192, 512x512)
│   └── push-handler.js          ← Service Worker push event handler
└── utils/
    ├── dates.ts                  ← Shared date formatting functions
    ├── dedupRecipes.ts           ← Recipe deduplication by dish_name
    ├── format.ts                 ← User name formatting
    ├── ingredientIcons.ts        ← Emoji dictionary (130+ entries) + fuzzy matcher
    └── popularIngredients.ts     ← 35 popular ingredients with default units + categories

frontend/server/                   ← Nuxt server routes (admin proxy)
├── api/
│   ├── auth/signup.post.ts       ← Admin-proxy registration with rate limiting
│   ├── deduction/confirm.post.ts ← Admin-proxy deduction with transaction + balance
│   ├── duty/confirm.post.ts      ← Admin-proxy duty confirm
│   ├── duty/upsert.post.ts       ← Admin-proxy duty create/update
│   ├── notifications/read.patch.ts ← Admin-proxy batch mark-as-read
│   ├── push/vapid-key.get.ts     ← Public VAPID key
│   ├── settings/pasta-price.get.ts   ← Pasta package price
│   ├── settings/pasta-price.patch.ts ← Update pasta package price
│   ├── users/count.get.ts       ← Active user count
│   └── users/list.get.ts        ← All users list with departments
└── utils/
    ├── adminToken.ts             ← Cached admin token (23h TTL)
    └── auth.ts                   ← requireAuth helper
```