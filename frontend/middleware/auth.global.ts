export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth()

  const publicRoutes = ['/onboarding', '/auth']

  if (!isLoggedIn.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/auth')
  }
})
