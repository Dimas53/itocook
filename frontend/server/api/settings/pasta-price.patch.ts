/**
 * PATCH update pasta package price in app_settings singleton.
 * Touches: `app_settings`.
 */
import { defineEventHandler, readBody, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig(event)
  const { price } = await readBody(event)

  if (typeof price !== 'number' || price < 0) {
    throw createError({ statusCode: 400, message: 'Price must be a positive number' })
  }

  const adminToken = await getAdminToken(config)

  const patchRes = await fetch(`${config.directusUrl}/items/app_settings`, {
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
