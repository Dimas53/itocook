/**
 * Route guard for `/cook` (Cook Panel).
 *
 * Only the assigned cook for the current day is allowed to access the page.
 * Admin/finance users bypass the cook-queue check but must be logged in.
 *
 * **Redirect rules:**
 * - Not logged in → `/auth`
 * - Admin/finance role → allow (no queue check)
 * - `?action=become` query param → allow (used to jump directly to cook assignment)
 * - No active cook_queue entry for today → redirect to `/`
 * - Network/API error → redirect to `/` (fail safe)
 *
 * **Callers:**
 * - Applied automatically by Nuxt to all routes matching the `cook` pattern
 *   (configured in page meta or file-based routing).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user } = useAuth()
  const { request } = useDirectus()

  if (!user.value) {
    return navigateTo('/auth')
  }

  const isUserRole = user.value.role === '1927ae8a-4442-4097-91ce-0c290b3fc1d4'
  if (!isUserRole) {
    return
  }

  if (to.query.action === 'become') {
    return
  }

  const date = (to.query.date as string) || formatDateISO(new Date())
  const params = new URLSearchParams()
  params.append('filter[date][_eq]', date)
  params.append('filter[cook][_eq]', user.value.id)
  params.append('filter[status][_nin][]', 'cancelled')
  params.append('limit', '1')
  try {
    const cooks = await request<any[]>('get', `/items/cook_queue?${params}`)
    if (cooks.length === 0) {
      return navigateTo('/')
    }
  } catch {
    return navigateTo('/')
  }
})
