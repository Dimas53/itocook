import { defineEventHandler, readBody, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig(event)
  const { ids } = await readBody(event)

  if (!Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'ids must be a non-empty array' })
  }

  const adminToken = await getAdminToken(config)

  const patchRes = await fetch(`${config.directusUrl}/items/notifications`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      keys: ids,
      data: { read: true },
    }),
  })

  const patchJson = await patchRes.json()

  if (!patchRes.ok) {
    const err = patchJson as DirectusError
    console.error('Failed to mark notifications as read:', err.errors?.[0]?.message)
    throw createError({
      statusCode: 500,
      message: err.errors?.[0]?.message || 'Failed to mark notifications as read',
    })
  }

  return { success: true }
})
