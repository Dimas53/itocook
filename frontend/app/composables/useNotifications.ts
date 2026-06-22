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

  async function fetchNotifications() {
    loading.value = true
    try {
      const data = await request<Notification[]>('get',
        '/items/notifications?sort=-date_created&limit=20'
      )
      notifications.value = data ?? []
    } catch {
      notifications.value = []
    }
    loading.value = false
  }

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
