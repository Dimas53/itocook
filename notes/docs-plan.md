# ItoCook — Оставшийся план
> Составлен: 17 июнь 2026
> Статус: ~75% готово, всё работает, залито на git

---

## Блок 1: Оставшиеся фичи

### Сессия 1 — AI Recipe экран (`/ai-recipe`)
**Цель:** полноценный кулинарный чат с рендером рецепта

- [ ] Nuxt server route `POST /api/ai/chat` — проксирует запрос к OpenRouter API
    - Модель: `google/gemini-2.0-flash-lite`
    - Системный промпт: только кулинарные вопросы, ответ строго в JSON
    - Переменная `NUXT_OPENROUTER_API_KEY` в `.env`
- [ ] Чат-интерфейс: поле ввода + история сообщений (user / assistant)
- [ ] Рендер карточки рецепта из JSON-ответа:
    - Название, время приготовления, количество порций
    - Ингредиенты с emoji (переиспользовать `getIngredientIcon()` из `ingredientIcons.ts`)
    - Шаги приготовления
- [ ] Кнопка "Add to recipes" → создаёт черновик через `POST /items/recipes`
- [ ] Кнопка "Share shopping list" → `navigator.share()` с текстом ингредиентов
- [ ] Пересчёт порций: поле ввода → новый запрос с контекстом текущего рецепта
- [ ] Переиспользовать `AddIngredientPopover.vue` для ввода ингредиентов (опционально)

---

### Сессия 2 — Common экран (`/common`)
**Цель:** лента объявлений + пулы сборов

**Новые Directus коллекции (не существуют — создавать с нуля):**
- [ ] `announcements` — title, body, date_created, author (M2O→users), pinned (bool)
- [ ] `pools` — name, goal_amount, collected_amount, status (active/closed), created_by (M2O→users)
- [ ] `pool_contributions` — pool (M2O→pools), user (M2O→users), amount, date_created

**User Policy для новых коллекций:**
- `announcements` — Read all; Create/Update/Delete только Admin
- `pools` — Read all; Create/Update только Admin
- `pool_contributions` — Create own, Read own

**Frontend:**
- [ ] Лента объявлений (только Admin создаёт, все читают)
    - Пинированные объявления вверху
    - Дата + автор + текст
- [ ] Пулы сборов с progress bar (collected_amount / goal_amount × 100%)
- [ ] Кнопка "Participate" + поле суммы взноса → POST в `pool_contributions` + PATCH `pools.collected_amount`
- [ ] История закрытых пулов (status: closed)
- [ ] Admin: кнопка создания объявления + создания нового пула

---

### Сессия 3 (опционально до Phase 6) — мелкие доработки внутри существующих экранов
- [ ] Recipe Detail — шаги приготовления (steps в БД уже есть в JSON, в шаблоне не выведены)
- [ ] Cook Page — заглушка для upload фото чека (UI-only, без логики)
- [ ] Profile — статистика (сколько раз готовил, сколько раз дежурил)

---

## Блок 2: Рефакторинг (до документации)

**Почему сначала рефакторинг:**
Документировать раздутые файлы — двойная работа. После рефакторинга файлы становятся короче и понятнее, документировать проще.

**Скиллы:** `improve-codebase-architecture` + `zoom-out`

### Кандидаты на рефакторинг:

- [ ] `cook.vue` — 6 состояний (assign/dish/scheduled/cooking/ready/done) в одном файле.
  Идея: вынести каждое состояние в отдельный компонент `CookState*.vue`
  **Приоритет: высокий** — самый большой файл с самой сложной логикой

- [ ] `confirmDeduction()` в `cook.vue` — делает 5+ API вызовов подряд:
  fetch orders → POST transactions × N → PATCH balances × N → PATCH cook_queue → DELETE shopping_list_items.
  Идея: вынести в отдельный composable `useDeduction.ts` или server route
  **Приоритет: высокий** — критическая бизнес-логика, должна быть изолирована

