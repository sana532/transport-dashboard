import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from 'firebase/messaging'
import { firebaseApp, firebaseVapidKey, isFirebaseConfigured } from '@/config/firebase'
import { notificationsService } from '@/modules/notifications/services/notificationsService'

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
  if (existing) return existing

  return navigator.serviceWorker.register(SW_PATH)
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

  await notificationsService.registerFcmToken({ token, platform: 'web' })
  return token
}

export function listenForForegroundMessages(
  callback: (payload: MessagePayload) => void,
): (() => void) | null {
  if (!isFirebaseConfigured || !firebaseApp) return null

  const messaging = getMessaging(firebaseApp)
  return onMessage(messaging, callback)
}

/** Extract title/body from an FCM payload for in-app toasts. */
export function getForegroundToastContent(payload: MessagePayload): {
  title: string
  body: string
} {
  const title =
    payload.notification?.title ??
    (typeof payload.data?.title === 'string' ? payload.data.title : 'Notification')
  const body =
    payload.notification?.body ??
    (typeof payload.data?.body === 'string' ? payload.data.body : '')

  return { title, body }
}

/** System/browser notification (works alongside in-app toast). */
export function showBrowserNotification(payload: MessagePayload): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const { title, body } = getForegroundToastContent(payload)

  new Notification(title, {
    body,
    icon: '/favicon.svg',
  })
}
