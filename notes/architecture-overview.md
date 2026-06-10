# ItoCook — Architectural Overview

This document provides a step-by-step walk-through of the ItoCook application's architecture, from infrastructure to data flow.

---

### 1. Инфраструктура (Docker)

The project is orchestrated using Docker Compose, defined in `docker-compose.yml`.

- **Сервисы:**
  - `postgres`: A PostgreSQL 15 database.
  - `directus`: The Directus 11 Headless CMS, which provides the API and admin interface.
  - `frontend`: The Nuxt 4 application (the user-facing client).
  - `api`: A Python FastAPI microservice (currently a stub).

- **Порты:**
  - `postgres`: Слушает на `5432:5432`.
  - `directus`: Слушает на `8055:8055`.
  - `frontend`: Слушает на `3000:3000`.
  - `api`: Слушает на `8000:8000`.

- **Связь Nuxt и Directus:**
  - The Nuxt frontend communicates with the Directus backend via the URL specified in its environment variables.
  - Inside the Docker network, the `frontend` service uses `http://directus:8055` to talk to the Directus service.
  - For client-side requests from the browser, the URL is `http://localhost:8055`.

- **Переменная `DIRECTUS_URL`:**
  - `NUXT_PUBLIC_DIRECTUS_URL` is set to `http://localhost:8055` in `docker-compose.yml`.
  - This variable is accessible on the client-side in the Nuxt app via `useRuntimeConfig().public.directusUrl`, as seen in `frontend/app/composables/useDirectus.ts`.
  - For server-side rendering within the Nuxt context (like in API routes), the non-public `directusUrl` is used, which is `http://directus:8055`.

---

### 2. Запуск приложения

- **Первый файл:** The entry point for the Nuxt application is `frontend/app/app.vue`, which sets up the main layout frame. The actual page content is rendered via `<NuxtPage />` inside the layout.

- **Плагины:** В проекте **не используются** файлы в директории `frontend/app/plugins/`.

- **Инициализация Directus SDK/клиента:**
  - There is no official Directus SDK being used. Instead, a custom composable `frontend/app/composables/useDirectus.ts` handles communication with the Directus API.
  - The `useDirectus` composable exports a `request` function.
  - This function is initialized with the Directus URL from the runtime config: `const baseURL = config.public.directusUrl` which is `http://localhost:8055`.

---

### 3. Аутентификация — полная цепочка

- **Страница логина:** The login and sign-up forms are in `frontend/app/pages/auth.vue`.
  - The function `handleSubmit` is called on form submission.
  - If `isSignUp` is true, it calls `signUp()`. Otherwise, it calls `login()`. Both functions are from the `useAuth` composable.

- **Endpoint запроса:**
  - The `login` function in `frontend/app/composables/useAuth.ts` sends a POST request to `/auth/login`.
  - The `signUp` function makes a `fetch` call to a server-side Nuxt API route: `POST /api/auth/signup`. This route, defined in `frontend/server/api/auth/signup.post.ts`, then acts as a proxy. It first authenticates as an admin user and then sends a request to Directus to create a new user with a specific role.

- **Ответ от Directus:** The `login` endpoint returns an object containing `access_token`, `expires`, and `refresh_token`.

- **Сохранение токена:**
  - The `access_token` is stored in a cookie named `directus_token`.
  - This is handled by the `useCookie` utility in `frontend/app/composables/useDirectus.ts`: `const tokenCookie = useCookie<string | null>('directus_token', ...)`
  - The user's data, once fetched, is stored in a `useState('auth:user', () => null)` variable within `frontend/app/composables/useAuth.ts`.

- **Middleware:**
  - The global middleware `frontend/app/middleware/auth.global.ts` runs on every route change.
  - It checks if the `directus_token` cookie exists.
  - If the user is trying to access a protected route without a token, they are redirected to `/auth`.
  - If a token exists but the user object (`user.value`) is not yet populated, it calls `fetchUser()`. `fetchUser()` sends a `GET /users/me` request to Directus to validate the token and get user data.
  - If `fetchUser()` fails (e.g., token is invalid), it calls `logout()` (which clears the cookie and user state) and redirects to `/auth`.

- **Refresh логика:** **Не реализована.** The current implementation does not handle token expiration or refreshing. When the access token expires, API requests will fail, and the middleware will catch the error, log the user out, and redirect to the auth page.

---

### 4. Страницы и навигация

- **Страницы (`frontend/app/pages/`):**
  - `index.vue`: The main home screen, showing a hero block, widgets, and recent dishes.
  - `onboarding.vue`: The first screen a new user sees.
  - `auth.vue`: Login and Sign Up page.
  - `profile.vue`: User profile page with details and a logout button.
  - `kitchen.vue`: Shows today's cooking plan, a weekly calendar, and dish history.
  - `ai-recipe.vue`: A stub page for an AI recipe feature.
  - `cook.vue`: A stub page for the person who is cooking.
  - `common.vue`: A stub page for common group activities.
  - `duty.vue`: A stub page for the cleaning duty schedule.
  - `finance.vue`: A stub page for financial overviews (for admins).
  - `recipe/today.vue`: A stub for viewing a specific recipe.

- **Нижний Nav:**
  - The navigation bar is implemented in `frontend/app/components/BottomTabBar.vue`.
  - It determines the active tab by comparing the current `route.path` with the routes defined in its `tabs` computed property.
  - It conditionally renders the "Finance" tab (`PhChartBar` icon) instead of the "AI Recipe" tab (`PhSparkle` icon) if the user has a non-standard role, as determined by `isFinanceRole`.

