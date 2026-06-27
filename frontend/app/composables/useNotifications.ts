/**
 * Manages in-app notification state.
 *
 * Polling strategy: fetches notifications every 20 seconds via setInterval.
 * 20s is short enough to feel responsive (bell badge updates quickly),
 * long enough to avoid unnecessary Directus API load.
 *
 * Directus collections: notifications (read own, update read field only)
 * Nuxt server routes: PATCH /api/notifications/read (admin-proxy batch markAsRead)
 *
 * Exported functions: fetchNotifications, markAsRead, markAllAsRead
 * Exported state: notifications, loading, unreadCount
 */
export interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  date_created: string
}

export function useNotifications() {
  const { request } = useDirectus()
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  /**
   * Fetch latest 20 notifications for the current user.
   * Sets loading=true during fetch; on error notifications become empty array (never null).
   * The $CURRENT_USER filter is required even for admin users (admin_access bypass).
   */
  async function fetchNotifications() {
    loading.value = true
    try {
      const data = await request<Notification[]>('get',
        '/items/notifications?sort=-date_created&limit=20&filter[user][_eq]=$CURRENT_USER'
      )
      notifications.value = data ?? []
    } catch {
      notifications.value = []
    }
    loading.value = false
  }

  /**
   * Mark a single notification as read via admin-proxy PATCH.
   * Optimistically updates local state (no re-fetch).
   * Idempotent: calling on already-read notification is a no-op.
   */
  async function markAsRead(id: string) {
    try {
      await $fetch('/api/notifications/read', {
        method: 'PATCH',
        body: { ids: [id] },
      })
      const n = notifications.value.find(n => n.id === id)
      if (n) n.read = true
    } catch {}
  }

  /**
   * Mark all unread notifications as read in a single admin-proxy PATCH.
   * Skipped if there are no unread items (avoids unnecessary API call).
   * Optimistically updates all local read flags to true.
   */
  async function markAllAsRead() {
    const unread = notifications.value.filter(n => !n.read)
    if (unread.length === 0) return
    try {
      await $fetch('/api/notifications/read', {
        method: 'PATCH',
        body: { ids: unread.map(n => n.id) },
      })
      notifications.value.forEach(n => { n.read = true })
    } catch {}
  }

  onMounted(() => {
    fetchNotifications()
    pollTimer = setInterval(fetchNotifications, 20000)
  })

  onUnmounted(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  })

  return { notifications, loading, unreadCount, fetchNotifications, markAsRead, markAllAsRead }
}
