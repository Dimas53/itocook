import { defineEventHandler, readBody, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { email, password, firstName, lastName } = await readBody(event)

  if (!email || !password || !firstName || !lastName) {
    throw createError({ statusCode: 400, message: 'All fields are required' })
  }

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
