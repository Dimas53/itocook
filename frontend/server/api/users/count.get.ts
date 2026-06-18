import { defineEventHandler, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig(event)

  // Login as admin
  const adminRes = await fetch(`${config.directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: config.directusAdminEmail,
      password: config.directusAdminPassword,
    }),
  })

  const adminJson = await adminRes.json()

  if (!adminRes.ok) {
    const err = adminJson as DirectusError
    throw createError({
      statusCode: 500,
      message: err.errors?.[0]?.message || 'Admin login failed',
    })
  }

  const adminToken = (adminJson as { data: { access_token: string } }).data.access_token

  // Query active user count using /users endpoint (system collections via /items returns 403)
  const countRes = await fetch(
    `${config.directusUrl}/users?aggregate[count]=*&filter[status][_eq]=active&filter[first_name][_nstarts_with]=MCP`,
    {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    }
  )

  const countJson = await countRes.json()

  if (!countRes.ok) {
    const err = countJson as DirectusError
    throw createError({
      statusCode: 500,
      message: err.errors?.[0]?.message || 'Failed to fetch user count',
    })
  }

  // Response format from /users: { data: [{ count: "3" }] }
  // Different from /items/{collection} which returns { data: [{ count: { "*": 3 } }] }
  const raw = countJson as { data: Array<Record<string, unknown>> }
  const rawValue = raw.data?.[0]?.count
  const count = typeof rawValue === 'string' ? parseInt(rawValue, 10) : Number(rawValue) || 0
  return { count }
})
