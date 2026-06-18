import { H3Event, getCookie, createError } from 'h3'

export function requireAuth(event: H3Event): string {
  const token = getCookie(event, 'directus_token')
  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return token
}
