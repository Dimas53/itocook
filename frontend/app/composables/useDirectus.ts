/**
 * Directus API error shape returned on non-2xx responses.
 * @see https://docs.directus.io/reference/errors.html
 */
interface DirectusError {
  errors: Array<{ message: string; extensions: { code: string } }>
}

/**
 * useDirectus - Central HTTP client for all Directus API communication.
 *
 * Every data request in the application (from useAuth, useDeduction, useParticipants,
 * useBalanceCheck, useLikes, useRecipeServings, middleware, and all pages) flows through
 * this single composable. It provides:
 *  - Auto-injected 'Authorization: Bearer' header from the directus_token cookie
 *  - Automatic unwrapping of Directus '{ data: ... }' response wrapper
 *  - Parsing of Directus error format into plain Error messages
 *  - File upload with folder fallback for Directus versions that ignore 'folder' on POST
 *
 * Directus collections accessed:
 *  - All: every Directus endpoint is called via request() - items, users, auth, files, settings
 *
 * Callers:
 *  useAuth            - login, fetchUser, isTodayCook
 *  useDeduction       - confirmDeduction, loadPastaCost, cleanupShoppingList
 *  useParticipants    - join(), fetch()
 *  useBalanceCheck    - check balance gate threshold
 *  useLikes           - like/unlike recipes
 *  useRecipeServings  - save servings + scaled ingredients
 *  middleware/cook.ts - fetch today's queue entry
 *  middleware/auth.global.ts - read token cookie
 *  All .vue pages     - ad-hoc requests for page data
 *
 * Edge cases and gotchas:
 *  - request() uses res.text() + conditional JSON.parse() instead of res.json()
 *    to handle 204 No Content responses (DELETE endpoints that return empty body).
 *  - tokenCookie has httpOnly: false because client-side JS reads it to attach
 *    the Bearer header. This is a trade-off: the token is readable by XSS, but Directus
 *    CORS policy prevents direct browser-to-Directus auth for cross-origin requests.
 *  - secure: !import.meta.dev - HTTPS-only in production, HTTP in dev (localhost).
 *  - uploadFile() performs a secondary PATCH to set 'folder' on the uploaded file,
 *    because some Directus versions ignore the 'folder' field on the initial POST /files.
 *    If the PATCH fails, it logs a warning but does not throw - the file is still uploaded.
 *  - Debug logging is commented out (/* * /) to avoid console noise; uncomment for dev.
 *  - useDirectus() must be called during component/composable setup (synchronous Nuxt
 *    context). Calling it inside async handlers (setTimeout, event callbacks) will lose
 *    Nuxt context for useRuntimeConfig and useCookie.
 */

export const useDirectus = () => {
  const config = useRuntimeConfig()
  // directus api — URL comes from runtimeConfig.public.directusUrl
  // which comes from either .env (NUXT_PUBLIC_DIRECTUS_URL) or
  // docker-compose.yml. On client: http://localhost:8055
  const baseURL = config.public.directusUrl

  /**
   * Persisted auth token stored in a directus_token cookie (7-day TTL).
   *
   * - httpOnly: false - required because client-side JS reads it to set the Bearer header
   * - secure: !import.meta.dev - HTTPS only in production
   * - sameSite: 'lax' - allows top-level navigation redirects to carry the cookie
   *
   * Read by middleware/auth.global.ts to check login status.
   * Written by useAuth.login().
   * Cleared by useAuth.logout().
   */
  const tokenCookie = useCookie<string | null>('directus_token', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    httpOnly: false,
    secure: !import.meta.dev,
  })

  /**
   * Generic HTTP request to the Directus REST API.
   *
   * Attaches the Bearer token from directus_token cookie, serialises body as JSON,
   * and unwraps the Directus '{ data: ... }' response wrapper.
   *
   * @param method  HTTP method: 'get' | 'post' | 'patch' | 'delete'
   * @param path    Relative API path, e.g. '/auth/login' or '/items/cook_queue'
   * @param body    Payload for POST/PATCH (optional)
   * @returns       The unwrapped 'data' field from the Directus response
   *
   * @throws {Error} With the Directus error message if the response is non-2xx
   *
   * @note Handles 204 No Content (DELETE) via res.text() + conditional parse.
   *       Using res.json() directly would crash on empty responses.
   */
  async function request<T = unknown>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // directus api — automatically inject Bearer token from cookie
    const token = tokenCookie.value
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // directus api — the fetch itself: baseURL (http://localhost:8055) + path
    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    // Handle empty response body (e.g. 204 No Content from DELETE)
    const text = await res.text()
    const json: DirectusError | { data: T } | Record<string, never> = text ? JSON.parse(text) : {}

    if (!res.ok) {
      const err = json as DirectusError
      // directus api — error parsed from Directus format { errors: [{ message }] }
      const message = err.errors?.[0]?.message || 'Request failed'
      throw new Error(message)
    }

    // DEBUG LOGGING (in browser console)
