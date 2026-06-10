# ItoCook — Полный архитектурный обзор

> Этот документ — твоя шпаргалка и учебник одновременно. Открой его на втором мониторе рядом с кодом и иди по цепочке.

---

## Стек проекта — одним взглядом

| Слой | Технология | Роль в проекте |
|---|---|---|
| Фронтенд | Nuxt 4 (Vue 3) | UI, роутинг, SSR |
| Бекенд/API | Directus 11 | REST API, авторизация, управление данными |
| База данных | PostgreSQL 15 | Хранение всех данных |
| Микросервис | FastAPI (Python) | Заглушка, пока не используется |
| Инфраструктура | Docker Compose | Оркестрация всех сервисов |

---

## Важное: почему Directus — это не "просто админка"

Прежде чем идти дальше, нужно понять одну ключевую вещь, которую будет важно объяснить преподу.

В классическом проекте (как ваш прошлый на FastAPI) ты сам пишешь каждый роут:
```python
@app.get("/items/dishes")
def get_dishes():
    return db.query(Dish).all()
```

В Directus этого кода не существует — потому что он генерируется **автоматически**. Как только ты создаёшь коллекцию `dishes` в интерфейсе Directus, сразу появляются все эндпоинты:
```
GET    /items/dishes        — список
POST   /items/dishes        — создать
GET    /items/dishes/{id}   — один элемент
PATCH  /items/dishes/{id}   — обновить
DELETE /items/dishes/{id}   — удалить
```

Это называется **BaaS (Backend-as-a-Service)** или **API-first** подход. Ты не избегаешь бекенда — ты используешь готовый промышленный слой API, чтобы не писать тысячи строк шаблонного кода.

**Как это объяснить преподу одной фразой:**
> "Directus — это не CMS, это интеллектуальный слой API поверх PostgreSQL с автоматической генерацией CRUD, управлением ролями (RBAC) и JWT-авторизацией из коробки."

---

## 1. Инфраструктура (Docker Compose)

**Файл:** `docker-compose.yml`

Docker Compose поднимает 4 изолированных сервиса в одной закрытой сети:

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Network                         │
│                                                         │
│  ┌──────────────┐     ┌──────────────┐                  │
│  │   postgres   │◄────│   directus   │◄── браузер       │
│  │   порт 5432  │     │   порт 8055  │    localhost:8055 │
│  └──────────────┘     └──────────────┘                  │
│                              ▲                          │
│                              │ http://directus:8055     │
│                       ┌──────────────┐                  │
│                       │   frontend   │◄── браузер       │
│                       │   порт 3000  │    localhost:3000 │
│                       └──────────────┘                  │
│                                                         │
│  ┌──────────────┐                                       │
│  │     api      │  (FastAPI заглушка)                   │
│  │   порт 8000  │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### Два адреса Directus — и почему их два

Это важная деталь для бекендера:

| Кто обращается | Адрес | Почему |
|---|---|---|
| Браузер пользователя | `http://localhost:8055` | Браузер не знает про внутреннюю Docker-сеть |
| Nuxt SSR (серверная часть) | `http://directus:8055` | Запросы идут внутри Docker-сети, не выходя в интернет |

### Откуда Nuxt знает адрес Directus?

В `docker-compose.yml` задана переменная:
```
NUXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
```

Nuxt читает её через `useRuntimeConfig()`. В `nuxt.config.ts` это выглядит примерно так:
```ts
runtimeConfig: {
  directusUrl: 'http://directus:8055',        // только для SSR (серверная часть)
  public: {
    directusUrl: 'http://localhost:8055'       // доступно и на клиенте (браузере)
  }
}
```

В коде это используется так (`useDirectus.ts`):
```ts
const config = useRuntimeConfig()
const baseURL = config.public.directusUrl  // → http://localhost:8055
```

**Ключевой момент для препода:** Публичные переменные (`NUXT_PUBLIC_*`) видны в браузере. Приватные — только на сервере. Именно поэтому admin-пароли хранятся в приватных переменных.

