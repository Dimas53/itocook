import { defineEventHandler, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

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

  const res = await fetch(`${config.directusUrl}/items/app_settings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })

  const json = await res.json()

  if (!res.ok || !json.data) {
    return { price: 1.00 }
  }

  return { price: parseFloat(json.data.pasta_package_price) || 1.00 }
})
