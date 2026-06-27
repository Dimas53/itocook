/**
 * Push notification event handler for the Service Worker.
 *
 * This file runs in the Service Worker context (not in the Vue app).
 * It is imported by the auto-generated sw.js via workbox.importScripts.
 *
 * Two event listeners:
 *  - push: receives push data as JSON, shows system notification
 *  - notificationclick: focuses/navigates to the URL from notification payload
 */

/**
 * Push event: data arrives from the FastAPI /send-push endpoint.
 * Parse as JSON (fallback to raw text if JSON parsing fails).
 * Show a system notification with icon, badge, and embedded URL for click handling.
 */
self.addEventListener('push', (event) => {
    let data = {}
    try {
        data = event.data?.json() ?? {}
    } catch (e) {
        data = { title: 'ItoCook', body: event.data?.text() ?? '' }
    }
    event.waitUntil(
        self.registration.showNotification(data.title ?? 'ItoCook', {
            body: data.body ?? 'New notification',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: { url: data.url ?? '/' }
        })
    )
})

/**
 * Notification click: close the notification, then find an existing window
 * (via clients.matchAll) to focus and navigate, or open a new window.
 * This avoids opening duplicate tabs for the same app.
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data.url || '/'
    const origin = self.location.origin
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                const client = clientList[0]
                return client.focus().then(() => client.navigate(origin + url))
            }
            return clients.openWindow(origin + url)
        })
    )
})