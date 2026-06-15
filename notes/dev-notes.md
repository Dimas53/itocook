
Докер-окружение успешно развёрнуто и все сервисы работают:
Статус сервисов
- PostgreSQL (localhost:5432) ✅ Healthy
- Directus (localhost:8055) ✅ Запущен (перенаправление на логин - ожидаемо)
- FastAPI (localhost:8000) ✅
- Health check: {"status":"ok","service":"itocook-api"}
- Swagger UI: http://localhost:8000/docs
- Nuxt 4 Frontend (localhost:3000) ✅ Работает в dev-моде с HMR
  Что было сделано
1. Структура монорепозитория:
   itocook/
   ├─ frontend/          # Nuxt 4 приложение
   ├─ api/               # FastAPI микросервис
   ├─ directus/          # Расширения и загрузки Directus
   ├─ docker-compose.yml
   ├─ .env.example
   └─ .env
2. Ключевые файлы созданы:
- frontend/package.json + nuxt.config.ts (с поддержкой Nuxt 4 и модулем иконок)
- frontend/Dockerfile (режим dev с HMR через volumes)
- api/app/main.py (базовый /health эндпоинт)
- api/Dockerfile (с --reload для авто-перезапуска)
- docker-compose.yml (4 сервиса с правильными зависимостями)
- .env.example и .env (все необходимые переменные)
3. Проверка работоспособности:
- Все контейнеры собраны и запущены через docker compose up --build -d
- Health-check endpoints возвращают ожидаемые ответы
- Порты маппированы корректно (3000, 8000, 8055, 5432)
  Следующий шаг: Вы можете зайти в Directus по адресу http://localhost:8055 (логин: admin@itocook.com, пароль: admin) и начать настройку схемы базы данных согласно плану в docs/plan-main.md. Frontend уже готов к подключению к Directus через переменную NUXT_PUBLIC_DIRECTUS_URL=http://directus:8055.


Шаг 1: Создание мобильного фрейма (Отображение телефона)
Это то, с чего ты начнешь в новом чате. Вместо использования тяжелой PNG-картинки, мы заставим агента сделать красивую «песочницу»:

Создать в frontend/app.vue или в дефолтном лайауте контейнер на Tailwind CSS с фиксированными размерами мобильного экрана (например, 375px на 812px), скруглениями углов, рамкой и тенями.

Сделать так, чтобы весь контент будущих страниц (компоненты Nuxt 4) рендерился строго внутри этого «экранчика».

Шаг 2: Анализ готового и запуск MVP Фронтенда
Как только рамка телефона появится на экране localhost:3000:

Агент проанализирует референсы из твоей папки docs/design/ (где у тебя лежат скриншоты).

На основе этого анализа он начнет собирать первые реальные страницы внутри нашего «телефона»: сначала страницу авторизации (Login), а затем главный Dashboard приложения ItoCook.

На этом этапе всё будет работать на моках (временных данных), используя шрифт Jost и иконки Phosphor.

Шаг 3: Переход к бэкенду и Directus
Когда визуально фронтенд оживёт, и ты сможешь пощелкать первые кнопочки на экране мобильника:

Мы вернемся к Directus (localhost:8055), где ты уже ввел данные владельца.

Попросим агента спроектировать структуру таблиц базы данных (Пользователи, События/Обеды, Расходы/Сплит-чеки) согласно docs/plan-main.md.

Ты накликаешь эти таблицы в админке, и мы начнем связывать фронтенд с реальной базой.



---

/plan

Before anything else, read these files in order:
1. docs/design.md
2. docs/plan-main.md
3. docs/progress.md

Then do a full project analysis:
- Look at the actual file structure (frontend/pages/, frontend/components/, frontend/layouts/)
- Check what screens exist and their current state
- Identify what's missing, what's broken, what needs refactoring
- Check if tailwind config has all color tokens from docs/design.md Section 3
- Check if AGENTS.md rules are being followed in existing code

After analysis:
1. Give me a summary of current project state
2. Update docs/progress.md with accurate current status
3. Suggest the next logical step to work on

Do not write any code yet — analysis and planning only.




Анализ отличный, ты супер детально всё раскопал. Молодец, что заметил хвосты от ekilu и проблемы с Tailwind.

Но давай мыслить более крупными мазками. Мне нужен от тебя полноценный технический план на ближайший спринт, а не просто фикс цветов.

Сделай следующее прямо сейчас СВОИМИ ИНСТРУМЕНТАМИ (у тебя есть разрешение на правку файлов документации):

1. Запиши весь этот детальный аудит проекта в файл docs/progress.md в раздел "Known issues" (чтобы мы не потеряли этот список багов).
2. В этом же файле docs/progress.md в разделе "Next session — plan" сформируй архитектурный план разработки приложения на базе твоего анализа. Объедини мелкие фиксы в крупные логические этапы (например: Этап 1: Стабилизация UI-Kit и Tailwind конфига. Этап 2: Создание базового Layout и глобальной навигации. Этап 3: Завершение авторизации и т.д.).

