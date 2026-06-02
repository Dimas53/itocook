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

export const useAuth = () => {
  const { request, tokenCookie } = useDirectus()

  const user = useState<DirectusUser | null>('auth:user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  async function signUp(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<void> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Registration failed')
    }

    await login(email, password)
  }

  async function login(email: string, password: string): Promise<void> {
    const data = await request<LoginResponse>('post', '/auth/login', {
      email,
      password,
    })
    tokenCookie.value = data.access_token
    await fetchUser()
  }

  async function fetchUser(): Promise<void> {
    const userData = await request<DirectusUser>('get', '/users/me')
    user.value = userData
  }

  async function isTodayCook(): Promise<boolean> {
    if (!user.value) return false
    const today = new Date().toISOString().split('T')[0]
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

  function logout() {
    tokenCookie.value = null
    user.value = null
  }

  return { isLoggedIn, user, signUp, login, logout, fetchUser, isTodayCook }
}