---

## 2. Запуск приложения

### Точка входа
**Файл:** `frontend/app/app.vue`

Это корневой компонент. В нём определяется общий каркас, внутри которого через `<NuxtPage />` рендерится текущая страница.

### Плагины
В проекте **не используются** файлы `plugins/`. Directus не инициализируется через плагин.

### Инициализация клиента Directus
**Файл:** `frontend/app/composables/useDirectus.ts`

Официальный SDK Directus не используется — вместо него написан собственный лёгкий composable. Он экспортирует функцию `request()`, которая является центральной точкой всех запросов к API.

---

## 3. Аутентификация — полная цепочка

Это самая важная часть для понимания. Идём шаг за шагом.

### Шаг 1: Страница входа

**Файл:** `frontend/app/pages/auth.vue`

Когда пользователь нажимает кнопку входа, вызывается функция `handleSubmit()`:
```
handleSubmit()
├── isSignUp === true → signUp()   (регистрация)
└── isSignUp === false → login()   (вход)
```
Обе функции живут в `frontend/app/composables/useAuth.ts`.

---

### Шаг 2: Логин — прямой путь

**Файл:** `frontend/app/composables/useAuth.ts` → функция `login()`

```
Пользователь вводит email + password
         ↓
  login() делает запрос:
  POST http://localhost:8055/auth/login
  Body: { "email": "...", "password": "..." }
         ↓
  Directus проверяет по БД
         ↓
  Ответ:
  {
    "access_token": "eyJhbGc...",   ← главный токен
    "refresh_token": "abc123...",   ← для обновления
    "expires": 900000               ← время жизни (мс)
  }
```

**Что такое access_token?** Это JWT (JSON Web Token) — строка, которая содержит зашифрованную информацию о пользователе. Directus подписывает её своим секретом (`DIRECTUS_SECRET` из `.env`). При каждом следующем запросе Directus проверяет эту подпись.

---

### Шаг 3: Регистрация — через серверный прокси

**Файл:** `frontend/app/composables/useAuth.ts` → функция `signUp()`

Это самое интересное место архитектурно. Регистрация НЕ идёт напрямую в Directus.

**Почему нельзя напрямую?**
Directus по умолчанию не разрешает создавать пользователей без прав admin. Если бы мы логинились как admin прямо из браузера, хакер мог бы открыть F12, найти запрос и увидеть admin-пароль. Это дыра в безопасности.

**Решение — серверный прокси:**

```
Браузер (Nuxt client)
    │
    │  POST /api/auth/signup   ← это наш внутренний роут, не Directus
    ↓
Nuxt Server (серверная часть)
    │   ← здесь admin-пароль в безопасности, в .env, браузер его не видит
    │
    ├── 1. POST http://directus:8055/auth/login  { admin email + password }
    │        ← получаем admin access_token
    │
    └── 2. POST http://directus:8055/users  { новый юзер данные }
             ← создаём пользователя от имени admin
    │
    ↓
Браузер получает: 200 OK (или ошибку)
```

**Файл серверного роута:** `frontend/server/api/auth/signup.post.ts`

Admin-данные берутся из переменных окружения:
- `NUXT_DIRECTUS_ADMIN_EMAIL` — из `.env`
- `NUXT_DIRECTUS_ADMIN_PASSWORD` — из `.env`

---

### Шаг 4: Хранение токена

**Файл:** `frontend/app/composables/useDirectus.ts`

После успешного логина `access_token` сохраняется в **cookie** с именем `directus_token`:
```ts
const tokenCookie = useCookie<string | null>('directus_token', { ... })
tokenCookie.value = access_token
```

**Почему cookie, а не localStorage?**
Cookie работает и на сервере (SSR), и в браузере. localStorage — только в браузере. Это важно для Nuxt с SSR.

Данные пользователя хранятся в глобальном реактивном стейте:
```ts
// useAuth.ts
const user = useState<DirectusUser | null>('auth:user', () => null)
```

---

### Шаг 5: Middleware — охранник каждой страницы