Как только обновишь файл docs/progress.md — покажи мне итоговую крупноблочную дорожную карту (Roadmap) здесь в чате. Код проекта пока не трогай, только файлы документации.




=================================

# Duty Feature — Full Plan (Session 1 + Session 2)

---

# SESSION 1: Schema + Department Field + DutyWidget

Read `docs/progress.md`, `docs/design.md` and `AGENTS.md` before starting.
Complete and commit each task separately before moving to the next.

---

## Task 1 — Add `department` field to users + Directus schema

Use the Directus MCP to make these schema changes:

1. Add field `department` (type: string, nullable) to `directus_users` collection.

2. Create collection `cleaning_schedule` with these fields:
    - `date` (type: date, required)
    - `user` (type: M2O → directus_users, required)
    - `department` (type: string, required)
    - `confirmed` (type: boolean, default: false)

3. Set permissions for `cleaning_schedule`:
    - User policy: read all items (no filter)
    - User policy: update own items only (filter: user = $CURRENT_USER),
      only field `confirmed`
    - Admin policy: full CRUD

Commit: `feat(schema): add department field to users, create cleaning_schedule collection`

---

## Task 2 — Department selector in profile.vue

Move the department field to the top of the user info section in
`app/pages/profile.vue` — place it directly below the name/email block,
ABOVE the Preferences card (not at the bottom of the page).

**UI:**
- Label: `text-[11px] text-gray-400 mb-1` → "Department"
- Use `<select>` (not a text input) styled as:
  `bg-primary-pale text-app-black text-[13px] font-medium rounded-xl
  px-3 py-2 border-none outline-none w-full`
- Options (exact values, keep German names):
  `Buchhaltung, Vertrieb, IT-Security, Infrastruktur, Entwicklung, HR, MARKET, CONTR`
- First option: `<option value="">— Abteilung wählen —</option>` (disabled)
- On change: immediately PATCH `/users/me` with `{ department: selectedValue }`
  via existing `useDirectus` request()
- On mount: read `user.value.department` and pre-select matching option
- Wrapper: `bg-white rounded-2xl px-4 py-3 mx-5 mb-4`

Commit: `feat(profile): move department selector to top, use select dropdown`

---

## Task 3 — Create test users with departments via Directus MCP

Use the Directus MCP to create 6 test users. Do NOT create mock
cleaning_schedule entries — real users will be assigned manually later.

Create these users (POST /users as admin):

| first_name | last_name  | email          | department    | role        | password |
|------------|------------|----------------|---------------|-------------|----------|
| Klaus      | Müller     | u1@dev.com     | Entwicklung   | User        | 123456   |
| Anna       | Schneider  | u2@dev.com     | IT-Security   | User        | 123456   |
| Thomas     | Weber      | u3@dev.com     | Buchhaltung   | User        | 123456   |
| Sabine     | Fischer    | u4@dev.com     | Vertrieb      | User        | 123456   |
| Michael    | Bauer      | u5@dev.com     | Infrastruktur | User        | 123456   |
| Laura      | Koch       | u6@dev.com     | HR            | User        | 123456   |

Role UUID for User: same UUID used elsewhere in the project
(check existing users or AGENTS.md for the correct UUID).

After creating users, also create `cleaning_schedule` entries for
the current 2 weeks (Jun 16–27 2026, weekdays only), one entry per day,
rotating through the new users. Set `confirmed: false` for future dates,
`confirmed: true` for past dates.

Commit: `chore(seed): create 6 test users with departments + cleaning_schedule entries`

## Task 4 — Update DutyWidget.vue

Rewrite `app/components/DutyWidget.vue` to show real data from `cleaning_schedule`.

**Data fetch (on mount):**
```
GET /items/cleaning_schedule
  ?filter[date][_gte]=YYYY-MM-DD  (today)
  &filter[date][_lte]=YYYY-MM-DD  (end of current week, Friday)
  &fields=date,department,confirmed,user.id,user.first_name,user.last_name
  &sort[]=date
  &limit=10
```

**What to display:**

Top line (caption, gray-500, text-[11px]):
"This week: {department of this week}"
(take department from the first entry of the week)

Middle line (title, app-black, text-[14px] font-semibold):
If today has an entry → show full name of assigned user
If no entry today → "No duty assigned"

Bottom line (caption):
- If today's entry user === current user:
  Show "🧹 Your turn today!" in `text-primary font-medium`
- If today's entry exists but it's someone else:
  Show "Today, 12:00" in gray-400
- If next duty for current user exists this week:
  Show "Your next duty: {weekday}" in gray-400

**Highlight:**
If today's entry user === current user:
Widget background changes to `bg-primary-pale` (was `bg-green-pastel`)