- [ ] `recipe/[id].vue` — смешаны: отображение рецепта, управление очередью, servings логика, like логика.
  Идея: вынести servings в `useServings.ts`, like в `useLikes.ts`

- [ ] `recipe/create.vue` — upload логика, форма, prefill из истории всё в одном.
  Идея: prefill логику вынести в composable `useRecipePrefill.ts`

- [ ] `kitchen.vue` — WeekCalendar логика, HeroBlock, dish history в одном файле.
  Идея: вынести dish history в `DishHistory.vue`

- [ ] `finance.vue` — длинный файл, top-up форму можно вынести в `FinanceTopUp.vue`

**Промпт для агента (анализ — без изменений):**
```
Read AGENTS.md. Apply improve-codebase-architecture skill.

Analyze the following files for refactoring opportunities:
- frontend/app/pages/cook.vue
- frontend/app/pages/recipe/[id].vue
- frontend/app/pages/recipe/create.vue
- frontend/app/pages/kitchen.vue
- frontend/app/pages/finance.vue

Pay special attention to confirmDeduction() in cook.vue —
it makes 5+ sequential API calls and should likely be extracted.

For each file:
1. Apply zoom-out skill — explain what this file does in the context of the whole system
2. Count approximate lines and identify what logic can be extracted
3. Propose a concrete refactoring plan with new file names
4. Do NOT make any changes yet — only analysis and proposal

Read docs/design.md before analyzing components.
Read notes/itocook-full-overview.md for system context.
After analysis, save findings to docs/audits/refactoring-plan.md
Update docs/progress.md with a summary line.
```

---

## Блок 3: Безопасность

**Скилл:** `security-and-hardening`

### Что проверить:

**Критичные точки (из анализа схемы):**
- [ ] `confirmDeduction()` в `cook.vue` — читает orders ВСЕХ участников через user токен или admin proxy?
  Если user токен — потенциальная дыра (User Policy на orders стоит Read own)
- [ ] `balances` и `transactions` — Create/Update через admin proxy правильно,
  но валидируют ли server routes что запрашивающий пользователь залогинен?
- [ ] `directus_users` — User Policy читает какие поля других пользователей?
  Нельзя чтобы обычный юзер видел email/password/role других

**Остальное:**
- [ ] Server routes — все ли привилегированные операции проксируются через `server/api/`?
- [ ] Admin credentials — нигде не утекают в клиентский код?
- [ ] Токен в cookie — правильные флаги (httpOnly, secure, sameSite)?
- [ ] CORS настройки в docker-compose — не слишком открыты для prod?
- [ ] `shopping_list_items` — Read own стоит, но проверить что фильтр реально применяется
- [ ] `pool_contributions` (когда создашь) — аналогично Read own

**Промпт для агента:**
```
Read AGENTS.md. Apply security-and-hardening skill.

Perform a security audit of the ItoCook project.

Priority checks:
1. cook.vue confirmDeduction() — does it read other users' orders via user token
   or admin proxy? Check if User Policy "Read own" on orders blocks this.
2. All server/api/ routes — do they validate that the requesting user is authenticated
   before using admin credentials?
3. directus_users User Policy — which fields of other users are readable?
   Email, role, department should be restricted.
4. Cookie configuration for directus_token in useDirectus.ts
   (httpOnly, secure, sameSite flags)
5. CORS settings in docker-compose.yml

Use Directus MCP to check actual permission settings.
Read all files in server/api/ folder.

Report findings as prioritized list: Critical / High / Medium / Low.
Do NOT fix anything yet — only report.
Save report to docs/audits/security-audit.md
Update docs/progress.md with a summary line.
```

---

## Блок 4: Документация

**Порядок важен:** сначала рефакторинг → безопасность → потом документировать чистый код

### Шаг 4.1 — CONTEXT.md (доменный глоссарий)
**Скилл:** `grill-with-docs`
**Что это:** словарь терминов проекта. После этого агент говорит на одном языке с тобой каждую сессию.

