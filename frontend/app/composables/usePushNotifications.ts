/**
 * Manages Web Push subscription lifecycle.
 *
 * Registers the Service Worker, subscribes to Push API with VAPID public key,
 * and stores/checks the subscription in Directus `push_subscriptions` collection.
 *
 * Called from:
 *  - `useAuth.login()` after successful login (non-blocking, silent catch)
 *  - `middleware/auth.global.ts` after fetchUser on page reload (non-blocking)
 *
 * Directus collections: push_subscriptions (create, read own)
 */
export function usePushNotifications() {
  const { request } = useDirectus()

  async function getVapidPublicKey(): Promise<string> {
    const res = await fetch('/api/push/vapid-key')
    const json = await res.json()
    return json.publicKey
  }

  /**
   * Subscribe to push notifications for the current user.
   *
   * Step by step:
   *  1. Check browser support (serviceWorker + PushManager)
   *  2. Register /sw.js and wait for ready
   *  3. Request notification permission from the user
   *  4. Fetch VAPID public key from Nuxt server route /api/push/vapid-key
   *  5. Get existing subscription from pushManager (reuse if present, avoid DOMException)
   *  6. Convert VAPID key from base64 to Uint8Array and subscribe via pushManager
   *  7. Check if endpoint already exists in Directus (dedup — prevents duplicate push per user)
   *  8. If new, POST to /items/push_subscriptions with endpoint, keys, and user.id
   *
   * Why `user.value?.id` is passed explicitly:
   *  The Directus field preset `$CURRENT_USER` only works for UI form submissions.
   *  API calls from JavaScript must include the user field explicitly — otherwise
   *  Directus rejects the POST (required field) or stores null, breaking push delivery.
   */
  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[push] not supported')
      return
    }

    let registration: ServiceWorkerRegistration
    try {
      registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      console.log('[push] SW ready')
    } catch (e) {
      console.log('[push] SW error', e)
      return
    }

    const permission = await Notification.requestPermission()
    console.log('[push] permission:', permission)
    if (permission !== 'granted') return

    const publicKey = await getVapidPublicKey()
    console.log('[push] VAPID key length:', publicKey?.length)

    let subscription = await registration.pushManager.getSubscription()
    console.log('[push] existing subscription:', subscription?.endpoint?.slice(0, 60) ?? 'none')

    if (!subscription) {
      console.log('[push] creating new subscription...')
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })
        console.log('[push] subscription created:', subscription.endpoint?.slice(0, 60))
      } catch (e) {
        console.error('[push] subscription ERROR', e)
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
        console.log('[push] already in Directus, skipping')
      } else {
        const { user } = useAuth()
        await request('post', '/items/push_subscriptions', {
          endpoint: sub.endpoint,
          p256dh: sub.keys?.p256dh,
          auth: sub.keys?.auth,
          user: user.value?.id
        })
        console.log('[push] saved to Directus')
      }
    } catch (e) {
      console.error('[push] save ERROR:', e)
    }
  }

  /**
   * Convert a URL-safe base64 string (VAPID public key) to a Uint8Array.
   *
   * Why this conversion is needed:
   *  The Push API `applicationServerKey` option requires a Uint8Array,
   *  but the VAPID public key is served as a URL-safe base64 string.
   *  This function adds padding, replaces URL-safe characters, decodes
   *  from base64, and maps the raw bytes to a Uint8Array.
   */
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  }

  return { subscribe }
}
