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

  const date = (to.query.date as string) || new Date().toISOString().split('T')[0]
  const params = new URLSearchParams({
    'filter[date][_eq]': date,
    'filter[cook][_eq]': user.value.id,
    'filter[status][_nin]': 'cancelled',
    'limit': '1',
  })
  try {
    const cooks = await request<any[]>('get', `/items/cook_queue?${params}`)
    if (cooks.length === 0) {
      return navigateTo('/')
    }
  } catch {
    return navigateTo('/')
  }
})
