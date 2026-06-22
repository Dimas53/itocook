# Phase 6 — In-App Notifications + Ghost Logic
## ItoCook · Полный план с промптами

> Без email, без FastAPI. Только Directus Flows + коллекция notifications + Nuxt UI.
> Агент читает AGENTS.md в начале каждой сессии. MCP Directus доступен на http://localhost:8055/mcp

---

## Общая архитектура

```
Событие в Directus (create/update)
    → Flow срабатывает
        → Operation: Create Item в коллекции notifications
            → Nuxt читает /items/notifications?filter[user][_eq]=me&filter[read][_eq]=false
                → Колокольчик с бейджем в хедере
                    → Страница /notifications со списком
```

**Коллекция notifications:**
```
id, user (M2O → directus_users), type (string), message (string),
read (boolean, default false), date_created (auto)
```

**Типы уведомлений (type field):**
- `cook_assigned` — повар назначен на сегодня
- `lunch_ready` — обед готов
- `morning_reminder` — утреннее напоминание (никто не готовит)
- `balance_low` — баланс ушёл в минус ниже -10€
- `duty_reminder` — напоминание о дежурстве
- `cook_reminder` — повар завис в scheduled, пора стартовать (Task B')
- `join_pending` — кто-то хочет присоединиться после 11:00 (Task D)

---

## Шаг 0 — Schema: создать коллекцию notifications

**Сессия:** отдельная, короткая
**Скиллы:** `directus`, `planning-and-task-breakdown`

```
Read AGENTS.md first. Use skills: directus, planning-and-task-breakdown.

CONTEXT: ItoCook — Nuxt 4 + Directus 11 + PostgreSQL.
Directus MCP is available, use it for all schema operations.

TASK: Create the `notifications` collection in Directus via MCP.

Fields to create:
- id (auto, primary key) — already exists by default
- user — M2O relation to directus_users, required
- type — string (varchar), required. Allowed values: cook_assigned, lunch_ready, morning_reminder, balance_low, duty_reminder, cook_reminder, join_pending
- message — text (textarea), required
- read — boolean, default false
- date_created — datetime, auto-populated on create (use Directus built-in date_created special field)

Permissions (User policy — same UUID pattern as other collections):
- Read: filter user = $CURRENT_USER (users only see their own notifications)
- Update: filter user = $CURRENT_USER, fields: [read] only (can only mark as read)
- Create: DENY for User role (only Flows create notifications)
- Delete: DENY for User role

After creating the collection and permissions, verify by listing the collection fields via MCP.

Final step: update docs/progress.md with what was done.
```

---

## Шаг 1 — Directus Flows: основные триггеры

**Сессия:** отдельная
**Скиллы:** `directus`, `incremental-implementation`

> Создаём 4 Flow через MCP. Каждый Flow — отдельный Operation типа "Create Item".

```
Read AGENTS.md first. Use skills: directus, incremental-implementation.

CONTEXT: ItoCook. Directus MCP available at http://localhost:8055/mcp.
`notifications` collection exists with fields: user, type, message, read.
`cook_queue` has fields: cook (M2O → users), date, status, dish_name.
`orders` has fields: user (M2O → users), cook_queue (M2O → cook_queue), status.
`balances` has fields: user (M2O → users), amount (decimal).

TASK: Create the following Directus Flows via MCP. Create them one at a time, verify each before proceeding.

---

FLOW 1: "Cook Assigned"
Trigger: Event Hook — cook_queue.items.create
Condition: status in [scheduled, cooking]
Operation: Create Item in notifications
  Payload per each user (fetch all users with active status first, then create one notification per user):
  {
    "user": "{{each_user_id}}",
    "type": "cook_assigned",
    "message": "{{$trigger.payload.cook.first_name}} is cooking today — {{$trigger.payload.dish_name}}"
  }

Note: Directus Flow "Read Data" operation can fetch all active users first, then loop with "Create Item" for each.

---

FLOW 2: "Lunch Ready"
Trigger: Event Hook — cook_queue.items.update
Condition: status changed to "ready"
Operation: For each user who has an order linked to this cook_queue entry (status != cancelled):
  Create Item in notifications:
  {
    "user": "{{order.user}}",
    "type": "lunch_ready",
    "message": "Lunch is ready! Come grab your plate 🍽️"
  }

---

FLOW 3: "Balance Low"
Trigger: Event Hook — balances.items.update
Condition: amount < -10
Operation: Create Item in notifications:
  {
    "user": "{{$trigger.payload.user}}",
    "type": "balance_low",
    "message": "Your balance is below -10€. Please top up soon."
  }

---

FLOW 4: "Morning Reminder" (no cook assigned)
Trigger: Schedule — cron "0 8 * * 1-5" (08:00 Mon–Fri)
Operation chain:
  1. Read Data: fetch cook_queue where date = today AND status NOT IN [cancelled]
  2. Condition: if result is empty (no cook today)
  3. Read Data: fetch all active users
  4. For each user: Create Item in notifications:
     {
       "user": "{{user.id}}",
       "type": "morning_reminder",
       "message": "No cook assigned yet today. Who's stepping up? 🍳"
     }

---

After creating all 4 flows, do a quick manual test:
- Trigger Flow 3 by updating a balance to -15 via MCP
- Verify notification record appears in notifications collection

Final step: update docs/progress.md.
```

---

## Шаг 2 — Nuxt: useNotifications composable + колокольчик в хедере

**Сессия:** отдельная
**Скиллы:** `vue`, `nuxt`, `incremental-implementation`

```
Read AGENTS.md first. Use skills: vue, nuxt, incremental-implementation.

CONTEXT: ItoCook — Nuxt 4, SPA mode. Design system in docs/design.md.
Primary color: #8966FA. App uses useDirectus() composable for all API calls.
Icons: @phosphor-icons/vue (PhBell, PhBellRinging).
Notifications collection: GET /items/notifications?filter[user][_eq]=$CURRENT_USER&filter[read][_eq]=false&sort=-date_created

TASK: Implement notification bell in the app header and a useNotifications composable.

---

Step 1: Create app/composables/useNotifications.ts

```ts
// useNotifications.ts
// - fetchNotifications(): GET /items/notifications?filter[user][_eq]=userId&sort=-date_created&limit=20
// - markAsRead(id): PATCH /items/notifications/:id { read: true }
// - markAllAsRead(): PATCH all unread notifications for current user
// - unreadCount: computed from notifications where read === false
// - notifications: ref([])
// - loading: ref(false)
// Poll every 60 seconds using setInterval in a composable-level onMounted (use tryOnMounted from VueUse or plain onMounted)
// Stop polling on unmount
```

Step 2: Add notification bell to the header in app/layouts/app.vue (or wherever the header currently lives — check index.vue and kitchen.vue for header pattern)

The bell should appear in the top-right area of the screen header.
- PhBell icon when unreadCount === 0
- PhBellRinging icon when unreadCount > 0, with a small badge showing the count
- Badge: absolute positioned, bg-primary text-white, rounded-full, text-[10px], w-4 h-4
- Tap → navigate to /notifications

The header bell must be visible on all app layout pages (index, kitchen, duty, common, profile).
Check how the current header is structured — do NOT duplicate header code, find the right shared place.

Step 3: Do NOT create the /notifications page yet (that's next step).

Verify: run the app, check that bell renders in header, unread count shows correctly after manually creating a notification record via Directus admin.

Final step: update docs/progress.md.

---

## Шаг 3 — Страница /notifications

**Сессия:** отдельная
**Скиллы:** `vue`, `nuxt`, `frontend-ui-engineering`


Read AGENTS.md first. Use skills: vue, nuxt, frontend-ui-engineering.

CONTEXT: ItoCook — Nuxt 4, SPA mode. Design system in docs/design.md.
useNotifications composable exists. Notification types: cook_assigned, lunch_ready,
morning_reminder, balance_low, duty_reminder, cook_reminder, join_pending.
Layout: app layout with BottomTabBar. Phone frame 390px wide.

TASK: Create app/pages/notifications.vue

Design:
- definePageMeta({ layout: 'app' })
- Header: "Notifications" title (text-[36px] font-bold) + "Mark all read" button (text-primary, top right)
- If loading: skeleton cards (3 placeholder items, rounded-2xl bg-gray-100 animate-pulse)
- If empty: centered empty state — PhBellSlash icon (48px, text-gray-300) + "No notifications yet" (text-gray-400)
- List: each notification is a card

Card design per notification:
- bg-white rounded-2xl p-4 mb-3 shadow-sm
- Unread: left border-l-4 border-primary, bg-primary-pale/30
- Read: no border, bg-white, opacity-70
- Icon left (32px circle): color by type
  - cook_assigned → bg-green-pastel, PhCookingPot
  - lunch_ready → bg-yellow-pastel, PhForkKnife
  - morning_reminder → bg-primary-light, PhSun
  - balance_low → bg-red-50, PhWarning (text-red-500)
  - duty_reminder → bg-primary-pale, PhBroom
  - cook_reminder → bg-yellow-pastel, PhClock
  - join_pending → bg-green-light, PhUserPlus
- Message text: text-[14px] text-app-black
- Time: text-[12px] text-gray-400, relative ("2 min ago", "1h ago", "Yesterday") — implement simple timeAgo() utility
- Tap card → markAsRead(id)

On mount: fetchNotifications(), markAllAsRead() after 3 seconds of viewing

Final step: update docs/progress.md.


---

## Шаг 4 — Duty reminder Flow

**Сессия:** можно добавить в Шаг 1 или отдельно
**Скиллы:** `directus`


Read AGENTS.md first. Use skills: directus.

CONTEXT: ItoCook. cleaning_schedule collection exists with fields:
user (M2O → directus_users), date (date), confirmed (boolean).

TASK: Create 1 Directus Flow via MCP.

FLOW: "Duty Reminder"
Trigger: Schedule — cron "0 9 * * 1-5" (09:00 Mon–Fri)
Operation chain:
  1. Read Data: fetch cleaning_schedule where date = today AND confirmed = false
  2. For each result: Create Item in notifications:
     {
       "user": "{{item.user}}",
       "type": "duty_reminder",
       "message": "Reminder: you're on kitchen duty today. Don't forget to confirm! 🧹"
     }

After creating, verify Flow appears in Directus Flows list via MCP.
Final step: update docs/progress.md.


---

## Шаг 5 — Task B': Cook Reminder (зависший scheduled entry)

**Сессия:** отдельная
**Скиллы:** `directus`, `vue`


Read AGENTS.md first. Use skills: directus, vue.

CONTEXT: ItoCook. cook_queue statuses: assign → dish → scheduled → cooking → ready → completed / cancelled.
"Idea stage" = assign, dish, scheduled (no money involved yet).
"Cooking stage" = cooking, ready, completed (money counts).
If an entry stays in scheduled for more than 2 hours past the assigned date without transitioning to cooking → send reminder to cook and eventually auto-cancel.

TASK: Two parts.

---

PART A: Directus Flow "Cook Stale Reminder"
Trigger: Schedule — cron "0 10 * * 1-5" (10:00 Mon–Fri)
Operation chain:
  1. Read Data: fetch cook_queue where:
     - date = today
     - status IN [assign, dish, scheduled]
  2. Condition: if result not empty
  3. For each item: Create notification:
     {
       "user": "{{item.cook}}",
       "type": "cook_reminder",
       "message": "You signed up to cook today but haven't started yet. Start cooking or cancel so others can plan 🍳"
     }

---

PART B: Directus Flow "Cook Auto-Cancel"
Trigger: Schedule — cron "0 12 * * 1-5" (12:00 Mon–Fri)
Operation chain:
  1. Read Data: fetch cook_queue where date = today AND status IN [assign, dish, scheduled]
  2. For each item:
     a. Update cook_queue item: { status: "cancelled" }
     b. Create notification for cook:
        {
          "user": "{{item.cook}}",
          "type": "cook_reminder",
          "message": "Your cooking entry for today was automatically cancelled since cooking never started."
        }

Note: auto-cancel only touches entries still in idea stage — no balance changes needed (money is only counted on confirmDeduction which requires cooking/ready status).

---

PART C: Nuxt — cook.vue: show pending join requests
In cook.vue, in the "cooking" and "ready" states, fetch orders where:
  status = "pending_cook_approval" AND cook_queue = current entry id

If any exist, show a section "Pending join requests" with:
  - User name
  - "Approve" button → PATCH order { status: "confirmed" }
  - "Decline" button → PATCH order { status: "cancelled" }

Keep it simple — no realtime, just fetch on page load and after each action.

Final step: update docs/progress.md.


---

## Шаг 6 — Task D: Ghost-participant logic

**Сессия:** отдельная, внимательно
**Скиллы:** `directus`, `vue`, `incremental-implementation`

> Самый сложный шаг. Затрагивает orders, cook.vue, useParticipants, confirmDeduction.


Read AGENTS.md first. Use skills: directus, vue, incremental-implementation.

CONTEXT: ItoCook.
orders collection fields: user, cook_queue, status (confirmed/cancelled).
confirmDeduction() in cook.vue splits total cost by participants.length (confirmed orders).
useParticipants composable handles join/leave.
Time logic: lunch is at 12:00. Cutoff for free leave = 11:00 (1h before). 
Cutoff for future days = 20:00 the day before.

TASK: Implement ghost-participant logic. Do this incrementally, verify each step.

---

STEP 1: Directus schema changes (via MCP)
Add to orders collection:
  - status: add new allowed values: "left_late", "pending_cook_approval"
    (existing: confirmed, cancelled — keep those)
  - charged_pending: boolean, default false

---

STEP 2: Update useParticipants.ts — leave() logic

Current leave() just deletes or cancels the order.
New logic:

```ts
async function leave(cookQueueId: string) {
  const now = new Date()
  const today = new Date().toISOString().split('T')[0]
  const entryDate = /* get date of cook_queue entry */

  if (entryDate === today) {
    // Today's lunch
    const cutoff = new Date()
    cutoff.setHours(11, 0, 0, 0)
    
    if (now < cutoff) {
      // Free leave — cancel order
      await request('patch', `/items/orders/${orderId}`, { status: 'cancelled' })
    } else {
      // Late leave — ghost marker
      await request('patch', `/items/orders/${orderId}`, { 
        status: 'left_late',
        charged_pending: true 
      })
      // Show toast: "You left late — you will still be charged for today's lunch"
    }
  } else {
    // Future day
    const cutoff = new Date(entryDate)
    cutoff.setDate(cutoff.getDate() - 1)
    cutoff.setHours(20, 0, 0, 0)
    
    if (now < cutoff) {
      // Free leave
      await request('patch', `/items/orders/${orderId}`, { status: 'cancelled' })
    } else {
      // After cutoff — needs cook approval
      await request('patch', `/items/orders/${orderId}`, { 
        status: 'pending_cook_approval',
        charged_pending: true
      })
      // Show toast: "Your leave request has been sent to the cook for approval"
    }
  }
}
```

---

STEP 3: Update useParticipants.ts — join() logic for late joins

If cook_queue status is "cooking" or "ready" AND current time > 11:00:
  - Instead of status: "confirmed", set status: "pending_cook_approval"
  - Show toast: "Your join request has been sent to the cook for approval"
  - Create notification for cook:
    { type: "join_pending", message: "{{user.name}} wants to join lunch — approve on your cook page" }

---

STEP 4: Update confirmDeduction() in cook.vue

Currently counts only confirmed orders. Update to also count left_late + charged_pending orders:

```ts
// Before: participants = orders.filter(o => o.status === 'confirmed')
// After:
const billableOrders = orders.filter(o => 
  o.status === 'confirmed' || (o.status === 'left_late' && o.charged_pending)
)
const perPerson = totalAmount / billableOrders.length
```

Show in the receipt preview: ghost participants marked with "(left late)" label.

---

STEP 5: Update recipe/[id].vue participant display

In the participants section, ghost orders (left_late) should show with:
- Name + strikethrough or ghost icon (PhGhost or PhUserMinus)
- Tooltip/label: "Left late — still charged"
- pending_cook_approval: show with clock icon "Pending approval"

---

Verify the full flow manually:
1. Join as User A → confirmed
2. Cook starts cooking
3. Leave as User A after 11:00 → status becomes left_late
4. Cook enters amount → User A still in split
5. confirmDeduction → User A gets charged

Final step: update docs/progress.md.


---

## Шаг 7 — Profile: настройки уведомлений

**Сессия:** быстрая, можно добавить в шаг 2 или отдельно
**Скиллы:** `vue`, `nuxt`


Read AGENTS.md first. Use skills: vue, nuxt.

CONTEXT: ItoCook. profile.vue exists. Directus users table has custom fields area.

TASK: Add notification preferences to profile.vue.

Step 1: Add fields to directus_users (via MCP — extend user record):
  - notif_cook_assigned: boolean, default true
  - notif_lunch_ready: boolean, default true  
  - notif_morning_reminder: boolean, default true
  - notif_balance_low: boolean, default true
  - notif_duty_reminder: boolean, default true

Step 2: In profile.vue, add a "Notifications" section (below existing content):
  - Section title: "Notifications" (text-[20px] font-semibold)
  - Toggle list for each type with label and description:
    - "Cook assigned" — "When someone signs up to cook"
    - "Lunch ready" — "When the cook marks lunch as ready"
    - "Morning reminder" — "If no cook is assigned by 8am"
    - "Balance low" — "When your balance drops below -10€"
    - "Duty reminder" — "Reminder about your kitchen duty"
  - Toggle: UNuxtUI UToggle component or simple styled checkbox
  - Auto-save on change: PATCH /users/me with updated field

Step 3: Update Directus Flows (Flows 1-4 from Step 1) to check user preference before creating notification:
  In each Flow, before Create Item: Read the target user's preference field.
  If preference = false → skip notification for that user.
  This can be done with a Condition operation in the Flow checking {{user.notif_TYPE}}.

Final step: update docs/progress.md.


---

## Порядок выполнения

| # | Шаг | Сложность | Зависит от |
|---|---|---|---|
| 0 | Schema: notifications collection | ★☆☆ | — |
| 1 | Flows: 4 основных триггера | ★★☆ | Шаг 0 |
| 2 | Nuxt: useNotifications + колокольчик | ★★☆ | Шаг 0 |
| 3 | Страница /notifications | ★★☆ | Шаг 2 |
| 4 | Flow: duty reminder | ★☆☆ | Шаг 0 |
| 5 | Task B': stale cook reminder + auto-cancel | ★★☆ | Шаг 1 |
| 6 | Task D: ghost-participant logic | ★★★ | Шаги 0,1,2 |
| 7 | Profile: настройки уведомлений | ★★☆ | Шаг 2 |

**Рекомендуемый порядок для живого тестирования:**
Шаги 0 → 1 → 2 → 3 → задеплоить на Hetzner → позвать коллег → потом 4,5,6,7

---

## Что НЕ входит в эту фазу

- Email/SMTP — отдельная фича, после MVP
- Push-уведомления (FCM) — после MVP
- WhatsApp — после MVP
- Realtime (WebSockets) — после MVP, Directus поддерживает через subscriptions но не нужно сейчас

---

## После этой фазы

Остаётся только:
- AI Recipe (экран чата, OpenRouter)
- Common (объявления, групповые сборы)

Оба автономны и не блокируют работу приложения.

---

## Analysis Report — Проверка реализуемости и архитектуры

> Проверено opencode agent 2026-06-19.
> Контекст: проект на момент окончания security-сессии (admin proxy, admin token caching, вся JSDoc, Phase 1-2 рефакторинг).

### 1. Могу ли я это сделать?

**Да, полностью.** Все 8 шагов реализуемы. Ничего технически risky:

- **Directus Flows** (шаги 1,4,5) — стандартный MCP, уже работали с collections/fields/relations
- **Nuxt composable + колокольчик** (шаг 2) — паттерн `useDirectus()` + `onMounted` с poll, уже есть в `useParticipants`
- **Страница /notifications** (шаг 3) — стандартная страница с skeleton/empty/list
- **Ghost-логика** (шаг 6) — модификация `useParticipants.leave()`, `confirmDeduction()`, `recipe/[id].vue`
- **Настройки уведомлений** (шаг 7) — поля в `directus_users`, toggle в `profile.vue`, проверка в Flows

### 2. Как лучше давать задания

**Одну сессию — один шаг.** План уже разбит идеально. К каждому шагу:

1. Просто дай команду: _"Step 0 — notifications collection"_
2. Я прочитаю соответствующий раздел phase6-notifications.md, загружу нужные skills (`directus`, `vue`, `nuxt`, `incremental-implementation`)
3. Реализую, проверю, обновлю `docs/progress.md`

Не надо давать весь файл целиком — давай номер шага и имя. Порядок рекомендуемый в плане (0→1→2→3→4→5→6→7) — верный.

### 3. Архитектурные расхождения

Нашёл **3 несоответствия** между планом и текущей кодовой базой:

#### 🔴 Критическое: Шаг 5 — статусы cook_queue
План проверяет `status IN [assign, dish, scheduled]`, но **`assign` и `dish` не существуют в Directus** — это UI-состояния `cook.vue`. В Directus все три состояния хранятся как `scheduled`.

**Фикс:** Проверять `status = scheduled` + `date = today`.

#### 🟡 Важное: orders.status choices
План хочет добавить `left_late` и `pending_cook_approval` в `orders.status`, но текущие `choices` в Directus: `[pending, confirmed, cancelled, completed]`. План говорит "existing: confirmed, cancelled", но **`pending` и `completed` уже есть** и используются.

**Фикс:** Добавить `left_late` и `pending_cook_approval` к существующим choices, не удаляя `pending`/`completed`.

#### 🟡 Важное: cook_queue.status choices
Текущие choices: `[scheduled, cooking, ready, cancelled]`. Статус `completed` используется (ставится `confirmDeduction`) но **не объявлен** в choices.

**Предложение:** Добавить `completed` в choices Directus для консистентности.

#### 🟢 Незначительное: poll-интервал
План использует `setInterval(60000)` для опроса уведомлений. У нас нет общего паттерна для polling. Стоит подумать про `visibilitychange` (как в `cook.vue`) чтобы не грузить API в фоне.

### 4. Что можно дополнить/улучшить

#### Технические улучшения

| Что | Почему |
|---|---|
| **Добавить `completed` в Directus `cook_queue.status` choices** | Используется в `confirmDeduction` но не объявлен в схеме |
| **Добавить `pending`, `completed` в `orders.status` choices** (а не только `left_late`/`pending_cook_approval`) | Уже используются, не объявлены |
| **Шаг 6 — `useParticipants.fetch()` нужно расширить** | `fetch()` сейчас фильтрует `status = confirmed`. Ghost participant `left_late` должен также считаться в billable, но не показываться как активный participant |
| **Шаг 7 — проверка предпочтений в Flow** | Проверка `{{ user.notif_TYPE }}` в Directus Flow condition — возможна, но требует Read Data операции до каждого Create Item. Можно упростить: читать всех юзеров разом + фильтр по предпочтениям в `exec` операции |
| **Очистка старых уведомлений** | Нет механизма авто-очистки уведомлений старше 30 дней. В production `notifications` будет расти бесконечно |

#### Дизайн / UX

- **Уведомление для ghost-юзера**: Сейчас только toast. Стоит создать уведомление `left_late` и для самого ghost: "You left late — you'll still be charged €X.XX"
- **Optimistic сброс badge**: При тапе на колокольчик сбрасывать count сразу, не ждать загрузки страницы
- **Auto markAllAsRead через 3 секунды** (шаг 3): Сделать опциональным или при уходе со страницы. Не все хотят терять маркеры непрочитанного

### 5. Что в плане уже идеально

- ✅ **Без FastAPI/e-mail** — только Flows + коллекция. Верное решение
- ✅ **Вертикальная нарезка** — каждый шаг законченная фича
- ✅ **Порядок выполнения** — schema → backend → frontend → сложное
- ✅ **Отдельные сессии** — агент не перегружается
- ✅ **Prompts с контекстом** — достаточно для самостоятельной работы
- ✅ **Что НЕ входит** — четко очерчено

### 6. Перед началом: обновить `docs/roadmap.md`

Phase 6 в roadmap.md всё ещё называется **"FastAPI + Notifications"**, но фактический план использует только **Directus Flows + Nuxt** (никакого FastAPI, никакой почты). Заголовок фазы и список чекбоксов нужно обновить под реальность.
