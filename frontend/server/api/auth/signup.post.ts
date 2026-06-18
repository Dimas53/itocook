import { defineEventHandler, readBody, createError, getRequestIP } from 'h3'

const ipRequestLog = new Map<string, number[]>()

interface DirectusError {
  errors: Array<{ message: string }>
}

// ─── POST /api/auth/signup ──────────────────────────────────────────────
// Nuxt server-route. Прокси для регистрации новых пользователей.
// Нужен потому что Directus не позволяет создавать пользователей
// через публичный API — только через Admin API с токеном админа.
// ────────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const now = Date.now()
  const timestamps = (ipRequestLog.get(ip) ?? []).filter(t => now - t < 60000)
  if (timestamps.length >= 5) {
    throw createError({ statusCode: 429, message: 'Too many requests. Try again later.' })
  }
  timestamps.push(now)
  ipRequestLog.set(ip, timestamps)

  const config = useRuntimeConfig(event)
  const { email, password, firstName, lastName } = await readBody(event)

  if (!email || !password || !firstName || !lastName) {
    throw createError({ statusCode: 400, message: 'All fields are required' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email format' })
  }

  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at least 8 characters with uppercase, lowercase, and a digit',
    })
  }

  if (firstName.length > 100 || lastName.length > 100) {
    throw createError({ statusCode: 400, message: 'Name must be under 100 characters' })
  }

  const adminToken = await getAdminToken(config)

  // ── Шаг 2: создаём нового пользователя через Admin API ───────────────
  // directus api — POST /users с Bearer-токеном админа
  // ВАЖНО: роль '1927ae8a-...' — это UUID роли User в Directus
  const createRes = await fetch(`${config.directusUrl}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      role: '1927ae8a-4442-4097-91ce-0c290b3fc1d4',
    }),
  })

  const createJson = await createRes.json()

  if (!createRes.ok) {
    const err = createJson as DirectusError
    throw createError({
      statusCode: 400,
      message: err.errors?.[0]?.message || 'Registration failed',
    })
  }

  return { success: true }
})
