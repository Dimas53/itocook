// ─── auth.global.ts ─────────────────────────────────────────────────────
// Глобальный middleware Nuxt — выполняется при каждом переходе между
// страницами. Проверяет наличие Directus-токена и валидирует его.
// Если токена нет — редирект на /auth.
// ────────────────────────────────────────────────────────────────────────

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/onboarding', '/auth']

  const { tokenCookie } = useDirectus()
  const { user, fetchUser, logout } = useAuth()

  // directus api — читаем токен из куки
  const token = tokenCookie.value

  // ── Публичные страницы ───────────────────────────────────────────────
  if (publicRoutes.includes(to.path)) {
    // Если есть токен, но нет юзера — пробуем подтянуть
    if (token && !user.value) {
      try {
        // directus api — fetchUser() делает GET /users/me для проверки токена
        await fetchUser()
        return navigateTo('/')
      } catch {
        // directus api — токен невалидный, чистим
        logout()
      }
    }
    return
  }

  // ── Защищённые страницы ──────────────────────────────────────────────
  // directus api — если токена нет → на логин
  if (!token) {
    return navigateTo('/auth')
  }

  // Токен есть — проверяем, что он ещё жив
  if (!user.value) {
    try {
      // directus api — GET /users/me — валидируем токен
      await fetchUser()
    } catch {
      // directus api — токен протух → чистим и на логин
      logout()
      return navigateTo('/auth')
    }
  }
})
