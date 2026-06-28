/**
 * PATCH update the current user's profile (proxied with user's own token).
 * Touches: `directus_users`.
 */
export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const token = getCookie(event, 'directus_token')

  const allowed = ['first_name', 'last_name', 'avatar', 'department']
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const res = await fetch(`${config.directusUrl}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(sanitized),
  })

  return res.json()
})
