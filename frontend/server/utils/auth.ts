/**
 * Auth helper that reads the `directus_token` cookie and throws 401 if missing.
 * Used by all protected server routes.
 */
import { H3Event, getCookie, createError } from 'h3'

export function requireAuth(event: H3Event): string {
  const token = getCookie(event, 'directus_token')
  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return token
}
