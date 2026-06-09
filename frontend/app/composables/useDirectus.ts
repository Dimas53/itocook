interface DirectusError {
  errors: Array<{ message: string; extensions: { code: string } }>
}

export const useDirectus = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.directusUrl

  const tokenCookie = useCookie<string | null>('directus_token', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: false,
  })

  async function request<T = unknown>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = tokenCookie.value
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const json: DirectusError | { data: T } = await res.json()

    if (!res.ok) {
      const err = json as DirectusError
      const message = err.errors?.[0]?.message || 'Request failed'
      throw new Error(message)
    }

    return (json as { data: T }).data
  }

  return { request, tokenCookie }
}
