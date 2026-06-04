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
- [x] Auth browser warnings fixed — Transition → v-show, autocomplete + name attributes
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
- [x] **Profile page** — `pages/profile.vue` с аватаром, табами, списками рецептов
- [x] **Home header** — обновлён с кликабелным профилем, аватаром и колокольчиком
- [x] **`app.vue` layout** — iPhone frame, Dynamic Island, safe area, скролл
- [x] **Floating BottomTabBar** — пилюля, backdrop-blur, абсолютное позиционирование
- [x] **HeroBlock.vue** — 3 состояния: загрузка, повар назначен, пусто
- [x] **RecipeCard.vue** — карточка блюда с skeleton и моковыми данными
- [x] **BalanceWidget.vue** — запрос баланса из Directus коллекции balances
- [x] **DutyWidget.vue** — виджет ближайшего дежурства
- [x] **Home screen** — полный экран: HeroBlock, счётчик участников, BalanceWidget + DutyWidget в сетке, поиск, RecipeCard с моковыми данными

## Known issues
- **Sign Up работает** через серверный прокси (`server/api/auth/signup.post.ts`) — создаёт юзера через админ-токен
- **CORS на Directus** — включён (`CORS_ENABLED`, `CORS_ORIGIN: http://localhost:3000`)
- **Balance и Today's Cook** на index.vue — заглушки (€0.00 / —). Будут наполняться после настройки Directus коллекций
- **RecipeCard, HeroBlock, BalanceWidget** и другие переиспользуемые компоненты ещё не созданы
- **Nuxt 4 SPA краш** — `ssr: false` + `compatibilityVersion: 4` вызывает `No entry found in rollupOptions.input`. Лечится `experimental.viteEnvironmentApi: true`

## Next session — plan

### Phase 4: Feature Screens
**Goal:** Финальная вёрстка всех экранов по актуальной карте экранов.

- [x] Навигация (BottomTabBar) — 5 табов с новыми иконками, роуты под Phase 4, Admin-логика
- [x] Home screen — HeroBlock, кнопки «Я обедаю»/«Стать поваром», счётчик, BalanceWidget, DutyWidget, поиск, RecipeCard
- [x] HeroBlock.vue — 3 состояния (loading/cook/empty)
- [x] RecipeCard.vue — карточка с моковыми данными и skeleton
- [x] BalanceWidget.vue — запрос к balances через Directus
- [x] DutyWidget.vue — виджет дежурства
- [ ] Kitchen screen — очередь поваров, история блюд, поиск, оценки
- [ ] AI Recipe — чат с AI, JSON-рендер рецепта, пересчёт порций
- [ ] Duty screen — календарь дежурств, подтверждение, автоназначение
- [ ] Common screen — складчины, объявления, голосования
- [ ] Cook Page — списание с баланса, чек, авторасчёт доли
- [ ] Recipe Detail — фото, ингредиенты, шаги, пересчёт порций
- [ ] Finance page — таблица балансов, алерты, история, отчёт
- [ ] Notifications — лента, быстрые действия
- [ ] Переиспользуемые компоненты: RecipeCard, HeroBlock, BalanceWidget, ParticipantCounter, DutyWidget

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
