import { defineEventHandler, readBody, createError, getRequestIP } from 'h3'

/**
 * In-memory rate-limit store keyed by client IP.
 * Each entry is an array of UNIX timestamps (ms) for requests within the last 60 seconds.
 * Reset on server restart — acceptable for a single-server deployment.
 */
const ipRequestLog = new Map<string, number[]>()

interface DirectusError {
  errors: Array<{ message: string }>
}

/**
 * POST /api/auth/signup  —  Nuxt server route.
 *
 * Proxies user registration to the Directus Admin API.
 * Directus does not allow user creation through its public API;
 * only the Admin API (Bearer token) can create users.
 *
 * **Callers:**
 * - `useAuth.signUp()` in the frontend composable.
 *
 * **Flow:**
 *   1. IP-based rate-limit check (max 5 requests per 60s per IP).
 *   2. Validate required fields: email, password, firstName, lastName.
 *   3. Validate email format (basic regex).
 *   4. Validate password strength: >= 8 chars, uppercase, lowercase, digit.
 *   5. Validate name length (<= 100 characters each).
 *   6. Obtain admin token via server/utils/adminToken.ts.
 *   7. POST to Directus `/users` with admin Bearer token, assigning the User role.
 *   8. Return `{ success: true }` or throw an H3 error with the Directus error message.
 *
 * **Edge cases:**
 * - Duplicate email: Directus returns a 400 with "email" uniqueness violation message,
 *   which is forwarded verbatim to the client.
 * - Network error when fetching admin token: bubbles up as a 500 from `getAdminToken`.
 * - Rate-limit exceeded: 429 with a descriptive message instead of a raw Directus error.
 * - Missing fields: 400 before any API call.
 */
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
