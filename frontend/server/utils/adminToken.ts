import { createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

/**
 * In-memory cache for the Directus admin Bearer token.
 * The token is valid for 24 hours by default; we cache it for 23 hours
 * to avoid expiration race conditions. Reset on server restart.
 * Single-server deployment — acceptable tradeoff.
 */
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Obtain (or return cached) Directus admin access token.
 *
 * Called by Nuxt server routes that need to proxy admin-privileged
 * requests to Directus (signup, deduction confirm, etc.).
 *
 * **Callers:**
 * - `server/api/auth/signup.post.ts`
 * - `server/api/deduction/confirm.post.ts`
 * - `server/api/duty/upsert.post.ts`
 * - `server/api/duty/confirm.post.ts`
 * - `server/api/users/list.get.ts`
 * - `server/api/settings/pasta-price.get.ts`
 * - `server/api/settings/pasta-price.patch.ts`
 *
 * **Flow:**
 *   1. If cached token is still valid (< 23h old), return it.
 *   2. POST to Directus `/auth/login` with admin email + password from runtime config.
 *   3. Cache the access token with a 23-hour TTL.
 *   4. Return the token string.
 *
 * **Edge cases:**
 * - Directus down / wrong credentials → throws 500 with Directus error message.
 * - Successful login but no token in response → throws 500 (should not happen).
 */
export async function getAdminToken(config: {
  directusUrl: string
  directusAdminEmail: string
  directusAdminPassword: string
}): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const res = await fetch(`${config.directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: config.directusAdminEmail,
      password: config.directusAdminPassword,
    }),
  })

  const json = await res.json() as { data?: { access_token: string } } & DirectusError

  if (!res.ok) {
    throw createError({
      statusCode: 500,
      message: json.errors?.[0]?.message || 'Admin login failed',
    })
  }

  if (!json.data?.access_token) {
    throw createError({
      statusCode: 500,
      message: 'Admin login succeeded but no access token returned',
    })
  }

  const token = json.data.access_token
  cachedToken = { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 }
  return token
}