**Файл:** `frontend/app/middleware/auth.global.ts`

Суффикс `.global` означает, что этот middleware запускается **при каждом переходе** на любую страницу автоматически.

```
Пользователь переходит на любую страницу
               ↓
   Есть кука directus_token?
   ├── НЕТ → redirect на /auth (страница логина)
   └── ДА  → есть user в useState('auth:user')?
             ├── ДА  → пропустить, всё ок
             └── НЕТ → вызвать fetchUser()
                       ├── fetchUser() успешен
                       │   → GET /users/me → сохранить в стейт → пропустить
                       └── fetchUser() упал (токен протух или невалиден)
                           → logout() → redirect /auth
```

`fetchUser()` — функция в `useAuth.ts`, делает:
```
GET http://localhost:8055/users/me
Authorization: Bearer <token из куки>
```
Directus проверяет токен и возвращает данные текущего пользователя.

---

### Шаг 6: Как токен передаётся в каждый запрос

**Файл:** `frontend/app/composables/useDirectus.ts` → функция `request()`

Это центральная функция. Она автоматически добавляет токен к каждому запросу:
```ts
const token = tokenCookie.value
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

Итог: программист не думает о токенах в каждом месте — он просто вызывает `request()`, а та сама добавит нужный заголовок.

---

### Refresh токена

**Не реализован.** `access_token` живёт ~15 минут (`expires: 900000` мс). Когда он протухнет — запросы вернут `401 Unauthorized`, middleware поймает ошибку в `fetchUser()` и разлогинит пользователя. Это known limitation текущей версии.

---

## 4. Страницы и навигация

### Все страницы: `frontend/app/pages/`

| Файл | Статус | Описание |
|---|---|---|
| `index.vue` | ✅ Готова | Главный экран: герой-блок, виджеты, список блюд (пока мок) |
| `onboarding.vue` | ✅ Готова | Онбординг для нового пользователя |
| `auth.vue` | ✅ Готова | Логин / регистрация |
| `profile.vue` | ✅ Готова | Профиль + кнопка выхода |
| `kitchen.vue` | ✅ Готова | Кухня: план, недельный календарь, история |
| `ai-recipe.vue` | 🚧 Заглушка | AI-рецепты |
| `cook.vue` | 🚧 Заглушка | Экран повара |
| `common.vue` | 🚧 Заглушка | Общие активности |
| `duty.vue` | 🚧 Заглушка | Расписание уборки |
| `finance.vue` | 🚧 Заглушка | Финансы (только для admin-роли) |
| `recipe/today.vue` | 🚧 Заглушка | Просмотр рецепта дня |

### Нижняя навигация

**Файл:** `frontend/app/components/BottomTabBar.vue`

Определяет активный таб через сравнение `route.path` с путями в `tabs`.

Особенность: если у пользователя роль финансиста (`isFinanceRole`), показывается таб `finance` (иконка `PhChartBar`) вместо `ai-recipe` (иконка `PhSparkle`). Это пример RBAC прямо во фронтенде.

### Лейауты

**Файл:** `frontend/app/layouts/default.vue`
- Базовый: iPhone-фрейм + статус-бар
- Используется для `/onboarding`, `/auth` (страницы без нижнего меню)

**Файл:** `frontend/app/layouts/app.vue`
- Основной: iPhone-фрейм + статус-бар + `<BottomTabBar />`
- Скролл с паддингом под нижний nav
- Используется для всех авторизованных страниц

---

## 5. Работа с данными Directus

### Как делаются запросы

**Файл:** `frontend/app/composables/useDirectus.ts` → функция `request()`

Используется нативный `fetch` (не официальный Directus SDK). Это сознательный выбор — меньше зависимостей, полный контроль.

Пример вызова из любого места приложения:
```ts
const { request } = useDirectus()

// Читаем данные
const data = await request('/items/cook_queue', { method: 'GET' })

