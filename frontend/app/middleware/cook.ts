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

  function formatDateISO(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
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
