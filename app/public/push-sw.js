// Web Push for the installed app (A · push notifications).
// Loaded into the Workbox service worker via `importScripts` (see vite.config.ts).
// The server (api/send-push.ts) sends { title, body, url, tag }.

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'TradeMe'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Es gibt Neuigkeiten zu deinen Trades.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      tag: data.tag, // a newer message in the same chat replaces the older one
      renotify: Boolean(data.tag),
      data: { url: data.url || '/benachrichtigungen' },
    }),
  )
})

// Tap on the notification → open (or focus) the app on the right screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin))
      if (open) return open.focus().then(() => open.navigate(url))
      return self.clients.openWindow(url)
    }),
  )
})