**Термины для фиксации (предварительный список):**
- `fork-on-cook` — когда повар готовит чужой рецепт, создаётся форк (копия с `forked_from`)
- `cook_queue` — расписание готовки, одна запись = один обед одного дня
- `confirmed order` — запись в `orders` со статусом `confirmed` = участник подтвердил участие
- `ghost participant` — участник вышел после 11:00, но остаётся в split при deduction
- `balance gate` — блокировка Join/Become Cook при балансе < -30€
- `deduction` — списание доли стоимости обеда с каждого участника после confirmDeduction()
- `pasta packages` — дополнительная стоимость (пакеты пасты) сверх суммы чека
- `entry cook` — повар конкретной записи в cook_queue (≠ "сегодняшний повар" глобально)
- `recipe cook` vs `entry cook` — `recipes.cook` может не совпадать с `cook_queue.cook` после форка
- `assignAsCook` — функция назначения себя поваром + автоматический join (создание confirmed order)
- `source_cook_queue` — M2O связь рецепта с очередью, из которой он был создан
- `completed` — финальный статус cook_queue после успешного confirmDeduction()
- `dedup` — дедупликация рецептов по dish_name (показываем только последний форк или оригинал)

**Промпт:**
```
Read AGENTS.md. Apply grill-with-docs skill.

I want to create docs/CONTEXT.md — a domain glossary for ItoCook project.

Start by reading these files for context:
- notes/itocook-full-overview.md
- docs/progress.md
- frontend/app/pages/cook.vue (focus on confirmDeduction and state machine)
- frontend/app/composables/useAuth.ts
- frontend/app/composables/useParticipants.ts

Then interview me about terms that are project-specific or non-obvious.
Start with terms that appear in multiple files but might mean different things
in different contexts (e.g. "cook" as a person vs "cook" as a field).

After the interview, create docs/CONTEXT.md with:
- Term name
- Definition (1-2 sentences)
- Which files/collections use this term
- Related terms

Update docs/progress.md after done.
```

---

### Шаг 4.2 — Комментарии в ключевых файлах
**Скилл:** `zoom-out`
**Правило:** по 1-2 файла за сессию, не всё сразу

**Приоритетный список (в порядке важности):**

1. `frontend/app/composables/useDirectus.ts` — HTTP клиент, сердце всего API
2. `frontend/app/composables/useAuth.ts` — аутентификация, login/signup/middleware
3. `frontend/app/pages/cook.vue` — state machine + `confirmDeduction()` особенно
4. `frontend/app/composables/useDeduction.ts` — логика deduction, pasta cost, cleanup
5. `frontend/app/composables/useParticipants.ts` — join/leave логика
6. `frontend/app/composables/useBalanceCheck.ts` — balance gate
7. `frontend/app/composables/useMealCost.ts` — расчёт стоимости с pasta packages
8. `frontend/server/api/auth/signup.post.ts` — почему server route, не прямой API
9. `frontend/server/utils/adminToken.ts` — кэширование admin токена после security рефакторинга
10. `frontend/app/middleware/cook.ts` — middleware защищающая `/cook` роут
11. `frontend/app/utils/dedupRecipes.ts` — логика дедупликации форков
12. `frontend/app/utils/ingredientIcons.ts` — emoji dictionary + fuzzy match
13. `frontend/app/components/HeroBlock.vue` — 3 состояния, props/emits

**Промпт (использовать на каждый файл, менять [FILEPATH]):**
```
Read AGENTS.md. Apply zoom-out skill.
Read docs/CONTEXT.md first.

Analyze this file

1. Explain what this file does in the context of the whole ItoCook system
2. Identify non-obvious logic that needs explanation (business rules, edge cases, why decisions were made)
3. Add JSDoc comments to all exported functions/composables:
   - One-line summary of what it does
   - Why it exists / what problem it solves
   - Which Directus collections it reads/writes (if any)
   - Which other composables/components call it
   - Any important edge cases or gotchas
4. Do NOT rewrite any logic, only add comments
5. After changes, append 2-3 sentences about this file to docs/ARCHITECTURE.md
   under the appropriate section (create section if missing)

Update docs/progress.md after done.
```

