import { defineEventHandler, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

interface DirectusUser {
  id: string
  first_name: string
  last_name: string
  avatar: string | null
  department: string
}

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig(event)

  const adminToken = await getAdminToken(config)

  const res = await fetch(
    `${config.directusUrl}/users?fields[]=id&fields[]=first_name&fields[]=last_name&fields[]=avatar&fields[]=department&filter[status][_eq]=active&filter[first_name][_nstarts_with]=MCP&sort[]=first_name`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  )

  const json = await res.json()

  if (!res.ok) {
    const err = json as DirectusError
    throw createError({
      statusCode: 500,
      message: err.errors?.[0]?.message || 'Failed to fetch users',
    })
  }

  const users = (json as { data: DirectusUser[] }).data ?? []
  return { users }
})