/*    if (import.meta.dev) {
      console.group(`%c Directus API: ${method.toUpperCase()} ${path}`, 'color: #007bff; font-weight: bold;');
      console.log('Payload:', body);
      console.log('Response:', text ? (json as { data: T }).data : '(empty)');
      console.groupEnd();
    }*/

    // directus api — response always wrapped in { data: ... }, unwrap
    return text ? (json as { data: T }).data : undefined as T
  }

  /**
   * Upload a file to Directus Files storage.
   *
   * Performs a POST multipart/form-data to /files, then conditionally PATCHes the
   * created file to set its 'folder' (some Directus versions ignore 'folder' on POST).
   *
   * Used by:
   *  - recipe/create.vue - recipe photo upload
   *  - profile.vue - avatar upload
   *
   * @param file   Browser File object to upload
   * @param folder Folder UUID or name to organise the file in (optional)
   * @returns      { id: string } - the UUID assigned by Directus
   *
   * @throws {Error} If the initial POST upload fails
   * @note         If the folder PATCH fails, a console.warn is emitted but no error
   *               is thrown - the file is stored but un-filed.
   */
  async function uploadFile(file: File, folder?: string): Promise<{ id: string }> {
    const token = tokenCookie.value
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder || '')

    const res = await fetch(`${baseURL}/files`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const text = await res.text()
    const json = text ? JSON.parse(text) : {}

    if (!res.ok) {
      const err = json as DirectusError
      throw new Error(err.errors?.[0]?.message || 'Upload failed')
    }

    const result = (json as { data: { id: string } }).data

    // Ensure folder is set (POST /files folder field may be ignored in some Directus versions)
    if (folder && result.id) {
      const patchRes = await fetch(`${baseURL}/files/${result.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      })
      if (!patchRes.ok) {
        const patchText = await patchRes.text()
        const patchJson = patchText ? JSON.parse(patchText) : {}
        const err = patchJson as DirectusError
        console.warn('Failed to set folder on uploaded file:', err.errors?.[0]?.message)
      }
    }

    return result
  }

  /**
   * Delete a file from Directus Files by its UUID.
   *
   * Used by:
   *  - recipe/create.vue - cleanup orphaned file on save failure, or replace old photo on edit
   *
   * @param id Directus file UUID
   * @throws {Error} If the DELETE request fails
   * @note The response is typically 204 No Content - request() handles this via text+parse.
   */
  async function deleteFile(id: string): Promise<void> {
    const token = tokenCookie.value
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${baseURL}/files/${id}`, {
      method: 'DELETE',
      headers,
    })

    if (!res.ok) {
      const text = await res.text()
      const json = text ? JSON.parse(text) : {}
      const err = json as DirectusError
      throw new Error(err.errors?.[0]?.message || 'Delete failed')
    }
  }

  return { request, uploadFile, deleteFile, tokenCookie }
}
