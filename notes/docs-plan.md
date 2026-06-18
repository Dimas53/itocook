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
After analysis, save findings to docs/refactoring-plan.md
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
Save report to docs/security-audit.md
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