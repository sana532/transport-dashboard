import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from 'firebase/messaging'
import { firebaseApp, firebaseVapidKey, isFirebaseConfigured } from '@/config/firebase'
import { notificationsService } from '@/modules/notifications/services/notificationsService'
import { notificationIconUrl } from '@/modules/notifications/utils/notificationIconUrl'
import { readStoredLocale } from '@/shared/i18n/config'

const SW_PATH = '/firebase-messaging-sw.js'

export async function isFcmSupported(): Promise<boolean> {
  if (!isFirebaseConfigured || !firebaseApp) return false
  try {
    return await isSupported()
  } catch {
    return false
  }
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null

  const existing = await navigator.serviceWorker.getRegistration(SW_PATH)
  if (existing) {
    void existing.update()
    return existing
  }

  return navigator.serviceWorker.register(SW_PATH, { updateViaCache: 'none' })
}

export async function registerWebPush(options?: {
  /** Only true inside a click/tap handler — browsers block automatic prompts. */
  mayRequestPermission?: boolean
}): Promise<string | null> {
  if (!('Notification' in window)) return null

  let permission = Notification.permission
  if (permission === 'default' && options?.mayRequestPermission) {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') return null

  if (!(await isFcmSupported()) || !firebaseApp) return null
  if (!firebaseVapidKey) {
    console.warn('[FCM] Missing VITE_FIREBASE_VAPID_KEY')
    return null
  }

  const registration = await ensureServiceWorker()
  if (!registration) return null
  await navigator.serviceWorker.ready

  const messaging = getMessaging(firebaseApp)
  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  })

  if (!token) return null

  const locale = readStoredLocale()
  await notificationsService.registerFcmToken({
    token,
    platform: 'web',
    locale,
    language: locale,
  })
  return token
}

export function listenForForegroundMessages(
  callback: (payload: MessagePayload) => void,
): (() => void) | null {
  if (!isFirebaseConfigured || !firebaseApp) return null

  const messaging = getMessaging(firebaseApp)
  return onMessage(messaging, callback)
}

function readDataString(
  data: Record<string, unknown> | undefined,
  ...keys: string[]
): string | null {
  if (!data) return null
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

/** Extract title/body from an FCM payload for in-app toasts. */
export function getForegroundToastContent(payload: MessagePayload): {
  title: string
  body: string
} {
  const data = payload.data as Record<string, unknown> | undefined

  const title =
    payload.notification?.title ??
    readDataString(data, 'title', 'notification_title', 'subject') ??
    'Notification'

  const body =
    payload.notification?.body ??
    readDataString(data, 'body', 'message', 'notification_body') ??
    ''

  return { title, body }
}

/** System/browser notification (works alongside in-app toast). */
export function showBrowserNotification(payload: MessagePayload): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const { title, body } = getForegroundToastContent(payload)

  try {
    new Notification(title, {
      body: body || undefined,
      icon: notificationIconUrl(),
      tag:
        readDataString(
          payload.data as Record<string, unknown> | undefined,
          'id',
          'notification_id',
        ) ?? `fcm-${title}`.slice(0, 64),
      renotify: false,
    })
  } catch (err) {
    console.warn('[FCM] Browser notification failed:', err)
  }
}
