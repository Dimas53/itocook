# ItoCook — Roadmap

> Этот файл — крупная картина проекта. Мелкие шаги — в `docs/progress.md`.
> Агент читает этот файл в начале каждой сессии, чтобы понимать контекст и не уходить в детали не той фазы.

---

## Phase 1: UI-скелет ✅ 2026-06-02
**Goal:** можно открыть приложение, нажимать по экранам, видеть финальную верстку всех экранов. Без реальных данных — только UI.

### M1: UI Foundation & Design System ✅
- [x] Design system — токены, шрифты, Tailwind config
- [x] iPhone frame layout (`layouts/default.vue`), Dynamic Island
- [x] Onboarding screen — flex layout, TypeScript
- [x] Auth screen — базовая верстка
- [x] Tailwind config full sync — все 13 токенов
- [x] Nuxt config — main.css подключён

### M2: Layout & Global Navigation ✅
- [x] `components/` directory создана
- [x] `BottomTabBar.vue` — 5 табов, Phosphor icons, active/inactive
- [x] Таббар встроен в `default.vue`, скрыт на `/onboarding` и `/auth`

### M3: Core Authentication Flow ✅
- [x] auth.vue — форма, валидация, ошибки, loading state
- [x] Фейковый логин (хардкод пользователя)
- [x] Редирект после логина на Home
- [x] `darkStatus` — раскомментировать `invert` в layout
- [x] Защита роутов — редирект на `/auth` если не залогинен

---

## Phase 2: Первый живой flow ← ТЫ ЗДЕСЬ
**Goal:** Логин работает с реальным бэкендом, токен сохраняется, базовая сессия юзера тянется из Directus.

- [x] Настроить Directus SDK / HTTP-клиент как composable (`useDirectus`)
- [x] Переписать `useAuth` — слать реальный POST к Directus `/auth/login` и сохранять токен в куки
- [x] Настроить глобальный middleware на проверку живого токена через Directus (запрос к `/users/me`)
- [x] Вывести на главную страницу (`index.vue`) первые реальные данные из Directus: имя, email
- [x] Регистрация — через серверный прокси (admin API), роль User назначается
- [ ] Настроить динамический редирект после логина: если юзер — сегодняшний повар → Cook page, иначе → Home

---

## Phase 3: Directus Schema Setup
**Goal:** создать все коллекции через Directus MCP до начала вёрстки экранов. Schema-first подход.

- [ ] `cook_queue` collection (fields: date, cook user relation, dish name, status)
- [ ] `orders` collection (fields: user relation, cook_queue relation, status)
- [ ] `order_items` collection (fields: order relation, quantity)
- [ ] `transactions` collection (fields: user relation, amount, type, description, date)
- [ ] `balances` collection (fields: user relation, amount)

---

## Phase 4: Feature Screens
**Goal:** Финальная вёрстка всех страниц приложения, адаптированная сразу под реальную структуру данных из базы.

- [ ] Home screen — полноценная вёрстка (приветствие, поиск, категории, карточки)
- [ ] Остальные экраны: Meal Plan, AI Recipe, Journal, Learning, Profile, Recipe Detail (`recipe/[id].vue`)
- [ ] Вспомогательные компоненты: `RecipeCard.vue`, `CategoryPill.vue`, `MacroRing.vue`

---

## Phase 5: Core бизнес-логика
**Goal:** можно провести один полный рабочий день через приложение — от "кто готовит" до списания с баланса.
> Schema setup: use Directus MCP to create all collections before writing frontend code.
> Agent should read current schema first, then create: cook_queue, orders, order_items, transactions, balances.
- [ ] "Я готовлю сегодня" — запись в `cook_queue`, уведомление всем
- [ ] Выбор блюда — из истории или новое название
- [ ] "Я обедаю" — запись в `order_items`, отмена до 24ч
- [ ] "Обед готов" — статус меняется, уведомление участникам
- [ ] Ввод суммы чека → расчёт доли на участника
- [ ] Списание с баланса каждого участника → запись в `transactions`
- [ ] Баланс пользователя обновляется на Home screen

---

## Phase 6: FastAPI + уведомления
**Goal:** бизнес-логика вынесена в микросервис, уведомления работают автоматически.

- [ ] FastAPI endpoint: расчёт суммы на участника
- [ ] FastAPI endpoint: триггер уведомлений (email)
- [ ] Утренний reminder если повар не назначен (8:00–10:00)
- [ ] Уведомление "обед готов" участникам
- [ ] Алерт при отрицательном балансе (< −10 €)
- [ ] Reminder дежурства по кухне

---

## Phase 7: Дополнительные фичи
**Goal:** приложение удобно использовать каждый день, есть финансовый контроль.

- [ ] AI-ассистент (OpenRouter, `gemini-2.0-flash-lite`) — только кулинарные вопросы
- [ ] Рецепты — создание, редактирование, фото
- [ ] История блюд — список с поиском
- [ ] Пересчёт рецепта под новое количество участников
- [ ] Список покупок — из рецепта / вручную
- [ ] Анонимные оценки и отзывы на блюдо
- [ ] Календарь дежурств — просмотр для всех, редактирование для админа
- [ ] Finance page — все балансы и транзакции (admin/accountant)

---

## Phase 8: MVP-запуск
**Goal:** 10 коллег пользуются приложением неделю, собран фидбек.

- [ ] Тест-неделя с реальными пользователями
- [ ] Сбор фидбека
- [ ] UX-правки по результатам
- [ ] Мини-гайд для пользователей
- [ ] Полный доступ для бухгалтерии

---

## Опционально (после MVP)
- [ ] OCR чека — авто-считывание суммы с фото
- [ ] Добавление продуктов из чека в базу
- [ ] Интеграция с Recipe API
- [ ] Экспорт списка покупок
- [ ] Недельное голосование: лучшее блюдо / лучший повар
- [ ] Масштабирование: командировки, корпоративы, офисные закупки
