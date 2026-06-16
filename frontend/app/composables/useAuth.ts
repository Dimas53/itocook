interface DirectusUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  department: string | null
  avatar: string | null
}

interface LoginResponse {
  access_token: string
  expires: number
  refresh_token: string
}

// ─── useAuth ────────────────────────────────────────────────────────────
// Manages authentication: login, registration, logout, fetch user.
// Fully depends on useDirectus().request() — all requests to Directus
// go through the central HTTP client.
// ────────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const { request, tokenCookie } = useDirectus()

  // directus api — global reactive state for current user
  // via useState so it's accessible across the whole app
  const user = useState<DirectusUser | null>('auth:user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  // ── Registration ─────────────────────────────────────────────────────
  // Does not go directly to Directus — first through a Nuxt server-route
  // (frontend/server/api/auth/signup.post.ts), which logs in as
  // admin and creates the user via Directus Admin API.
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

    // After successful registration — log in immediately
    await login(email, password)
  }

  // ── Login ─────────────────────────────────────────────────────────────
  // directus api — POST /auth/login → Directus auth endpoint
  // Returns access_token, refresh_token, expires
  async function login(email: string, password: string): Promise<void> {
    const data = await request<LoginResponse>('post', '/auth/login', {
      email,
      password,
    })
    // directus api — save access_token to cookie
    tokenCookie.value = data.access_token
    // directus api — immediately fetch user data
    await fetchUser()
  }

  // ── Fetch current user ────────────────────────────────────────────────
  // directus api — GET /users/me — validates token and returns user
  async function fetchUser(): Promise<void> {
    const userData = await request<DirectusUser>('get', '/users/me')
    user.value = userData
  }

  // ── Check: is user today's cook ────────────────────────────────────────
  // directus api — GET /items/cook_queue filtered by date and user
  async function isTodayCook(): Promise<boolean> {
    if (!user.value) return false
    const today = new Date().toISOString().split('T')[0]!
    const params = new URLSearchParams()
    params.append('filter[date][_eq]', today)
    params.append('filter[cook][_eq]', user.value.id)
    params.append('filter[status][_nin][]', 'cancelled')
    params.append('limit', '1')
    try {
      const cooks = await request<any[]>('get', `/items/cook_queue?${params}`)
      return cooks.length > 0
    } catch {
      return false
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────
  function logout() {
    // directus api — clear token and user
    tokenCookie.value = null
    user.value = null
  }

  return { isLoggedIn, user, signUp, login, logout, fetchUser, isTodayCook }
}
