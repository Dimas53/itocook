/**
 * Date formatting utilities.
 */
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Returns `YYYY-MM-DD` from a Date object. */
export function formatDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Human-readable relative date (Today, Yesterday, N days ago, or short date). */
export function formatDateRelative(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) {
    const h = date.getHours()
    const m = String(date.getMinutes()).padStart(2, '0')
    return `Today ${h}:${m}`
  }
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`
}

/** Short date like `18 Jun`. */
export function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

/** Full date like `Thursday, 18 June 2026`. */
export function formatDateLong(d: Date): string {
  return `${DAY_NAMES_LONG[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

/** Returns the Monday of the week for a given Date. */
export function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

/** Parse an ISO date string into a Date (noon to avoid timezone offset issues). */
export function parseISODate(iso: string): Date {
  return new Date(iso + 'T12:00:00')
}

/** Format ISO string as readable short date like `Mon, Jun 18`. */
export function formatDateReadable(iso: string): string {
  const d = parseISODate(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
