/**
 * PATCH update the current user's profile (proxied with user's own token).
 * Touches: `directus_users`.
 */
export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const token = getCookie(event, 'directus_token')

  const res = await fetch(`${config.directusUrl}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  return res.json()
})
