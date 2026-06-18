import { createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

let cachedToken: { token: string; expiresAt: number } | null = null

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