- **Layouts:**
  - `frontend/app/layouts/default.vue`: A basic layout that provides the iPhone frame and status bar. Used for pages like `/onboarding` and `/auth`.
  - `frontend/app/layouts/app.vue`: The main application layout. It includes the iPhone frame, status bar, and embeds the `<BottomTabBar />`. Page content is rendered inside a scrollable area with padding. This is the primary layout for authenticated users.

---

### 5. Работа с данными Directus

- **Способ запросов:** All requests are made using a custom `request` function within the `frontend/app/composables/useDirectus.ts` composable, which uses native `fetch`. It is not using the official Directus JS SDK.

- **Пример чтения списка:** The project currently uses mock data for the list of dishes on the home page (`frontend/app/pages/index.vue`). There is no concrete example of fetching a list of dishes from Directus yet. However, the logic in `isTodayCook()` inside `useAuth.ts` shows how a list would be read: it makes a GET request to `/items/cook_queue` with filter parameters.

- **Пример создания записи:** A new user record is created in `frontend/server/api/auth/signup.post.ts`. It sends a `POST` request to the `/users` endpoint with the new user's data.

- **Передача токена:** The `request` function in `useDirectus.ts` automatically attaches the authentication token. It reads the token from the `tokenCookie` and adds it to the `Authorization` header for every request: `headers['Authorization'] = \`Bearer \${token}\``.

---

### 6. Composables

- **`frontend/app/composables/useDirectus.ts`**: The core composable for backend communication. It provides the `request` function that wraps `fetch` to handle headers, token attachment, and error handling for all Directus API calls. It also manages the `directus_token` cookie.
- **`frontend/app/composables/useAuth.ts`**: Manages all authentication-related logic. It depends on `useDirectus`. It handles `signUp`, `login`, `logout`, `fetchUser`, and stores the user's state.

- **"Центральный" composable:** `useDirectus.ts` is the most central, as all communication with the backend, including authentication, relies on it. `useAuth.ts` is built on top of it.

---

### 7. State management

- **Хранилище стейта:** The project uses Nuxt's built-in `useState` for global state management. There is no Pinia or other external state management library installed.
- **Что хранится глобально:**
  - **User object:** `const user = useState<DirectusUser | null>('auth:user', () => null)` in `useAuth.ts` stores the currently logged-in user's data.
  - **Auth token:** While not in `useState`, the token is stored globally and persistently in the `directus_token` cookie, managed by `useDirectus.ts`.

---

### 8. Схема данных

Information on the exact database schema is not available from the provided files alone. The `docs/plan-main.md` and `docs/progress.md` files describe the intended collections, but a live introspection of the Directus instance would be needed for a definitive schema.

**Предполагаемые коллекции (из документации):**
- `users`: User data.
- `cook_queue`: Who is cooking on what date.
- `orders`: Tracks who has signed up for a meal.
- `order_items`: A junction table for orders and users/dishes.
- `transactions`: Financial transactions for balance changes.
- `balances`: Each user's current balance.

**Примерная ERD-схема (на основе `docs/plan-main.md`):**

```
[users] 1--< [cook_queue] >--1 [dishes]
  id (uuid)      id (uuid)          id (uuid)
  email          date               name
  first_name     cook (m2o-users)   description
  last_name      dish_name          
                 status

[users] 1--< [orders] >--1 [cook_queue]
  id (uuid)      id (uuid)         id (uuid)
                 user (m2o-users)  date
                 cook_queue(m2o)   cook
                 status

[orders] 1--< [order_items]
  id (uuid)      id (uuid)
                 order (m2o-orders)
                 quantity
```

---

### 9. API Endpoints (используемые в коде)

- `POST   /auth/login`              → `frontend/app/composables/useAuth.ts` → `login()`
- `GET    /users/me`                → `frontend/app/composables/useAuth.ts` → `fetchUser()`
- `POST   /api/auth/signup` (Nuxt Endpoint) → `frontend/app/composables/useAuth.ts` → `signUp()`
  - This Nuxt endpoint internally calls:
    - `POST /auth/login` (for admin)
    - `POST /users` (to create the new user)
- `GET    /items/cook_queue`        → `frontend/app/composables/useAuth.ts` → `isTodayCook()`
- `GET    /items/balances`          → `frontend/app/components/BalanceWidget.vue` (indirectly via a composable that is not yet created but planned).

---

### 10. Переменные окружения

From `.env.example` and `docker-compose.yml`:

- **`POSTGRES_USER`**: `itouser` - Username for the PostgreSQL database.
- **`POSTGRES_PASSWORD`**: `itopassword` - Password for the PostgreSQL database.
- **`POSTGRES_DB`**: `itocook_db` - Name of the database.
- **`DIRECTUS_KEY`**: `itocook-secret-key-change-me` - A unique secret key for the Directus instance.
- **`DIRECTUS_SECRET`**: `itocook-secret-value-change-me` - A secret string for token validation.
- **`DIRECTUS_ADMIN_EMAIL`**: `admin@itocook.com` - Email for the initial Directus admin user.
- **`DIRECTUS_ADMIN_PASSWORD`**: `admin` - Password for the initial Directus admin user.
- **`NUXT_PUBLIC_DIRECTUS_URL`**: `http://localhost:8055` (in docker-compose) or `http://directus:8055` (in .env.example) - The URL of the Directus API accessible from the client's browser. Used in `useDirectus.ts`.
- **`NUXT_DIRECTUS_ADMIN_EMAIL`**: Injected from the root `.env` into the `frontend` service. Used by the Nuxt server route `signup.post.ts` to log in as admin.
- **`NUXT_DIRECTUS_ADMIN_PASSWORD`**: Injected from the root `.env`. Also used by `signup.post.ts`.
- **`CORS_ENABLED`**: `"true"` - Enables CORS in Directus.
- **`CORS_ORIGIN`**: `"http://localhost:3000"` - Specifies the allowed origin for CORS requests.