---

### Шаг 4.3 — ARCHITECTURE.md + docs/architecture/ папка
**Основа:** перенести `notes/ItoCook_Architecture_Merged_Final.md` → `docs/ARCHITECTURE_Documentation.md`
**Скилл:** `improve-codebase-architecture`

**Структура:**
```
docs/
├── ARCHITECTURE_Documentation.md          ← high-level обзор (max 2 страницы), ссылки на всё
├── CONTEXT.md               ← глоссарий терминов
└── architecture/
    ├── auth-flow.md         ← login, token, middleware, server routes
    ├── cook-queue.md        ← очередь, state machine, fork-on-cook
    ├── finance.md           ← балансы, транзакции, deduction логика
    ├── recipe-system.md     ← рецепты, форки, фото upload, лайки, dedup
    ├── shopping-list.md     ← список покупок, автоочистка при confirm/cancel
    ├── duty.md              ← дежурства, MonthCalendar, admin edit
    └── ai-recipe.md         ← (добавить когда сделаешь AI экран)
```

**Промпт:**
```
Read AGENTS.md. Apply improve-codebase-architecture skill.
Read docs/CONTEXT.md first.
Read docs/ARCHITECTURE.md.

Task: Create the documentation structure for ItoCook.

Step 1: Create docs/ARCHITECTURE_Documentation.md
- Use notes/ItoCook_Architecture_Merged_Final.md as a base
- Update to reflect current state (read docs/progress.md for what changed)
- Keep it short — max 2 pages, high-level overview only
- Include: tech stack, key architectural decisions, data flow diagram (text/ASCII),
  links to docs/architecture/ files

Step 2: Create docs/architecture/ folder with these files.
For each file include:
- What this feature does (user-facing)
- Which Directus collections it uses and how
- Which composables/pages are involved
- Key design decisions and WHY (not just what)
- Known edge cases or limitations

Files to create:
- auth-flow.md
- cook-queue.md (include state machine diagram, fork-on-cook explanation)
- finance.md (include deduction flow step by step)
- recipe-system.md (include dedup logic, fork pattern)
- shopping-list.md (include auto-cleanup triggers)
- duty.md

Do NOT touch any source code files.
Update docs/progress.md after done.
```

---


**Промпт 4.3.1:**
```
Read AGENTS.md.
Read docs/CONTEXT.md first.

Add JSDoc comments to ALL remaining files in the project that don't already
have them. Skip files from this list (already documented in priority pass):
- frontend/app/composables/useDirectus.ts
- frontend/app/composables/useAuth.ts
- frontend/app/pages/cook.vue
- frontend/app/composables/useDeduction.ts
- frontend/app/composables/useParticipants.ts
- frontend/app/composables/useBalanceCheck.ts
- frontend/app/composables/useMealCost.ts
- frontend/server/api/auth/signup.post.ts
- frontend/server/utils/adminToken.ts
- frontend/app/middleware/cook.ts
- frontend/app/utils/dedupRecipes.ts
- frontend/app/utils/ingredientIcons.ts
- frontend/app/components/HeroBlock.vue

For each remaining file add:
- File-level comment: what it does, which collections it touches (if any)
- JSDoc on every exported function/composable/component

Do NOT rewrite any logic, only add comments.
Process files in this order: composables → utils → components → pages → server routes.
Do NOT touch pages/cook.vue, pages/recipe/[id].vue longer than 500 lines without
checking with the user first.

Update docs/progress.md after done.
```

---


### Шаг 4.4 — Дизайн-ревью (с Claude, не с агентом)
**Почему с Claude:** агент в терминале не видит UI визуально — только код.
Скинуть скриншоты всех экранов сюда и обсудить.

**Что смотреть:**
- Консистентность цветов, отступов, типографики (соответствие design.md)
- Пустые состояния (empty states) — есть на всех экранах?
- Читаемость на 390px
- Общий визуальный ритм — одинаково ли выглядят похожие элементы на разных экранах

---

