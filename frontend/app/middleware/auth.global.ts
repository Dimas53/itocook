// ─── auth.global.ts ─────────────────────────────────────────────────────
// Global Nuxt middleware — runs on every route transition.
// Checks for Directus token presence and validates it.
// If no token — redirect to /auth.
// ────────────────────────────────────────────────────────────────────────

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/onboarding', '/auth']

  const { tokenCookie } = useDirectus()
  const { user, fetchUser, logout } = useAuth()

  // directus api — read token from cookie
  const token = tokenCookie.value

  // ── Public pages ──────────────────────────────────────────────────────
  if (publicRoutes.includes(to.path)) {
    // If token exists but user not loaded — try to fetch
    if (token && !user.value) {
      try {
        // directus api — fetchUser() does GET /users/me to validate token
        await fetchUser()
        return navigateTo('/')
      } catch {
        // directus api — token invalid, clear it
        logout()
      }
    }
    return
  }

  // ── Protected pages ──────────────────────────────────────────────────
  // directus api — no token → go to login
  if (!token) {
    return navigateTo('/auth')
  }

  // Token exists — verify it's still valid
  if (!user.value) {
    try {
      // directus api — GET /users/me — validate token
      await fetchUser()
    } catch {
      // directus api — token expired → clear and redirect to login
      logout()
      return navigateTo('/auth')
    }
  }
})
