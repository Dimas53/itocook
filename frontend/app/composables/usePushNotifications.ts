export function usePushNotifications() {
  const { request } = useDirectus()

  async function getVapidPublicKey(): Promise<string> {
    const res = await fetch('/api/push/vapid-key')
    const json = await res.json()
    return json.publicKey
  }

  async function subscribe(onLog?: (msg: string) => void) {
    const log = (msg: string) => { onLog?.(msg); console.log(msg) }
    const err = (msg: string, e?: unknown) => { onLog?.(msg); console.error(msg, e) }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      log('[push] not supported')
      return
    }

    let registration: ServiceWorkerRegistration
    try {
      registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      log('[push] SW ready')
    } catch (e) {
      err('[push] SW error', e)
      return
    }

    const permission = await Notification.requestPermission()
    log('[push] permission: ' + permission)
    if (permission !== 'granted') return

    const publicKey = await getVapidPublicKey()
    log('[push] VAPID key length: ' + publicKey?.length)

    let subscription = await registration.pushManager.getSubscription()
    log('[push] existing subscription: ' + (subscription?.endpoint?.slice(0, 60) ?? 'none'))

    if (!subscription) {
      log('[push] creating new subscription...')
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })
        log('[push] subscription created: ' + subscription.endpoint?.slice(0, 60))
      } catch (e) {
        err('[push] subscription ERROR', e)
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
        log('[push] already in Directus, skipping')
      } else {
        await request('post', '/items/push_subscriptions', {
          endpoint: sub.endpoint,
          p256dh: sub.keys?.p256dh,
          auth: sub.keys?.auth
        })
        log('[push] saved to Directus')
      }
    } catch (e) {
      err('[push] save ERROR', e)
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
