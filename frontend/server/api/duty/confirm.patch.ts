import { defineEventHandler, readBody, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { id, confirmed } = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id' })
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

  const patchRes = await fetch(`${config.directusUrl}/items/cleaning_schedule/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ confirmed }),
  })

  const patchJson = await patchRes.json()

  if (!patchRes.ok) {
    const err = patchJson as DirectusError
    throw createError({
      statusCode: 500,
      message: err.errors?.[0]?.message || 'Failed to confirm duty',
    })
  }

  return { success: true }
})
