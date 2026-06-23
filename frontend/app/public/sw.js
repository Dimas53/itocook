self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch (e) {
    data = { title: 'ItoCook', body: event.data?.text() ?? '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'ItoCook', {
      body: data.body ?? 'Новое уведомление',
      icon: '/images/icon-192.png',
      badge: '/images/icon-192.png',
      data: { url: data.url ?? '/' }
    })
  )
})

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