Keep the same outer wrapper size and padding as current DutyWidget.

Commit: `feat(duty): update DutyWidget with real cleaning_schedule data`

---
---

# SESSION 2: Full Duty Page

Read `docs/progress.md`, `docs/design.md` and `AGENTS.md` before starting.
Complete and commit each task separately before moving to the next.

---

## Task 5 — Today's duty block (top of duty.vue)

Build the top section of `app/pages/duty.vue`.

**Data fetch (on mount):**
```
GET /items/cleaning_schedule
  ?filter[date][_eq]=TODAY
  &fields=date,department,confirmed,user.id,user.first_name,user.last_name
  &limit=1
```

**UI — "On duty today" card:**
Wrapper: `bg-white rounded-2xl mx-5 mt-4 px-4 py-4 shadow-sm`

If entry exists:
- Top label: `text-[11px] text-gray-400 uppercase tracking-wide` → "On duty today"
- Department pill: `bg-primary-pale text-primary text-[12px] font-medium
  rounded-full px-3 py-1` → department name
- Name: `text-[20px] font-semibold text-app-black mt-1` → full name
- If entry.user.id === current user AND confirmed === false:
  Show button "✓ Confirm Duty" → `bg-primary text-white h-10 rounded-xl
  w-full mt-3 text-[14px] font-semibold`
  On click: PATCH `/items/cleaning_schedule/{id}` → `{ confirmed: true }`
  After confirm: button changes to "✓ Confirmed" in `bg-green-pastel
  text-green-700`, disabled
- If entry.user.id === current user AND confirmed === true:
  Show "✓ Confirmed" badge, no button
- If entry.user.id !== current user:
  No button, just info

If no entry today:
- Show "No duty assigned for today" in gray-400

Commit: `feat(duty): add today's duty block with confirm button`

---

## Task 6 — Monthly calendar (duty.vue)

Add a monthly calendar below the today block in `app/pages/duty.vue`.
Reuse the same grid layout as the date picker in `app/pages/recipes.vue`
(the "Pick a date to cook" bottom sheet) — same cell size, same grid structure,
but shown inline (not in a bottom sheet).

**Header:**
- Month + year: `text-[16px] font-semibold text-app-black`
- Prev/Next month arrows: `PhCaretLeft` / `PhCaretRight`, size-5, text-gray-400
- Show weekday labels row: Mon Tue Wed Thu Fri (no weekends)

**Calendar grid — weekdays only (Mon–Fri):**
Each cell `rounded-xl text-center py-2`:
- Default: `bg-white border border-gray-100 text-app-black`
- Today: `bg-primary text-white`
- Has entry (someone assigned): show dot indicator below the date number
  (4px circle, `bg-primary-light`)
- Entry is current user: `bg-primary-pale text-primary font-semibold`
- Entry confirmed: dot changes to `bg-green-400`
- Past date: `text-gray-300`

On cell tap: show a small popover below the cell with:
- Assigned user full name + department
- "Confirmed" badge if confirmed
- If Admin: show "Edit" button (see Task 7)

**Data fetch:**
```
GET /items/cleaning_schedule
  ?filter[date][_gte]=YYYY-MM-01  (first day of displayed month)
  &filter[date][_lte]=YYYY-MM-31  (last day of displayed month)
  &fields=date,department,confirmed,user.id,user.first_name,user.last_name
  &limit=100
```

Re-fetch when month changes.

Commit: `feat(duty): add monthly calendar with cleaning_schedule data`

---

## Task 7 — Admin edit mode (duty.vue)

Add inline edit capability for Admin users in `app/pages/duty.vue`.

**Condition:** only show edit UI if `user.value.role !== USER_ROLE_UUID`
(same check used in BottomTabBar for Finance tab).

**Edit flow:**
When Admin taps a calendar cell:
- Popover shows existing assignment (or "No assignment")
- Plus an "Edit" button
- On "Edit" tap: popover expands to show:
    - Department `<select>` (same 8 departments as in profile.vue)
    - User `<select>` — fetch users list via existing `/api/users/list`
      Nuxt server route, filter shown users by selected department
      (client-side filter: `users.filter(u => u.department === selectedDept)`)
    - "Save" button

On Save:
- If entry exists for that date: PATCH `/items/cleaning_schedule/{id}`
  with `{ user: userId, department: dept, confirmed: false }`
- If no entry exists: POST `/items/cleaning_schedule`
  with `{ date, user: userId, department: dept, confirmed: false }`
- Close popover, re-fetch calendar data for current month

Commit: `feat(duty): add admin edit mode for cleaning_schedule assignments`

---

## After all tasks (Session 2):
- Update `docs/progress.md` with full summary of all duty feature changes
- Final commit if anything left uncommitted:
  `feat(duty): complete duty page — today block, calendar, admin edit`


