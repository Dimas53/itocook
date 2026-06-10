interface DirectusError {
  errors: Array<{ message: string; extensions: { code: string } }>
}

// ─── useDirectus ────────────────────────────────────────────────────────
// Central composable for Directus API communication.
// Single place in the project where the HTTP client is created.
// All other files (useAuth, components, pages) call request()
// from this file via useDirectus().
// ────────────────────────────────────────────────────────────────────────

export const useDirectus = () => {
  const config = useRuntimeConfig()
  // directus api — URL comes from runtimeConfig.public.directusUrl
  // which comes from either .env (NUXT_PUBLIC_DIRECTUS_URL) or
  // docker-compose.yml. On client: http://localhost:8055
  const baseURL = config.public.directusUrl

  // directus api — token stored in directus_token cookie for 7 days
  const tokenCookie = useCookie<string | null>('directus_token', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: false,
  })

  // directus api — universal request function for Directus
  // method: 'get' | 'post' | 'patch' | 'delete'
  // path: relative path, e.g. /auth/login or /items/cook_queue
  // body: payload for POST/PATCH
  async function request<T = unknown>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // directus api — automatically inject Bearer token from cookie
    const token = tokenCookie.value
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // directus api — the fetch itself: baseURL (http://localhost:8055) + path
    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const json: DirectusError | { data: T } = await res.json()

    if (!res.ok) {
      const err = json as DirectusError
      // directus api — error parsed from Directus format { errors: [{ message }] }
      const message = err.errors?.[0]?.message || 'Request failed'
      throw new Error(message)
    }

    // DEBUG LOGGING (in browser console)
    if (import.meta.dev) {
      console.group(`%c Directus API: ${method.toUpperCase()} ${path}`, 'color: #007bff; font-weight: bold;');
      console.log('Payload:', body);
      console.log('Response:', (json as { data: T }).data);
      console.groupEnd();
    }

    // directus api — response always wrapped in { data: ... }, unwrap
    return (json as { data: T }).data
  }

  return { request, tokenCookie }
}
