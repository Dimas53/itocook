# ItoCook — Full Code Walkthrough

> Как старший разработчик показывает код младшему.
> Открывай файлы и смотри — я объясняю каждую строчку.

---

## Содержание

1. [Точка входа: docker-compose.yml](#1-точка-входа-docker-composeyml)
2. [Конфиг Nuxt: nuxt.config.ts](#2-конфиг-nuxt-nuxtconfigts)
3. [Старт приложения: app.vue и Layouts](#3-старт-приложения-appvue-и-layouts)
4. [Onboarding → Auth: цепочка логина](#4-onboarding--auth-цепочка-логина)
5. [useDirectus.ts — сердце API](#5-usedirectusts--сердце-api)
6. [useAuth.ts — аутентификация](#6-useauthts--аутентификация)
7. [Middleware: auth.global.ts](#7-middleware-authglobalts)
8. [Server Route: signup.post.ts](#8-server-route-signuppostts)
9. [Главная страница: index.vue](#9-главная-страница-indexvue)
10. [Виджет баланса: BalanceWidget.vue](#10-виджет-баланса-balancewidgetvue)
11. [Страница Kitchen: kitchen.vue](#11-страница-kitchen-kitchenvue)
12. [BottomTabBar.vue — навигация](#12-bottomtabbarvue--навигация)
13. [Остальные страницы (stub)](#13-остальные-страницы-stub)
14. [FastAPI бэкенд: api/](#14-fastapi-бэкенд-api)
15. [Полная диаграмма вызовов](#15-полная-диаграмма-вызовов)

---

## 1. Точка входа: docker-compose.yml

**Файл:** `/docker-compose.yml`

Здесь описаны 4 сервиса. Открой его.

```yaml
services:
  postgres:     # База данных
  directus:     # Headless CMS / API
  frontend:     # Nuxt 4 приложение
  api:          # FastAPI микросервис (пока пустой)
```

**Что важно понимать:**

- `frontend` видит `directus` внутри Docker сети по имени сервиса:
  - Переменная `NUXT_PUBLIC_DIRECTUS_URL=http://localhost:8055` — это для **браузера** (клиентский JS)
  - А внутри Docker контейнера Nuxt видит Directus как `http://directus:8055` — это для **серверных запросов** (server routes)

  ```
  Браузер пользователя                Docker-сеть
  ┌──────────────┐                  ┌──────────────┐
  │ fetch()      │────localhost────▶│  Directus    │
  │ localhost:8055│   :8055         │  :8055       │
  └──────────────┘                  └──────────────┘
                                    ▲
  ┌──────────────┐                  │
  │ Nuxt Server  │────directus:8055─┘
  │ (server/     │   (Docker DNS)
  │  routes)     │
  └──────────────┘
  ```

- `frontend` пробрасывает переменные из `.env` как `NUXT_DIRECTUS_ADMIN_EMAIL` и `NUXT_DIRECTUS_ADMIN_PASSWORD` — они используются в server-route для регистрации.

- `CORS_ENABLED: "true"` и `CORS_ORIGIN: "http://localhost:3000"` в `directus` — разрешаем запросы с Nuxt.

---

## 2. Конфиг Nuxt: nuxt.config.ts

**Файл:** `/frontend/nuxt.config.ts`

Открой его и смотри на ключевые блоки:

```ts
ssr: false,                                         // ← SPA-режим (без серверного рендеринга)
```

Это значит, что Nuxt работает как Single Page Application — вся логика на клиенте. Server routes (папка `server/`) при этом всё равно работают, но страницы рендерятся в браузере.

```ts
runtimeConfig: {
    directusUrl: 'http://directus:8055',           // ← серверная переменная (для server routes)
    directusAdminEmail: '',                         // ← заполняется из .env
    directusAdminPassword: '',                      // ← заполняется из .env
    public: {
        directusUrl: 'http://localhost:8055',       // ← клиентская переменная (для браузера)
    },
},
```

**Как это работает:**
- `config.public.directusUrl` — доступна на клиенте и на сервере → используется в `useDirectus.ts`
- `config.directusUrl` — доступна **только на сервере** → используется в `signup.post.ts`
- Значения из `.env` (`NUXT_PUBLIC_DIRECTUS_URL`, `NUXT_DIRECTUS_ADMIN_EMAIL`, `NUXT_DIRECTUS_ADMIN_PASSWORD`) автоматически подставляются в `runtimeConfig`

```ts
future: { compatibilityVersion: 4 },               // ← Nuxt 4 режим
```

Это значит, что все app-файлы лежат в `app/` (`app/pages/`, `app/composables/`, `app/middleware/`, `app/layouts/`, `app/components/`).

---

## 3. Старт приложения: app.vue и Layouts

**Файл:** `/frontend/app/app.vue`

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

Всего 5 строк. Nuxt берёт layout из `definePageMeta({ layout: 'app' })` или дефолтный.

### Лэйаут default.vue

**Файл:** `/frontend/app/layouts/default.vue`

Это iPhone-рамка. Вся страница отрисовывается внутри "телефона":

```
┌──────────────────────┐
│   Dynamic Island      │
│   9:41         [batt]│
│                      │
│   ┌──────────────┐   │
│   │              │   │
│   │   <slot />   │   │  ← контент страницы
│   │              │   │
│   └──────────────┘   │
│                      │
└──────────────────────┘
```

Используется для `/onboarding` и `/auth` — там не нужен BottomTabBar.

### Лэйаут app.vue

**Файл:** `/frontend/app/layouts/app.vue`

То же самое, но:
- Добавлен `padding-top: 60px` (чтобы контент не залезал под Dynamic Island)
- Добавлен `padding-bottom: 100px` (чтобы контент не залезал под BottomTabBar)
- Вставлен `<BottomTabBar v-if="!isProfilePage" />` — плавающая нижняя панель навигации
- Скрыта на `/profile`

**Как выбирается layout:**
- Страницы с `definePageMeta({ layout: 'app' })` → `app.vue` с таббаром
- Страницы без указания layout → `default.vue` (iPhone рамка без таббара)
- `onboarding.vue` не указывает layout → `default.vue`
- `auth.vue` указывает `darkStatus: true` → `default.vue`, но инвертирует статус-бар
- `recipe/today.vue` → `layout: 'default'` (полный экран, без таббара)

**❓ Вопрос на понимание:** Зачем два лэйаута? Чтобы на онбординге и логине не было нижней панели — пользователь ещё не залогинен.

---

## 4. Onboarding → Auth: цепочка логина

### Onboarding

**Файл:** `/frontend/app/pages/onboarding.vue`

Простая страница с приветствием. Кнопка "Get Started" ведёт на `/auth`.

### Auth

**Файл:** `/frontend/app/pages/auth.vue`

Тут переключение между **Log In** и **Sign Up** через табы.

Давай пройдём по шагам:

**Шаг 1:** Пользователь заполняет форму и нажимает кнопку.

**Шаг 2:** Срабатывает `@submit.prevent="handleSubmit"` (строка 41 или 106).

**Шаг 3:** Функция `handleSubmit()` (строка 242):
- Проверяет валидацию через `validate()`
- Если Sign Up → вызывает `signUp()` из `useAuth`
- Если Log In → вызывает `login()` из `useAuth`
- После успеха → `redirectAfterLogin()`

**Шаг 4:** `redirectAfterLogin()` вызывает `isTodayCook()` из `useAuth`:
```
directus api — GET /items/cook_queue?filter[date][_eq]=YYYY-MM-DD&filter[cook][_eq]=user.id&filter[status][_nin]=cancelled&limit=1
```
- Если есть записи → редирект на `/cook` (панель повара)
- Если нет → редирект на `/` (главная)

---

## 5. useDirectus.ts — сердце API

**Файл:** `/frontend/app/composables/useDirectus.ts`

**Это самый важный файл для понимания.** Открой его.

Что он делает:
1. Берёт URL Directus из `runtimeConfig.public.directusUrl`
2. Управляет кукой `directus_token`
3. Предоставляет функцию `request()` — универсальный HTTP-клиент к Directus

### Функция request()

```ts
async function request<T = unknown>(
    method: string,    // 'get' | 'post' | 'patch' | 'delete'
    path: string,      // '/auth/login' | '/items/cook_queue' | '/users/me'
    body?: Record<string, unknown>   // тело для POST/PATCH
): Promise<T>
```

**Что происходит внутри:**

1. **Берёт токен из куки:**
   ```ts
   const token = tokenCookie.value
   if (token) {
       headers['Authorization'] = `Bearer ${token}`
   }
   ```
   Если токен есть — подставляет его в `Authorization` header.

2. **Делает fetch:**
   ```ts
   const res = await fetch(`${baseURL}${path}`, { method, headers, body })
   ```
   Склеивает `baseURL` (http://localhost:8055) с `path` (/auth/login).

3. **Обрабатывает ответ:**
   ```ts
   const json: DirectusError | { data: T } = await res.json()
   // Directus всегда оборачивает ответ в { data: ... }
   return (json as { data: T }).data
   ```

4. **Обрабатывает ошибку:**
   ```ts
   const message = err.errors?.[0]?.message || 'Request failed'
   throw new Error(message)
   ```
   Directus возвращает ошибки в формате `{ errors: [{ message: "..." }] }`.

### Как это связано с остальными файлами?

```
useDirectus.ts
    │
    ├── useAuth.ts              ← request('/auth/login'), request('/users/me')
    │       │
    │       ├── auth.vue        ← login(), signUp()
    │       ├── auth.global.ts  ← fetchUser()
    │       ├── index.vue       ← user (только чтение)
    │       └── BottomTabBar.vue ← user.role (только чтение)
    │
    ├── BalanceWidget.vue       ← request('/items/balances?...')
    │
    └── kitchen.vue             ← request('/items/cook_queue?...')
```

**✅ Запомни:** `useDirectus()` — единственное место, где создаётся `fetch`. Все остальные файлы вызывают `request()` через него.

---

## 6. useAuth.ts — аутентификация

**Файл:** `/frontend/app/composables/useAuth.ts`

Полностью завязан на `useDirectus()`. Открой и смотри на каждую функцию.

### `login(email, password)`

```ts
const data = await request<LoginResponse>('post', '/auth/login', { email, password })
// ↑ directus api — POST /auth/login → Directus
// Ответ: { access_token, expires, refresh_token }

tokenCookie.value = data.access_token
// ↑ directus api — сохраняем access_token в куку

await fetchUser()
// ↑ directus api — сразу подтягиваем данные юзера
```

**Что происходит на стороне Directus:** Directus проверяет credentials в таблице `directus_users`, если верно — генерирует JWT access_token и refresh_token.

### `fetchUser()`

```ts
const userData = await request<DirectusUser>('get', '/users/me')
// ↑ directus api — GET /users/me
// Токен автоматически подставляется в Authorization header из куки

user.value = userData
// ↑ сохраняем в глобальное состояние через useState
```

**Где хранится user:**
```ts
const user = useState<DirectusUser | null>('auth:user', () => null)
```
Это Nuxt-овский `useState` — глобально доступен во всём приложении после инициализации.

### `isTodayCook()`

```ts
const params = new URLSearchParams({
    'filter[date][_eq]': today,                    // сегодня
    'filter[cook][_eq]': user.value.id,             // этот юзер
    'filter[status][_nin]': 'cancelled',            // не отменено
    'limit': '1',
})
const cooks = await request<any[]>('get', `/items/cook_queue?${params}`)
// ↑ directus api — GET /items/cook_queue с тремя фильтрами
```

### `logout()`

```ts
tokenCookie.value = null  // ← чистим куку
user.value = null         // ← чистим стейт
```

### `signUp(firstName, lastName, email, password)`

Не идёт напрямую в Directus! Вызывает Nuxt server route:
```ts
const res = await fetch('/api/auth/signup', { ... })
// ↑ POST /api/auth/signup → Nuxt server route (не Directus!)
```

Потому что Directus не позволяет создавать пользователей через публичный API.

---

## 7. Middleware: auth.global.ts

**Файл:** `/frontend/app/middleware/auth.global.ts`

Глобальный middleware — выполняется **на каждый переход между страницами**.

Давай разберём логику:

```ts
export default defineNuxtRouteMiddleware(async (to) => {
    const publicRoutes = ['/onboarding', '/auth']
    const { tokenCookie } = useDirectus()
    const { user, fetchUser, logout } = useAuth()
    
    const token = tokenCookie.value
    // ↑ directus api — читаем токен из куки
```

**Логика 1 — Публичные страницы (`/onboarding`, `/auth`):**
```ts
if (publicRoutes.includes(to.path)) {
    if (token && !user.value) {
        // Есть токен в куке, но user ещё не загружен
        await fetchUser()
        // ↑ directus api — GET /users/me — проверяет токен
        return navigateTo('/')  // ← уже залогинен, редирект на главную
    }
    return  // ← не залогинен, показываем страницу
}
```

**Логика 2 — Защищённые страницы:**
```ts
if (!token) {
    return navigateTo('/auth')  // ← нет токена → на логин
}

if (!user.value) {
    await fetchUser()
    // ↑ directus api — GET /users/me — проверяет что токен жив
    // Если fetchUser() упал → токен протух → logout() → редирект на /auth
}
```

**Визуально:**

```
Пользователь переходит на /kitchen
         │
         ▼
    tokenCookie.value есть?
    ┌───┴───┐
   нет      да
    │       │
    ▼       ▼
  /auth    user.value есть?
           ┌───┴───┐
          нет      да
           │       │
           ▼       ▼
        fetchUser()  → переход на /kitchen
        GET /users/me
        ┌───┴───┐
       ок      ошибка
        │       │
        ▼       ▼
    переход   logout()
              → /auth
```

---

## 8. Server Route: signup.post.ts

**Файл:** `/frontend/server/api/auth/signup.post.ts`

Это Nuxt server route — выполняется **на сервере**, не в браузере.

**Зачем он нужен?** Directus не позволяет регистрировать пользователей через публичный API. Нужно сделать запрос как админ.

**Что происходит пошагово:**

**Шаг 1 — Логинимся как админ:**
```ts
// directus api — POST /auth/login с credentials админа
// config.directusUrl = http://directus:8055 (на сервере)
const adminRes = await fetch(`${config.directusUrl}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
        email: config.directusAdminEmail,
        password: config.directusAdminPassword,
    }),
})
```

**Шаг 2 — Создаём юзера:**
```ts
// directus api — POST /users с Bearer-токеном админа
const createRes = await fetch(`${config.directusUrl}/users`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
        email, password,
        first_name: firstName,
        last_name: lastName,
        role: '1927ae8a-4442-4097-91ce-0c290b3fc1d4',  // UUID роли User
    }),
})
```

**Почему роль захардкожена?** Потому что UUID роли User в Directus статичен для этого проекта. Если бы Directus был пересоздан — UUID бы изменился.

**Обрати внимание:** `config.directusUrl` (серверная) отличается от `config.public.directusUrl` (клиентская). Внутри Docker она равна `http://directus:8055`, а на клиенте — `http://localhost:8055`.

---

## 9. Главная страница: index.vue

**Файл:** `/frontend/app/pages/index.vue`

Самая большая страница. Давай разберём её по блокам.

### Header
```
┌──────────────────────────┐
│ [avatar] Hello           │
│          Admin    [🔔]   │
└──────────────────────────┘
```
- Аватар — Gravatar-стиль через `i.pravatar.cc?u=email`
- Клик по header → `/profile`
- Юзернейм из `user.value.first_name`

### HeroBlock (Today's Kitchen)
```
┌──────────────────────────┐
│ TODAY'S KITCHEN          │
│                          │
│ [👨‍🍳 Cook]   [🍴 Join]  │
│                          │
│ Cobb Salad               │
│ by Admin                 │
│ 3 of 8 confirmed    [🥗] │
└──────────────────────────┘
```
Компонент `HeroBlock.vue` — принимает пропсы:
- `loading` → скелетон
- `cook` → { name, dish, photo }
- `joined` → меняет кнопку на "Joined ✓"
- `participantCount` / `totalCount`

Эмиты:
- `join` → увеличивает счётчик
- `become-cook` → `/cook`
- `view-dish` → `/recipe/today`

### Виджеты
```
┌──────────────┬──────────────┐
│ My Balance   │ Next Duty    │
│ €0,00        │ Kitchen duty │
│              │ Tomorrow     │
└──────────────┴──────────────┘
```
- `BalanceWidget` — сам делает `request('/items/balances?...')`
- `DutyWidget` — чисто UI, данные пока хардкодом

### Search
Поиск блюд — при фокусе редирект на `/kitchen` (там есть реальный поиск по истории).

### Recipe Cards
Пока моковые данные:
```ts
recipes.value = [
    { title: 'Spiced Fried Chicken', chef: 'Maria', rating: 4.8, time: '45 min' },
    { title: 'Creamy Pasta Carbonara', chef: 'John', rating: 4.6, time: '30 min' },
    { title: 'Thai Green Curry', chef: 'Anna', rating: 4.9, time: '50 min' },
]
```

**Phase 5 todo:** Заменить на реальный запрос к Directus `GET /items/cook_queue` или `GET /items/recipes`.

---

## 10. Виджет баланса: BalanceWidget.vue

**Файл:** `/frontend/app/components/BalanceWidget.vue`

Небольшой, но важный компонент — показывает реальные данные из Directus.

```ts
const { request } = useDirectus()
const { user } = useAuth()

async function fetchBalance() {
    // directus api — GET /items/balances?filter[user][_eq]=user.id&limit=1
    const items = await request<BalanceItem[]>('get',
        `/items/balances?filter[user][_eq]=${user.value.id}&limit=1`
    )
    // ↑ ищем баланс текущего юзера, берём первую запись
    if (items.length > 0) {
        balance.value = Number(items[0].amount)
    }
}

// Форматируем: €0.00
const formattedAmount = computed(() => `€${(balance.value ?? 0).toFixed(2)}`)

onMounted(fetchBalance)
```

Где ещё используется `request` напрямую? Только здесь и в `kitchen.vue`. Всё остальное идёт через `useAuth`.

---

## 11. Страница Kitchen: kitchen.vue

**Файл:** `/frontend/app/pages/kitchen.vue`

Самая функциональная страница на данный момент. Разберём по блокам.

### Блок 1: Today's Kitchen (HeroBlock)
Переиспользует `<HeroBlock>` — тот же компонент, что на главной.

### Блок 2: WeekCalendar
```
┌──────────────────────────────────┐
│  January 2026           ◀  ▶    │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
│ │Mon│ │Tue│ │Wed│ │Thu│ │Fri│ │Sat│ │Sun│
│ │   │ │   │ │   │ │   │ │   │ │   │ │   │
│ │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │ 7 │
│ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘
└──────────────────────────────────┘
```
Компонент `WeekCalendar.vue` — получает массив `CalendarDay[]`, эмитит `select-day`, `prev-week`, `next-week`.

### Блок 3: Day Detail
Показывает информацию о выбранном дне: кто готовит, какое блюдо. Если повар не назначен — кнопка "Become a cook".

### Блок 4: Dish History
Список прошедших блюд с поиском.

**Главный запрос к Directus происходит в onMounted:**

```ts
// directus api — GET /items/cook_queue с вложенными полями cook
const items = await request<CookQueueItem[]>('get',
    `/items/cook_queue?${new URLSearchParams({
        fields: '*,cook.id,cook.first_name,cook.last_name',
        sort: 'date',
    })}`
)
// ↑ запрашиваем ВСЮ очередь готовки
//   cook.id, cook.first_name, cook.last_name — вложенные поля M2O-связи
```

После этого данные распределяются:
- `todayItem` → Today's block (HeroBlock)
- `allItems[i].date === selectedDate` → Day detail
- `items.filter(i.date < todayISO)` → Dish history

**❓ Обрати внимание:** Данные для истории блюд берутся из `cook_queue`, а не из отдельной коллекции `recipes` или `dishes`. Рейтинг пока генерируется рандомно: `Math.random()`.

---

## 12. BottomTabBar.vue — навигация

**Файл:** `/frontend/app/components/BottomTabBar.vue`

Плавающая нижняя панель:

```
┌──────────────────────────────────────────┐
│   🍳      📅      ✨      🧹      👥    │
│  Home   Kitchen  AI/Duty  Duty   Common  │
└──────────────────────────────────────────┘
```

**Как определяется активный таб:**
```ts
const activeTab = computed(() => {
    const path = route.path
    const match = tabs.value.find(t => t.route === path)
    return match ? match.id : 'home'
})
```

**Логика замены таба:**
```ts
// Если роль юзера != UUID роли User → показываем Finance вместо AI Recipe
const isFinanceRole = computed(() => {
    return user.value?.role && user.value.role !== '1927ae8a-4442-4097-91ce-0c290b3fc1d4'
})
// ↑ directus api — проверка роли из user.value.role
```

Табы:
| ID | Route | Icon | Кто видит |
|---|---|---|---|
| home | `/` | PhCookingPot | Все |
| kitchen | `/kitchen` | PhCalendarBlank | Все |
| ai-recipe | `/ai-recipe` | PhSparkle | User (обычный) |
| finance | `/finance` | PhChartBar | Admin/Accountant |
| duty | `/duty` | PhBroom | Все |
| common | `/common` | PhUsers | Все |

---

## 13. Остальные страницы (stub)

Большинство страниц — заглушки с `definePageMeta({ layout: 'app' })` и текстом "Coming soon".

| Файл | Статус |
|---|---|
| `/frontend/app/pages/cook.vue` | Базовая верстка, кнопка "I'm Cooking Today" |
| `/frontend/app/pages/ai-recipe.vue` | Stub |
| `/frontend/app/pages/duty.vue` | Stub |
| `/frontend/app/pages/common.vue` | Stub |
| `/frontend/app/pages/finance.vue` | Stub |

### cook.vue
**Файл:** `/frontend/app/pages/cook.vue`

Простейшая страница:
```vue
<template>
  <div class="p-5">
    <h1>Cook Panel</h1>
    <p>You are today's cook!</p>
    <div>Today's Dish: —</div>
    <button>I'm Cooking Today</button>
  </div>
</template>
```

Phase 5 todo: добавить выбор блюда, загрузку чека, расчёт суммы.

### recipe/today.vue
**Файл:** `/frontend/app/pages/recipe/today.vue`

Детальная страница рецепта. Тоже пока моковые данные:
- Фото блюда (280px)
- Название, рейтинг, повар
- Описание
- Ингредиенты (collapsible)
- Кнопка "Join lunch" внизу

Использует `layout: 'default'` — без таббара, полный экран.

---

## 14. FastAPI бэкенд: api/

**Файл:** `/api/app/main.py`

Пока просто заглушка:
```python
from fastapi import FastAPI

app = FastAPI(title="ItoCook API")

@app.get("/")
def root():
    return {"message": "ItoCook API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "itocook-api"}
```

Phase 6: сюда переедет расчёт суммы на участника, отправка уведомлений, напоминания.

---

## 15. Полная диаграмма вызовов

### Регистрация (Sign Up)

```
auth.vue
  handleSubmit()
    → useAuth().signUp()
        → fetch('/api/auth/signup')      ← Nuxt server route
            → signup.post.ts
                → POST /auth/login       ← directus api (admin login)
                → POST /users            ← directus api (create user)
        → useAuth().login()
            → request('post', '/auth/login')  ← directus api
            → request('get', '/users/me')     ← directus api
        → useAuth().isTodayCook()
            → request('get', '/items/cook_queue?...')  ← directus api
        → redirect('/' или '/cook')
```

### Логин (Log In)

```
auth.vue
  handleSubmit()
    → useAuth().login()
        → request('post', '/auth/login')    ← directus api
        → request('get', '/users/me')       ← directus api
    → useAuth().isTodayCook()
        → request('get', '/items/cook_queue?...')  ← directus api
    → redirect('/' или '/cook')
```

### Загрузка главной

```
/index.vue
  onMounted()
    → BalanceWidget (onMounted)
        → request('get', '/items/balances?...')   ← directus api
```

### Загрузка Kitchen

```
/kitchen.vue
  onMounted()
    → request('get', '/items/cook_queue?fields=*,cook.*&sort=date')  ← directus api
    → распределяет данные по todayCook, weekSlots, historyItems
```

### Переход между страницами (каждый раз)

```
auth.global.ts
    → tokenCookie.value                         ← читаем куку
    → fetchUser() (если нужно)
        → request('get', '/users/me')           ← directus api
```

---

## Итог: файлы, которые нужно знать

| Файл | Зачем |
|---|---|
| `docker-compose.yml` | Инфраструктура: 4 сервиса, порты, переменные |
| `nuxt.config.ts` | Конфиг Nuxt: SPA, runtimeConfig, Nuxt 4 |
| `app/app.vue` | Точка входа, NuxtLayout + NuxtPage |
| `app/layouts/default.vue` | iPhone рамка (onboarding, auth) |
| `app/layouts/app.vue` | iPhone рамка + BottomTabBar (все остальные) |
| `app/composables/useDirectus.ts` | **Самое важное:** HTTP-клиент к Directus |
| `app/composables/useAuth.ts` | Аутентификация: login, signUp, logout, fetchUser |
| `app/middleware/auth.global.ts` | Проверка токена на каждый переход |
| `server/api/auth/signup.post.ts` | Серверная регистрация через Admin API |
| `app/components/BottomTabBar.vue` | Нижняя навигация с 5 табами |
| `app/components/BalanceWidget.vue` | Виджет баланса из Directus |
| `app/components/HeroBlock.vue` | "Today's Kitchen" блок |
| `app/pages/auth.vue` | Логин / регистрация |
| `app/pages/kitchen.vue` | Кухня: календарь, очередь, история |
| `app/pages/index.vue` | Главная: Hero, виджеты, рецепты |

---

## Глоссарий ключевых терминов

| Термин | Что это |
|---|---|
| `useDirectus()` | Композабл, создающий HTTP-клиент для Directus |
| `request()` | Функция, wrapping `fetch` к Directus API |
| `tokenCookie` | Кука `directus_token`, хранит JWT access_token |
| `user` | `useState('auth:user')` — глобальное состояние юзера |
| `runtimeConfig.public.directusUrl` | URL Directus для клиента (http://localhost:8055) |
| `runtimeConfig.directusUrl` | URL Directus для сервера (http://directus:8055) |
| BottomTabBar | Плавающая нижняя панель с 5 табами |
| iPhone frame | Лэйаут в виде телефона с Dynamic Island |
