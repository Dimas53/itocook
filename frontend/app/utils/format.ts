export function formatUserName(
  user: { first_name?: string | null; last_name?: string | null } | null | undefined,
  fallback = 'Unknown'
): string {
  if (!user) return fallback
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || fallback
}
