export function usePushNotifications() {
  const { request } = useDirectus()

  async function getVapidPublicKey(): Promise<string> {
    const res = await fetch('/api/push/vapid-key')
    const json = await res.json()
    return json.publicKey
  }

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[push] не поддерживается')
      return
    }

    let registration: ServiceWorkerRegistration
    try {
      registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      console.log('[push] SW готов')
    } catch (e) {
      console.log('[push] SW ошибка', e)
      return
    }

    const permission = await Notification.requestPermission()
    console.log('[push] разрешение:', permission)
    if (permission !== 'granted') return

    const publicKey = await getVapidPublicKey()
    console.log('[push] VAPID key длина:', publicKey?.length)

    let subscription = await registration.pushManager.getSubscription()
    console.log('[push] существующая подписка:', subscription?.endpoint?.slice(0, 60) ?? 'нет')

    if (!subscription) {
      console.log('[push] создаём новую подписку...')
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })
        console.log('[push] подписка создана:', subscription.endpoint?.slice(0, 60))
      } catch (e) {
        console.error('[push] ОШИБКА подписки:', e)
        return
      }
    }

    const sub = subscription.toJSON()

    try {
      const endpoint = sub.endpoint
      const existing = await request<Array<{ id: string }>>(
        'get',
        `/items/push_subscriptions?filter[endpoint][_eq]=${encodeURIComponent(endpoint)}`
      )

      if (Array.isArray(existing) && existing.length > 0) {
        console.log('[push] уже есть в Directus, пропускаем')
      } else {
        await request('post', '/items/push_subscriptions', {
          endpoint: sub.endpoint,
          p256dh: sub.keys?.p256dh,
          auth: sub.keys?.auth
        })
        console.log('[push] сохранено в Directus')
      }
    } catch (e) {
      console.error('[push] ОШИБКА сохранения:', e)
    }
  }

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  }

  return { subscribe }
}
