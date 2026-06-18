/**
 * Current user shape returned by Directus GET /users/me.
 */
interface DirectusUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  department: string | null
  avatar: string | null
}

/**
 * Shape of the Directus auth login response.
 */
interface LoginResponse {
  access_token: string
  expires: number
  refresh_token: string
}

/**
 * useAuth - Authentication composable for login, registration, logout, and user state.
 *
 * Depends entirely on useDirectus().request() for all Directus API calls.
 * The user object is stored in useState('auth:user') so it is accessible
 * across the entire app (pages, middleware, components, other composables).
 *
 * Directus endpoints accessed:
 *  - POST /auth/login - authenticate with email + password (via useDirectus.request)
 *  - GET /users/me - fetch current user profile (via useDirectus.request)
 *  - GET /items/cook_queue - check if user is today's cook (via useDirectus.request)
 *  - Nuxt server proxy POST /api/auth/signup - registration (direct fetch, not via useDirectus)
 *
 * Callers:
 *  - auth.vue - login and signup forms
 *  - middleware/auth.global.ts - calls fetchUser() on app init to hydrate user
 *  - middleware/cook.ts - calls isTodayCook() to guard /cook route
 *  - pages (cook.vue, profile.vue, etc.) - access user.value, isLoggedIn
 *  - components (BottomTabBar.vue, etc.) - access isLoggedIn, user
 *
 * Edge cases and gotchas:
 *  - signUp() does NOT go through useDirectus - it fetches a Nuxt server route
 *    (POST /api/auth/signup) which proxies to Directus Admin API. This is because
 *    regular users cannot create new users via Directus API.
 *  - After successful signUp(), login() is called automatically to immediately
 *    authenticate the new user.
 *  - isTodayCook() silently returns false on any error (catch + return false).
 *    This is intentional: the caller (middleware/cook.ts) treats false as
 *    "not-the-cook" and redirects away. An error should not block navigation.
 *  - fetchUser() is not called from logout() - the user state is simply nullified.
 *  - tokenCookie is managed by useDirectus.ts - useAuth only writes (login) and
 *    clears (logout) it.
 */
export const useAuth = () => {
  const { request, tokenCookie } = useDirectus()

  /**
   * Reactive user object shared across the app via useState.
   * null when not logged in.
   */
  const user = useState<DirectusUser | null>('auth:user', () => null)

  /** True when user object is populated. */
  const isLoggedIn = computed(() => !!user.value)

  /**
   * Register a new user via the Nuxt server proxy.
   *
   * Sends POST /api/auth/signup (server proxy) instead of calling Directus directly,
   * because user creation requires admin privileges. After successful registration,
   * automatically logs in the new user.
   *
   * @param firstName User's first name
   * @param lastName  User's last name
   * @param email     User's email address
   * @param password  User's chosen password
   * @throws {Error} If registration fails (server proxy returns non-2xx)
   */
  async function signUp(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<void> {
    // POST /api/auth/signup -> Nuxt server route (admin-proxied)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Registration failed')
    }

    // Auto-login after successful registration
    await login(email, password)
  }

  /**
   * Authenticate with Directus using email and password.
   *
   * Saves the returned access_token to the directus_token cookie (managed by
   * useDirectus), then immediately fetches the user profile to hydrate state.
   *
   * @param email    User's email address
   * @param password User's password
   * @throws {Error} If credentials are invalid or the request fails
   */
  async function login(email: string, password: string): Promise<void> {
    const data = await request<LoginResponse>('post', '/auth/login', {
      email,
      password,
    })
    tokenCookie.value = data.access_token
    await fetchUser()
  }

  /**
   * Fetch the currently authenticated user's profile.
   *
   * Calls GET /users/me which also validates the current token.
   * Hydrates the shared user state - called automatically after login
   * and on app init via middleware/auth.global.ts.
   *
   * @throws {Error} If token is invalid/expired or request fails
   */
  async function fetchUser(): Promise<void> {
    const userData = await request<DirectusUser>('get', '/users/me')
    user.value = userData
  }

  /**
   * Check if the current user is assigned as today's cook.
   *
   * Queries cook_queue for a non-cancelled entry matching today's date
   * and the current user's ID. Returns false if the user is not logged in
   * or if any error occurs (safe fallback).
   *
   * Used by middleware/cook.ts to guard the /cook route - users who are not
   * today's cook get redirected to /kitchen.
   *
   * @returns True if the user has an active cook_queue entry for today
   */
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

  /**
   * Log out the current user.
   *
   * Clears the auth token from cookie and nullifies the user state.
   * Does NOT call the Directus /auth/logout endpoint - on the next app
   * load, middleware/auth.global.ts will detect the missing token and
   * redirect to /auth.
   */
  function logout() {
    tokenCookie.value = null
    user.value = null
  }

  return { isLoggedIn, user, signUp, login, logout, fetchUser, isTodayCook }
}
