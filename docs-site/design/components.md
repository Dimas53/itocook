# Components

## Buttons

- Height: `h-14` (56px) primary, `h-10` (40px) secondary
- Border radius: `rounded-2xl` (standard), `rounded-full` (pill)
- Font: `font-semibold text-[16px]`

| Variant | Classes |
|---|---|
| Primary filled | `bg-primary text-white` |
| Black filled | `bg-app-black text-white` |
| Yellow filled | `bg-secondary text-app-black` |
| Ghost / Outline | `border border-gray-200 bg-white text-app-black` |
| Tab toggle | `bg-app-black text-white rounded-full` active |

## Inputs

- Height: `h-12` (48px)
- Border radius: `rounded-xl`
- Border: `border border-gray-200`
- Focus: `focus:border-primary focus:ring-0`
- Background: `bg-white`
- Padding: `px-4`

## Cards

- Border radius: `rounded-2xl`
- Background: `bg-primary-light`, `bg-[#E8F5D0]` (green), `bg-secondary/20` (yellow)
- Shadow: `shadow-sm`
- Overflow: `overflow-hidden`

## Bottom Tab Bar

- Height: `h-[70px]`
- Background: `bg-white`
- Border top: `border-t border-gray-100`
- Icon size: `size-6` (24px)
- Active: `text-primary` or `bg-app-black text-white` (circle)
- Inactive: `text-gray-400`
- Tabs: Home, Kitchen, AI Recipe/Finance, Duty, Common

## Avatar / Badge

- Size: `w-10 h-10` (40px)
- Border radius: `rounded-full`
- Border: `ring-2 ring-primary`

## Icon Usage

| Context | Style | Size |
|---|---|---|
| Bottom navigation | `regular` → `fill` (active) | `size-6` (24px) |
| Inside cards / buttons | `fill` | `size-5` (20px) |
| Inline with text | `regular` | `size-4` (16px) |

## Mobile UX Constraints

- **No hover effects** — use `active:scale-[0.98] transition-transform` for tap feedback
- **Scroll inside screen frame** — `overflow-y-auto` with `scrollbar-hide`
- **All sizes in fixed px** (not `rem`) — mobile-only, no responsive breakpoints
- **Safe areas** — `pt-[60px]` top, `pb-[100px]` bottom
- **Section colors** alternate: purple → green → yellow → orange
