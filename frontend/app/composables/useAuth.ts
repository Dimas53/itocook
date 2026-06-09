interface DirectusUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
}

interface LoginResponse {
  access_token: string
  expires: number
  refresh_token: string
}

// ─── useAuth ────────────────────────────────────────────────────────────
// Управление аутентификацией: логин, регистрация, выход, получение юзера.
// Полностью завязан на useDirectus().request() — все запросы к Directus
// идут через центральный HTTP-клиент.
// ────────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const { request, tokenCookie } = useDirectus()

  // directus api — глобальное состояние текущего пользователя
  // через useState, чтобы было доступно во всём приложении
  const user = useState<DirectusUser | null>('auth:user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  // ── Регистрация ──────────────────────────────────────────────────────
  // Не идёт напрямую в Directus — сначала через Nuxt server-route
  // (frontend/server/api/auth/signup.post.ts), которая логинится как
  // админ и создаёт юзера через Directus Admin API.
  async function signUp(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<void> {
    // api — POST /api/auth/signup → Nuxt server route
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Registration failed')
    }

    // После успешной регистрации — сразу логинимся
    await login(email, password)
  }

  // ── Логин ────────────────────────────────────────────────────────────
  // directus api — POST /auth/login → Directus auth endpoint
  // Возвращает access_token, refresh_token, expires
  async function login(email: string, password: string): Promise<void> {
    const data = await request<LoginResponse>('post', '/auth/login', {
      email,
      password,
    })
    // directus api — сохраняем access_token в куку
    tokenCookie.value = data.access_token
    // directus api — сразу подтягиваем данные юзера
    await fetchUser()
  }

  // ── Получение текущего юзера ─────────────────────────────────────────
  // directus api — GET /users/me — проверяет токен и возвращает юзера
  async function fetchUser(): Promise<void> {
    const userData = await request<DirectusUser>('get', '/users/me')
    user.value = userData
  }

  // ── Проверка: является ли юзер сегодняшним поваром ──────────────────
  // directus api — GET /items/cook_queue с фильтром по дате и юзеру
  async function isTodayCook(): Promise<boolean> {
    if (!user.value) return false
    const today = new Date().toISOString().split('T')[0]!
    const params = new URLSearchParams({
      'filter[date][_eq]': today,
      'filter[cook][_eq]': user.value.id,
      'filter[status][_nin]': 'cancelled',
      'limit': '1',
    })
    try {
      const cooks = await request<any[]>('get', `/items/cook_queue?${params}`)
      return cooks.length > 0
    } catch {
      return false
    }
  }

  // ── Выход ────────────────────────────────────────────────────────────
  function logout() {
    // directus api — очищаем токен и пользователя
    tokenCookie.value = null
    user.value = null
  }

  return { isLoggedIn, user, signUp, login, logout, fetchUser, isTodayCook }
}
