/**
 * PATCH confirm/unconfirm a cleaning schedule entry.
 * Touches: `cleaning_schedule`.
 */
import { defineEventHandler, readBody, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig(event)
  const { id, confirmed } = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id' })
  }

  const adminToken = await getAdminToken(config)

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