## Блок 5: Phase 6 — Уведомления + Ghost логика
*(после презентации коллегам)*

### Task B' — Напоминание для "зависшего" cook_queue
- [ ] Граница "стадия идеи" vs "стадия готовки":
    - `assign/dish/scheduled` = идея, деньги не считаются
    - `cooking/ready/completed` = реальная готовка, деньги считаются
- [ ] Если запись зависла в `scheduled` дольше X часов → reminder повару
- [ ] Авто-отмена без последствий для баланса если не стартовал
- [ ] Реализация: Directus Flow (scheduled trigger) или FastAPI cron

### Task D — Ghost-participants / leave-join логика
**Сегодняшний обед (cooking уже стартовал):**
- [ ] Выход до 11:00 (>1ч до обеда в 12:00) → свободный выход, без списания
- [ ] Выход после 11:00 (<1ч) → ghost-маркер, участник остаётся в split
- [ ] Вход после 11:00 → флаг `pending_cook_approval` в orders

**Будущие дни (порог ~20:00 накануне):**
- [ ] До порога → свободный выход/вход
- [ ] После порога → только с разрешения повара

**Схема изменений в Directus:**
- [ ] Поле `status` в `orders`: добавить `left_late`, `pending_cook_approval`
- [ ] Поле `charged_pending` (bool) в orders
- [ ] В `confirmDeduction()` — учитывать ghost-участников в `participants.length`

### Notifications (Directus Flows + FastAPI)
- [ ] Email: "повар назначен на сегодня" (trigger: cook_queue status → scheduled)
- [ ] Email: "обед готов" (trigger: cook_queue status → ready)
- [ ] Утренний reminder 8:00–10:00 если повар не назначен (scheduled cron)
- [ ] Reminder при минусовом балансе (< -10€)
- [ ] Reminder о дежурстве (за 12ч и в 9:00)
- [ ] Настройки уведомлений в Profile (push/email toggle)

---

## Блок 6: IHK Abschlussprojekt — документация для сдачи

### VitePress сайт (после Блока 4)
- [ ] Установить VitePress (родной для Vue/Nuxt стека)
- [ ] Взять `docs/` папку как основу контента
- [ ] Деплой на GitHub Pages (бесплатно)
- [ ] Навигация: Overview → Architecture → Features → API Reference

### IHK-специфичные документы
- [ ] Ist-Analyse — текущее состояние процесса до приложения
- [ ] Soll-Konzept — что делает приложение, как решает проблему
- [ ] Wirtschaftliche Betrachtung — обоснование (время разработки, потенциальная выгода)
- [ ] Gantt-диаграмма — план разработки по фазам
- [ ] Testkonzept — как тестировалось (ручное + E2E сценарии)
- [ ] UML-диаграммы:
    - Классовая / компонентная (ключевые composables и их связи)
    - Диаграмма последовательности: login flow, deduction flow
- [ ] Fazit — выводы, что получилось, что бы сделал иначе

---

## Порядок сессий (итого)

| # | Сессия | Блок | Скиллы |
|---|--------|------|--------|
| 1 | AI Recipe экран | Блок 1 | `incremental-implementation`, `nuxt` |
| 2 | Common экран | Блок 1 | `planning-and-task-breakdown`, `directus` |
| 3 | Мелкие доработки (steps, статистика) | Блок 1 | — |
| 4 | Рефакторинг — анализ | Блок 2 | `improve-codebase-architecture`, `zoom-out` |
| 5 | Рефакторинг — реализация | Блок 2 | `incremental-implementation` |
| 6 | Безопасность | Блок 3 | `security-and-hardening` |
| 7 | CONTEXT.md | Блок 4.1 | `grill-with-docs` |
| 8–9 | Комментарии в коде | Блок 4.2 | `zoom-out` (2 файла за сессию) |
| 10 | ARCHITECTURE.md + docs/architecture/ | Блок 4.3 | `improve-codebase-architecture` |
| 11 | Дизайн-ревью | Блок 4.4 | с Claude (скриншоты) |
| 12 | VitePress сайт | Блок 6 | — |
| 13+ | Phase 6 — Notifications | Блок 5 | после презентации |
| 14+ | IHK документы | Блок 6 | — |


