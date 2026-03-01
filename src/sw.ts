import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

;(self as ServiceWorkerGlobalScope & { skipWaiting: () => Promise<void> }).skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json?.() as { title?: string; body?: string } | undefined
  const title = data?.title ?? 'Pritness'
  const options: NotificationOptions = {
    body: data?.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'pritness-notification',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus()
      } else if (self.clients.openWindow) {
        self.clients.openWindow('/')
      }
    })
  )
})
