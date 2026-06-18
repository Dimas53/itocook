import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig(event)

  const adminToken = await getAdminToken(config)

  const res = await fetch(`${config.directusUrl}/items/app_settings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })

  const json = await res.json()

  if (!res.ok || !json.data) {
    return { price: 1.00 }
  }

  return { price: parseFloat(json.data.pasta_package_price) || 1.00 }
})