---
---
---
---




# ItoCook — Documentation Update Prompt
## Для агента: продолжить документацию (июнь 2026)

> Используй этот промпт когда нужно обновить документацию после нескольких сессий разработки.
> Всё описано пошагово — выполняй строго по порядку, один шаг за раз.

---

## Контекст

Read AGENTS.md first. Then read docs/progress.md and git log to understand what changed since the last documentation update.

```bash
git log --oneline --since="2026-06-19" | head -30
```

Also read these files before starting:
- `docs/CONTEXT.md` — domain glossary (your vocabulary for this project)
- `docs/ARCHITECTURE.md` — high-level overview
- `docs/architecture/` — per-feature architecture files
- `docs/design.md` — UI design system
- `notes/itocook-full-overview.md` — full code walkthrough

The project is ~80% complete. Since the last documentation session the following was added:
- Phase 6b: PWA + push notifications (iPhone ✅, Firefox ✅)
- Service Worker via `@vite-pwa/nuxt` with `generateSW` strategy
- `push_subscriptions` Directus collection + FastAPI `/send-push` endpoint
- `usePushNotifications.ts` composable
- New Directus Flows: Cook Cancelled, Nightly Notification Cleanup
- Nginx fix: regex `^(?!/cms/).*\.(js|css...)` to prevent Nuxt intercepting Directus admin JS
- `<link rel="manifest">` added to `app.head` in `nuxt.config.ts`
- Deploy improvements: `--build` flag in `deploy.yml`, `docker-compose.prod.yml`
- Duty calendar: clicking days in next/prev month now works
- Various bug fixes (see docs/progress.md for full list)

---

## Шаг 1 — Обновить CONTEXT.md

Apply skill: `grill-with-docs`

Add the following new terms to `docs/CONTEXT.md` (do not remove existing terms):

- `push_subscription` — a browser's Web Push subscription object (endpoint + keys) stored in Directus `push_subscriptions` collection; created when user grants notification permission on first login
- `VAPID` — Voluntary Application Server Identification; key pair used to authenticate push messages from our FastAPI server to Apple/Mozilla/Google push services
- `PWA` (Progressive Web App) — ItoCook installed as a standalone app on iPhone via "Add to Home Screen"; required for Web Push on iOS
- `Service Worker` — background script (`/sw.js`) generated by `@vite-pwa/nuxt`; intercepts push events and calls `push-handler.js` to show system notifications
- `generateSW` — Workbox strategy used in `nuxt.config.ts`; auto-generates `sw.js` at build time; alternative to `injectManifest`
- `navigateFallback` — Workbox option that intercepts ALL navigation requests; deliberately set to `null` in this project to prevent Directus `/cms/` routes from being hijacked by SW
- `Cook Cancelled Flow` — Directus Flow triggered when `cook_queue.status` changes to `cancelled`; notifies all active users
- `Nightly Cleanup Flow` — Directus CRON Flow (`0 3 * * *`) that deletes `notifications` records older than 7 days
- `duck_subscriptions` dedup — on re-login, `usePushNotifications` checks for existing endpoint in Directus before creating a new record to avoid duplicate push subscriptions per user

After updating, verify the file reads naturally — no broken formatting.
Update `docs/progress.md`: add line "Docs: updated CONTEXT.md with PWA/push terms".

---

## Шаг 2 — Обновить docs/architecture/

Apply skill: `improve-codebase-architecture`

### 2a. Создать или обновить `docs/architecture/notifications.md`

This file should cover the full notification system. Include:

**User-facing description:**
- In-app notifications (bell icon + `/notifications` page)
- Push notifications (system-level on iPhone and Firefox)
- How they work together: Directus Flow → creates `notifications` record + calls `/api/send-push`

**Directus collections:**
- `notifications` — fields, permissions (User: read own, update read field only)
- `push_subscriptions` — fields, how it's populated

