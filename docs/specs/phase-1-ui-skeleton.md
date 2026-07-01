# Spec: Phase 1 — UI Skeleton

## Objective

Build a navigable iPhone-frame app with all screen layouts, design system, and fake auth. No backend, no real data — only UI. User should be able to open the app, swipe through onboarding, log in (fake), and see all 5 tab screens with placeholder content.

## Tech Stack

- Nuxt 4 (app/ directory structure)
- Tailwind CSS v3 with custom colour tokens (13 tokens)
- Jost font (headings) + system-ui (body)
- Phosphor Icons (`@phosphor-icons/vue`)
- TypeScript strict mode

## Commands

```bash
# Dev server
cd frontend && npm run dev

# Type check
cd frontend && npx vue-tsc --noEmit

# Lint
cd frontend && npm run lint
```

## Project Structure

```
frontend/
├── app/
│   ├── layouts/
│   │   └── default.vue       # iPhone frame + Dynamic Island + tab bar
│   ├── pages/
│   │   ├── index.vue          # Home (placeholder)
│   │   ├── auth.vue           # Login + registration layout
│   │   ├── onboarding.vue     # Welcome carousel
│   │   ├── kitchen.vue        # Kitchen tab (placeholder)
│   │   ├── profile.vue        # Profile tab (placeholder)
│   │   └── ...
│   ├── components/
│   │   └── BottomTabBar.vue   # 5-tab navigation
│   └── assets/css/
│       └── main.css           # Tailwind + custom tokens
├── nuxt.config.ts
└── tailwind.config.ts
```

## Code Style

```vue
<script setup lang="ts">
const isLoggedIn = ref(false)
</script>

<template>
  <div class="flex flex-col items-center px-16">
    <h1 class="text-h1 font-jost">Welcome</h1>
  </div>
</template>
```

- `<script setup lang="ts">` required on all pages/components
- No inline styles — Tailwind utility classes only
- All sizes in px (fixed iPhone frame, 393×852)
- No hover effects — use `active:scale-[0.98]` for tap feedback
- Phosphor Icons with `Ph` prefix (`PhHouse`, `PhSparkle`)

## Testing Strategy

None in this phase — UI skeleton only. Visual verification via browser.

## Boundaries

- **Always:** iPhone frame layout, Dynamic Island, safe areas, hide tab bar on auth/onboarding
- **Ask first:** Adding new npm dependencies, changing Tailwind config tokens
- **Never:** Real API calls, hardcoded user data beyond fake login, production env vars

## Success Criteria

1. App opens in iPhone frame (393×852) with Dynamic Island
2. Onboarding screen shows with navigation to auth
3. Auth screen has login form with validation, loading state, error display
4. Fake login redirects to Home
5. BottomTabBar shows 5 tabs with active/inactive styling
6. Tab bar hidden on `/onboarding` and `/auth`
7. Route protection blocks unauthenticated access

## Open Questions

None — phase complete.
