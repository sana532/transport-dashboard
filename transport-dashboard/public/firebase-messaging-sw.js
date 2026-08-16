/* eslint-disable no-undef */
/* notification-sw-version: 5 — never call showNotification (FCM shows once) */
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDmOsKrJ5nNvPAc5Jq1fvrMtg6WGqE6gWc',
  authDomain: 'musafer-bus-transport.firebaseapp.com',
  projectId: 'musafer-bus-transport',
  storageBucket: 'musafer-bus-transport.firebasestorage.app',
  messagingSenderId: '1096480624317',
  appId: '1:1096480624317:web:a2573e84e6b86cd3cdb1d4',
})

const messaging = firebase.messaging()

function resolveNotificationPath(referenceType, referenceId, directUrl) {
  if (typeof directUrl === 'string' && directUrl.startsWith('/')) return directUrl

  const id =
    typeof referenceId === 'number'
      ? String(referenceId)
      : typeof referenceId === 'string' && referenceId.trim()
        ? referenceId.trim()
        : null

  if (!referenceType || !id) return null

  const type = String(referenceType).split('\\').pop().toLowerCase()

  if (type.includes('trip')) return `/company/trips/${id}`
  if (type.includes('booking')) return `/company/bookings/${id}`
  if (type.includes('complaint')) return `/company/complaints/${id}`

  return null
}

/**
 * Do NOT call showNotification here.
 * The browser already displays FCM `notification` payloads once.
 * Calling showNotification again was causing 2 system toasts.
 */
messaging.onBackgroundMessage(() => {
  // no-op
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data ?? {}
  const path =
    resolveNotificationPath(data.reference_type, data.reference_id, data.url) ??
    '/company/notifications'
  const targetUrl = new URL(path, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (!('focus' in client)) continue
        if (client.url.startsWith(self.location.origin)) {
          return client.focus().then(() => client.navigate(targetUrl))
        }
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
