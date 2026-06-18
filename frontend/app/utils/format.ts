/**
 * User name formatting utilities.
 */

/** Join first_name + last_name into a readable string with a fallback. */
export function formatUserName(
  user: { first_name?: string | null; last_name?: string | null } | null | undefined,
  fallback = 'Unknown'
): string {
  if (!user) return fallback
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || fallback
}

/** Safely parse a JSON field that may already be an object. */
export function parseJsonField<T>(value: T | string | null | undefined): T | null {
  if (value == null) return null
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T } catch { return null }
  }
  return value as T
}
