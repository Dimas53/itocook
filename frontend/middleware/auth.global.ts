export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/onboarding', '/auth']

  const { tokenCookie } = useDirectus()
  const { user, fetchUser, logout } = useAuth()

  const token = tokenCookie.value

  if (publicRoutes.includes(to.path)) {
    if (token && !user.value) {
      try {
        await fetchUser()
        return navigateTo('/')
      } catch {
        logout()
      }
    }
    return
  }

  if (!token) {
    return navigateTo('/auth')
  }

  if (!user.value) {
    try {
      await fetchUser()
    } catch {
      logout()
      return navigateTo('/auth')
    }
  }
})
