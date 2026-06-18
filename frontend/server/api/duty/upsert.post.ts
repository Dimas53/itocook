import { defineEventHandler, readBody, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  if (!body.date || !body.user || !body.department) {
    throw createError({ statusCode: 400, message: 'Missing required fields: date, user, department' })
  }

  const adminToken = await getAdminToken(config)

  const payload = {
    date: body.date,
    user: body.user,
    department: body.department,
    confirmed: body.confirmed ?? false,
  }

  let result: Response

  if (body.id) {
    result = await fetch(`${config.directusUrl}/items/cleaning_schedule/${body.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    })
  } else {
    result = await fetch(`${config.directusUrl}/items/cleaning_schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    })
  }

  const json = await result.json()

  if (!result.ok) {
    const err = json as DirectusError
    throw createError({
      statusCode: 500,
      message: err.errors?.[0]?.message || 'Failed to save assignment',
    })
  }

  return { success: true }
})