**Composables and files:**
- `useNotifications.ts` — polling (20s), markAsRead, markAllAsRead
- `usePushNotifications.ts` — SW registration, `pushManager.subscribe()`, save to Directus
- `NotificationBell.vue` — unread badge, tap → `/notifications`
- `push-handler.js` — SW push event handler (show system notification, handle click)
- `server/api/push/vapid-key.ts` — returns VAPID public key to client
- FastAPI `api/app/main.py` `/send-push` endpoint — sends push via pywebpush

**All Directus Flows (list all 8):**
1. Cook Assigned — `cook_queue.items.update`, status → scheduled/cooking
2. Lunch Ready — `cook_queue.items.update`, status → ready
3. Balance Low — `balances.items.update`, amount < -10
4. Morning Reminder — CRON `0 8 * * 1-5`
5. Duty Reminder — CRON `0 9 * * 1-5`
6. Duty Assigned — `cleaning_schedule.items.create`
7. Cook Cancelled — `cook_queue.items.update`, status → cancelled
8. Nightly Notification Cleanup — CRON `0 3 * * *`

**Key design decisions and WHY:**
- No email — Directus Flows + in-app only (simpler, no SMTP setup)
- FastAPI for push sending — pywebpush library, separate from Directus
- VAPID keys in server `.env` — never exposed to client (only public key via `/api/push/vapid-key`)
- `navigateFallback: null` — prevents SW from intercepting Directus admin routes

**Known limitations:**
- Chrome desktop push: `AbortError: push service error` (FCM issue, low priority)
- Push only works from PWA (iPhone) or desktop Firefox — not from Safari browser tab

### 2b. Обновить `docs/architecture/cook-queue.md`

Add section at the end: "Cook Cancelled notification flow"
- When cook calls `cancelCooking()` in `cook.vue`: PATCH `cook_queue.status = cancelled`
- This triggers "Cook Cancelled" Directus Flow
- Flow notifies all active users via `notifications` collection + push

### 2c. Обновить `docs/ARCHITECTURE.md`

Add or update section "Phase 6b: PWA + Push Notifications" with:
- Brief description of what was added
- Reference to `docs/architecture/notifications.md`
- Note about nginx regex fix for Directus admin JS MIME types

After all architecture updates, run:
```bash
git diff --stat
```
to verify only docs files were changed. Update `docs/progress.md`.

---

## Шаг 3 — JSDoc комментарии в новых файлах

Apply skill: `zoom-out`

Add JSDoc comments to these files that were created since the last documentation pass.
Do NOT rewrite any logic — only add comments.

**Files to document:**

1. `frontend/app/composables/usePushNotifications.ts`
  - File-level comment: what it does, which Directus collection it writes to
  - JSDoc on `subscribe()`: params, what it does step by step, why `user.value?.id` is passed explicitly
  - JSDoc on `urlBase64ToUint8Array()`: why this conversion is needed for VAPID

2. `frontend/app/public/push-handler.js`
  - File-level comment: this runs in SW context, not in Vue app
  - Comment on `push` event listener: explain data parsing, fallback
  - Comment on `notificationclick`: explain `clients.matchAll` logic

3. `frontend/server/api/push/vapid-key.ts` (if exists)
  - File-level comment: why public key is served via server route (not hardcoded in client)

4. `frontend/app/components/NotificationBell.vue`
  - File-level comment: what it renders, where it's used
  - Comment on polling: why 20s interval

5. `frontend/app/pages/notifications.vue`
  - File-level comment: what page does
  - Comment on `ICON_MAP`: explain structure
  - Comment on `sortedNotifications`: why unread first

6. `frontend/app/composables/useNotifications.ts`
  - File-level: what it manages, polling strategy
  - JSDoc on each exported function

Process one file at a time. After each file, verify the app still builds.
Update `docs/progress.md` after all files done.

---

## Шаг 4 — Обновить server-pwa-deploy.md

File: `docs/server-pwa-deploy.md`

Read the current file. Update the following sections to reflect current state:

