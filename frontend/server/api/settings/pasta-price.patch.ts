import { defineEventHandler, readBody, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { price } = await readBody(event)

  if (typeof price !== 'number' || price < 0) {
    throw createError({ statusCode: 400, message: 'Price must be a positive number' })
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

  const getRes = await fetch(`${config.directusUrl}/items/app_settings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })

  const getJson = await getRes.json()

  if (!getRes.ok || !getJson.data) {
    throw createError({ statusCode: 500, message: 'Failed to read app settings' })
  }

  const settingsId = getJson.data.id

  const patchRes = await fetch(`${config.directusUrl}/items/app_settings/${settingsId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ pasta_package_price: price }),
  })

  const patchJson = await patchRes.json()

  if (!patchRes.ok) {
    const err = patchJson as DirectusError
    throw createError({
      statusCode: 500,
      message: err.errors?.[0]?.message || 'Failed to update pasta price',
    })
  }

  return { success: true, price }
})