// Создаём запись
const newOrder = await request('/items/orders', {
  method: 'POST',
  body: { user: userId, cook_queue: queueId }
})
```

Функция сама добавит токен в заголовок. Снаружи это не видно — инкапсулировано.

### Реальные запросы в коде

**Чтение очереди поваров:**
```
Файл:     frontend/app/composables/useAuth.ts
Функция:  isTodayCook()
Запрос:   GET /items/cook_queue?filter[date][_eq]=2025-01-15&filter[cook][_eq]=<user-uuid>
```

**Создание пользователя:**
```
Файл:     frontend/server/api/auth/signup.post.ts
Запрос:   POST /users
Body:     { email, password, role: "..." }
```

**Данные текущего пользователя:**
```
Файл:     frontend/app/composables/useAuth.ts
Функция:  fetchUser()
Запрос:   GET /users/me
```

> На главной странице (`index.vue`) список блюд сейчас использует **моковые данные**. Реальный запрос к коллекции блюд ещё не реализован — это следующий шаг разработки.

---

## 6. Composables — слой логики

Composable в Vue/Nuxt — это функция, которая инкапсулирует логику и состояние. Аналог сервиса или хелпера в других фреймворках.

| Файл | Роль | Зависит от |
|---|---|---|
| `composables/useDirectus.ts` | Сетевой слой: все HTTP-запросы, управление токеном в куке | — (ядро) |
| `composables/useAuth.ts` | Авторизация: login, signUp, logout, fetchUser, стейт пользователя | `useDirectus` |

`useDirectus.ts` — самый центральный. Если завтра нужно сменить бекенд с Directus на что-то другое, меняем только этот файл.

**Цепочка зависимостей:**
```
pages/*.vue  →  useAuth.ts  →  useDirectus.ts  →  Directus API
                                    ↑
              middleware/auth.global.ts
```

---

## 7. Глобальный стейт

Pinia не используется — только встроенный Nuxt `useState`. Этого достаточно для текущих задач.

| Ключ | Тип | Файл | Что хранит |
|---|---|---|---|
| `'auth:user'` | `DirectusUser \| null` | `useAuth.ts` | Данные текущего пользователя |
| `directus_token` (cookie) | `string \| null` | `useDirectus.ts` | JWT access token |

**Разница:**
- `useState` — реактивный, сбрасывается при закрытии вкладки
- Cookie — персистентный, живёт между сессиями (пока не истечёт)

Поэтому токен в куке (пользователь остаётся залогиненным после обновления страницы), а данные юзера в `useState` (быстрый реактивный доступ без запроса к API).

---

## 8. Схема данных (ERD)

Коллекции описаны в `docs/plan-main.md`. Точная схема видна в Directus → **Settings → Data Model**.

### Коллекции и поля

| Коллекция | Ключевые поля | Связи |
|---|---|---|
| `directus_users` | id (uuid), email, first_name, last_name, role | — (системная) |
| `cook_queue` | id, date, dish_name, status | cook → users (M2O) |
| `orders` | id, status | user → users (M2O); cook_queue → cook_queue (M2O) |
| `order_items` | id, quantity | order → orders (M2O) |
| `transactions` | id, amount, type | — |
| `balances` | id, amount | user → users (M2O) |

**M2O** = Many-to-One (много-к-одному). Например: много заказов (`orders`) принадлежат одному пользователю (`users`).

### ERD-схема

```
[directus_users]
  id (uuid, PK)
  email (string)
  first_name, last_name
  role (FK → directus_roles)
        │
        ├────────────────────────────────────────┐
        │                                        │
        ▼                                        ▼
[cook_queue]                               [orders]
  id (uuid, PK)                              id (uuid, PK)
  date (date)                                status (string)
  dish_name (string)                         user ──────────► [directus_users]
  status (string)                            cook_queue ────► [cook_queue]
  cook ──────────► [directus_users]               │
                                                  ▼
                                           [order_items]
                                             id (uuid, PK)
                                             quantity (int)
                                             order ────────► [orders]

[balances]                          [transactions]
  id (uuid, PK)                       id (uuid, PK)
  amount (decimal)                    amount (decimal)
  user ──► [directus_users]           type (string)
```

### Как показать схему преподу вживую

Открой в браузере: **http://localhost:8055** → Settings → Data Model.
Там видны все коллекции с полями и связями визуально. Это как pgAdmin, только нагляднее.

---

## 9. API Endpoints — полная карта

### Как вообще смотреть эндпоинты

**Способ 1: Swagger UI (интерактивная документация)**

1. Открой: `http://localhost:8055/server/specs/oas` — это JSON с описанием всего API
2. Иди на **editor.swagger.io**
3. File → Import URL → вставь `http://localhost:8055/server/specs/oas`
4. Видишь всё как в FastAPI: методы, параметры, схемы ответов
5. Там много системных эндпоинтов — ищи свои по названию коллекции (например `cook_queue`)

**Способ 2: DevTools Network — живые запросы (лучший для показа преподу)**

1. Открой приложение в браузере
2. `F12` → вкладка **Network** → фильтр **Fetch/XHR**
3. Сделай любое действие (залогинься, перейди на страницу)
4. Кликни на запрос в списке
5. Вкладка **Headers** → видишь:
   - `Request URL`: полный путь (`http://localhost:8055/auth/login`)
   - `Request Method`: `POST` / `GET`
   - `Authorization`: `Bearer eyJhbGc...` — это токен
6. Вкладка **Payload** → видишь тело запроса (`email`, `password`)
7. Вкладка **Response** → видишь ответ (`access_token` и т.д.)

Это прямое доказательство того, что архитектура "живая".

**Способ 3: GraphQL Playground (бонус)**

Directus также поддерживает GraphQL. Открой: `http://localhost:8055/graphql`
Там можно писать запросы прямо в браузере — интерактивно.

---

### Таблица всех используемых эндпоинтов

| Метод | Путь | Файл | Функция | Описание |
|---|---|---|---|---|
| POST | `/auth/login` | `composables/useAuth.ts` | `login()` | Логин, получение токена |
| POST | `/auth/login` | `server/api/auth/signup.post.ts` | прокси | Admin логин при регистрации |
| GET | `/users/me` | `composables/useAuth.ts` | `fetchUser()` | Данные текущего юзера |
| POST | `/users` | `server/api/auth/signup.post.ts` | прокси | Создание нового юзера |
| GET | `/items/cook_queue` | `composables/useAuth.ts` | `isTodayCook()` | Чтение очереди поваров |
| — | `/items/balances` | Запланирован | — | Пока не реализован |

### Внутренние Nuxt роуты (не Directus)

| Метод | Путь | Файл | Описание |
|---|---|---|---|
| POST | `/api/auth/signup` | `server/api/auth/signup.post.ts` | Прокси для регистрации |

---

## 10. Переменные окружения

**Файлы:** `.env`, `.env.example`, `docker-compose.yml`

| Переменная | Пример значения | Где используется | Зачем |
|---|---|---|---|
| `POSTGRES_USER` | `itouser` | docker-compose → postgres | Логин к БД |
| `POSTGRES_PASSWORD` | `itopassword` | docker-compose → postgres | Пароль к БД |
| `POSTGRES_DB` | `itocook_db` | docker-compose → postgres | Имя базы |
| `DIRECTUS_KEY` | `itocook-secret-key-...` | Directus | Уникальный ключ инстанса |
| `DIRECTUS_SECRET` | `itocook-secret-value-...` | Directus | Подпись JWT токенов |
| `DIRECTUS_ADMIN_EMAIL` | `admin@itocook.com` | Directus | Начальный admin |
| `DIRECTUS_ADMIN_PASSWORD` | `admin` | Directus | Пароль admin |
| `NUXT_PUBLIC_DIRECTUS_URL` | `http://localhost:8055` | `useDirectus.ts` | URL для браузера |
| `NUXT_DIRECTUS_ADMIN_EMAIL` | из root `.env` | `signup.post.ts` | Admin логин для прокси |
| `NUXT_DIRECTUS_ADMIN_PASSWORD` | из root `.env` | `signup.post.ts` | Admin пароль для прокси |
| `CORS_ENABLED` | `"true"` | Directus | Разрешить cross-origin запросы |
| `CORS_ORIGIN` | `http://localhost:3000` | Directus | Откуда принимать запросы |

**CORS** — это браузерная защита: браузер не позволяет сайту на `localhost:3000` запрашивать данные с `localhost:8055`, если сервер явно не разрешит это. Мы разрешаем через `CORS_ORIGIN`.

---

## Архитектура "под капотом" — одна схема для всего

```
БРАУЗЕР (пользователь открывает localhost:3000)
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    NUXT (frontend, порт 3000)                │
│                                                              │
│  app.vue → layouts/app.vue → pages/*.vue                     │
│                                                              │
│  ┌──────────────────────┐  ┌────────────────────────────┐    │
│  │  middleware/         │  │  composables/              │    │
│  │  auth.global.ts      │  │  useAuth.ts                │    │
│  │  (охранник страниц)  │  │  (логин/логаут/юзер)       │    │
│  └──────────────────────┘  └────────────┬───────────────┘    │
│                                         │                    │
│                            ┌────────────▼───────────────┐    │
│                            │  composables/              │    │
│                            │  useDirectus.ts            │    │
│                            │  (все HTTP запросы)        │    │
│                            │  + управление токеном      │    │
│                            └────────────┬───────────────┘    │
│                                         │                    │
│  ┌──────────────────────────────────────┘                    │
│  │  server/api/auth/signup.post.ts                           │
│  │  (серверный прокси для регистрации)                       │
│  └──────────────────────────────────────────────────────────┘
└─────────────────────────────┬────────────────────────────────┘
                              │ HTTP (REST API)
                              │ Authorization: Bearer <token>
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                 DIRECTUS (бекенд, порт 8055)                 │
│                                                              │
│  POST /auth/login        → JWT токены                        │
│  GET  /users/me          → данные юзера                      │
│  POST /users             → создать юзера                     │
│  GET  /items/cook_queue  → очередь поваров                   │
│  GET  /items/orders      → заказы                            │
│  ... и т.д. для каждой коллекции                             │
│                                                              │
│  Управление ролями (RBAC) — кто что может читать/писать      │
└─────────────────────────────┬────────────────────────────────┘
                              │ SQL
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              PostgreSQL (база данных, порт 5432)             │
│                                                              │
│  directus_users | cook_queue | orders | order_items          │
│  balances       | transactions                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Готовые ответы для препода

**"Почему Directus, а не самописный FastAPI?"**
> "Directus даёт готовый REST API, JWT-авторизацию и систему ролей из коробки. Это позволяет сфокусироваться на логике приложения, а не писать шаблонный CRUD. При этом FastAPI-сервис уже стоит в инфраструктуре — если понадобится сложная кастомная логика, я добавлю её туда."

**"Где код бекенда?"**
> "Бекенд — это Directus. В нём нет файлов с роутами, потому что они генерируются автоматически на основе коллекций. Это API-first подход: я открою Data Model и покажу все таблицы, а эндпоинты видны в Swagger UI по адресу localhost:8055/server/specs/oas."

**"Как реализована авторизация?"**
> "JWT-токены. Directus выдаёт access_token при логине. Я храню его в cookie через useCookie(). Composable useDirectus.ts добавляет этот токен в заголовок каждого запроса. Middleware auth.global.ts проверяет наличие токена на каждом роуте."

**"Почему регистрация через прокси?"**
> "Потому что создание пользователей требует прав admin. Если делать это из браузера, admin-пароль будет виден в DevTools. Серверный роут Nuxt (signup.post.ts) выступает прокси: берёт admin-данные из .env (которые в браузере недоступны) и делает запрос к Directus на стороне сервера."

**"Как добавить новую таблицу?"**
> "Создаю коллекцию в Directus Data Model — и сразу появляются все CRUD эндпоинты. Дальше просто вызываю их через useDirectus.ts."