**Push Notifications status table** — change to:
```
| Component | Status |
|-----------|--------|
| VAPID keys in .env | ✅ |
| push_subscriptions collection | ✅ |
| FastAPI /send-push endpoint | ✅ |
| push-handler.js in app/public/ | ✅ |
| usePushNotifications.ts | ✅ |
| Firefox desktop | ✅ works |
| iPhone Safari PWA | ✅ works |
| Chrome desktop | ❌ push service error (FCM, low priority) |
| Directus Flows → /api/send-push | ✅ all 8 flows send push |
```

**Add to "Известные проблемы и решения" table:**
| user field missing in push_subscriptions | Directus Field Preset `$CURRENT_USER` alone is not enough — must pass `user: user.value?.id` explicitly in POST body | Fixed in usePushNotifications.ts |
| Read permission missing on push_subscriptions | User Policy had only Create, not Read — dedup check was returning 403 | Added Read permission in Directus |

**Add to lessons learned:**
```
- NEVER use navigateFallback in Workbox — it intercepts ALL navigation including /cms/
- user field must be passed explicitly when POSTing to push_subscriptions — $CURRENT_USER preset is for Directus UI forms only, not API calls
- push_subscriptions Read permission required — usePushNotifications checks for duplicates before saving
```

Update checklist at bottom:
```
[x] 15. Push notifications on iPhone ✅
[ ] 16. Chrome push — not working (FCM, low priority)
```

After updating, do NOT change anything else in the file.
Update `docs/progress.md`.

---

## Финальный шаг — Commit

After all steps are done:

```bash
git add docs/
git commit -m "docs: update CONTEXT, architecture/notifications, JSDoc for push/PWA, server-pwa-deploy"
git push
```

Verify: `git log --oneline -3` shows the commit.




==========================



---
---
# Правило для AGENTS.md — Периодическое обновление документации

> Добавить в раздел "Триггерные правила" или "Документация" в AGENTS.md

---

## Вставить в AGENTS.md:

```markdown
## Документация — триггеры обновления

### Автоматический вопрос после завершения фазы

После завершения любой из следующих задач агент **обязан** спросить пользователя:
> "Documentation update needed? I can update CONTEXT.md, architecture files, and JSDoc comments to reflect what was just built. Takes one focused session."

Триггеры (любой из):
- Завершена Phase или крупный блок (Phase 6, Phase 6b, Блок 1 и т.д.)
- Создана новая Directus коллекция
- Создан новый composable или server route
- Добавлен новый Directus Flow
- Изменена архитектура (новый паттерн, новая зависимость)
- Прошло более 5 коммитов с последнего docs-коммита (проверить: `git log --oneline docs/ | head -1` vs `git log --oneline | head -1`)

### Как проверить когда последний раз обновлялась документация

```bash
git log --oneline -- docs/ | head -3
```

Если последний docs-коммит старше 1 недели или отстаёт от HEAD более чем на 5 коммитов — предложить обновление.

### Что обновлять

При обновлении документации всегда в таком порядке:

1. **CONTEXT.md** — новые термины из последних фич (composables, flows, паттерны)
2. **docs/architecture/** — новые или изменённые architecture файлы
3. **JSDoc** — только новые файлы с прошлой сессии документирования
4. **docs/progress.md** — строка о том что документация обновлена
5. **Коммит:** `docs: update CONTEXT, architecture, JSDoc after [phase name]`

### Чего НЕ делать при обновлении документации

- Не менять логику — только комментарии и .md файлы
- Не трогать файлы которые уже задокументированы если логика в них не менялась
- Не делать docs-обновление и фичу в одной сессии — разные коммиты
- Не удалять существующие разделы в CONTEXT.md или ARCHITECTURE.md — только дополнять

### Файл с промптом для docs-сессии

Если нужен полный промпт для документирования — читай `docs/docs-update-prompt.md`.
Там пошаговые инструкции с учётом текущего состояния проекта.
Промпт обновляется после каждой крупной docs-сессии.
```
