interface DirectusError {
  errors: Array<{ message: string; extensions: { code: string } }>
}

// ─── useDirectus ────────────────────────────────────────────────────────
// ЦЕНТРАЛЬНЫЙ композабл для связи с Directus API.
// Единственное место в проекте, где создаётся HTTP-клиент.
// Все остальные файлы (useAuth, компоненты, страницы) вызывают
// request() из этого файла — через useDirectus().
// ────────────────────────────────────────────────────────────────────────

export const useDirectus = () => {
  const config = useRuntimeConfig()
  // directus api — URL берётся из runtimeConfig.public.directusUrl
  // который приходит либо из .env (NUXT_PUBLIC_DIRECTUS_URL), либо из
  // docker-compose.yml. На клиенте: http://localhost:8055
  const baseURL = config.public.directusUrl

  // directus api — токен хранится в куке directus_token на 7 дней
  const tokenCookie = useCookie<string | null>('directus_token', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: false,
  })

  // directus api — универсальная функция запроса к Directus
  // method: 'get' | 'post' | 'patch' | 'delete'
  // path: относительный путь, например /auth/login или /items/cook_queue
  // body: тело для POST/PATCH
  async function request<T = unknown>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // directus api — автоматически подставляем Bearer-токен из куки
    const token = tokenCookie.value
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // directus api — сам fetch: baseURL (http://localhost:8055) + path
    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const json: DirectusError | { data: T } = await res.json()

    if (!res.ok) {
      const err = json as DirectusError
      // directus api — ошибка парсится из Directus-формата { errors: [{ message }] }
      const message = err.errors?.[0]?.message || 'Request failed'
      throw new Error(message)
    }

    // directus api — ответ всегда обёрнут в { data: ... }, распаковываем
    return (json as { data: T }).data
  }

  return { request, tokenCookie }
}
