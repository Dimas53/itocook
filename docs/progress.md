# ItoCook — Progress Log

## Current status
- [x] Project structure set up (frontend/, api/, directus/)
- [x] Docker running (Nuxt + Directus + PostgreSQL)
- [x] iPhone frame layout (`layouts/default.vue`)
- [x] Onboarding screen — fully fixed (flex layout, TypeScript)
- [x] Auth screen — форма, валидация, ошибки, loading state
- [x] Tailwind CSS installed with custom config
- [x] Jost font imported, global styles in `main.css`
- [x] Phosphor Icons installed
- [x] Tailwind config full sync — all 13 color tokens registered
- [x] `auth-bg: '#EDE8FF'` added to tailwind + design.md
- [x] Auth screen refactored — auth-bg token, transparent inputs, rounded-xl, branding fixed
- [x] Auth input interaction states — bg-white/40, focus:bg-white, focus:border-primary
- [x] Nuxt config fixed — main.css uncommented, stale .nuxt cache cleared
- [x] `onboarding.vue` — `absolute inset-0` → `h-full`, добавлен `lang="ts"`
- [x] `components/BottomTabBar.vue` — 5 табов с Phosphor icons, активный/неактивный стиль
- [x] `default.vue` — таббар встроен, скрывается на /onboarding и /auth
- [x] `default.vue` — `darkStatus` invert раскомментирован
- [x] `composables/useDirectus.ts` — HTTP-клиент для Directus API
- [x] `composables/useAuth.ts` — реальный signUp/login/logout/fetchUser через Directus
- [x] `middleware/auth.global.ts` — проверка токена через GET /users/me
- [x] `auth.vue` — реальный Sign Up и Log In (без setTimeout, без фейка)
- [x] `index.vue` — вывод реальных данных пользователя (имя, email, баланс, роль)
- [x] `server/api/auth/signup.post.ts` — серверный прокси для регистрации через админа Directus
- [x] `docker-compose.yml` — CORS_ENABLED, CORS_ORIGIN, NUXT_DIRECTUS_ADMIN_EMAIL/PASSWORD
- [x] `nuxt.config.ts` — runtimeConfig для admin email/password + серверный directusUrl
- [x] **Role User назначается автоматически** при регистрации (через `signup.post.ts`)
- [x] **Directus MCP подключён** (http://localhost:8055/mcp) — агент может управлять схемой
- [x] **Chrome DevTools MCP подключён** (port 9222) — агент может инспектировать браузер
- [x] **`ssr: false`** на верхнем уровне, `experimental.viteEnvironmentApi: true` (фикс Nuxt 4 SPA падения)
- [x] **Динамический редирект** после логина: повар → `/cook`, иначе → Home
- [x] **Страница `/cook`** — базовая заглушка с кнопкой
- [x] **`cook_queue`** collection — дата, повар (M2O users), dish_name, статус
- [x] **`orders`** collection — юзер (M2O users), cook_queue (M2O cook_queue), статус
- [x] **`order_items`** collection — заказ (M2O orders), quantity
- [x] **`transactions`** collection — юзер (M2O users), amount, type, description, date
- [x] **`balances`** collection — юзер (M2O users), amount
- [x] **O2M alias-поля** — `cook_queue` → orders, `orders` → items

## Known issues
- **Sign Up работает** через серверный прокси (`server/api/auth/signup.post.ts`) — создаёт юзера через админ-токен
- **CORS на Directus** — включён (`CORS_ENABLED`, `CORS_ORIGIN: http://localhost:3000`)
- **Profile page** — отсутствует (нужно создать `pages/profile.vue`)
- **Layout safe areas:** `pt-[60px]` / `pb-[34px]` будут на каждой странице индивидуально (в `default.vue` ломают auth)
- **Balance и Today's Cook** на index.vue — заглушки (€0.00 / —). Будут наполняться после настройки Directus коллекций
- **7 из 10 экранов не созданы:** meal-plan, ai-recipe, journal, learning, profile, recipe/[id]
- **BottomTabBar готов,** остальные компоненты (RecipeCard, CategoryPill, MacroRing) ещё нет
- **Nuxt 4 SPA краш** — `ssr: false` + `compatibilityVersion: 4` вызывает `No entry found in rollupOptions.input`. Лечится `experimental.viteEnvironmentApi: true`

## Next session — plan

### Phase 4: Feature Screens (после схемы)
- [ ] Полноценный Home screen (поиск, категории, карточки рецептов)
- [ ] Создать остальные экраны: meal-plan, ai-recipe, journal, learning, profile, recipe/[id]
- [ ] Вспомогательные компоненты: RecipeCard, CategoryPill, MacroRing

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
