import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { AppNotification } from '@/modules/notifications/types'
import {
  getForegroundToastContent,
  listenForForegroundMessages,
  registerWebPush,
  showBrowserNotification,
} from '@/modules/notifications/services/fcmService'
import { notificationsService } from '@/modules/notifications/services/notificationsService'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { useToast } from '@/shared/ui/Toast'

type NotificationsContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  refresh: () => Promise<void>
  refreshUnreadCount: () => Promise<void>
  enablePushNotifications: () => Promise<boolean>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

/** Poll often enough that a new booking shows a toast without relying on FCM. */
const UNREAD_POLL_MS = 8_000

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpenState] = useState(false)

  const unreadCountRef = useRef(0)
  const hydratedRef = useRef(false)
  const isOpenRef = useRef(false)

  const setIsOpen = useCallback((open: boolean) => {
    isOpenRef.current = open
    setIsOpenState(open)
  }, [])

  const showNewNotificationAlert = useCallback(
    (item?: AppNotification | null) => {
      const title = item?.title?.trim() || t('notifications.newToastTitle')
      const body = item?.body?.trim() || t('notifications.newToastBody')

      toast({
        title,
        description: body,
        variant: 'info',
        durationMs: 8_000,
      })

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: body || undefined,
            icon: '/favicon.svg',
            tag: item?.id,
          })
        } catch (err) {
          console.warn('[Notifications] Browser alert failed:', err)
        }
      }
    },
    [t, toast],
  )

  /**
   * Apply a new unread count. After the first hydrate, any increase shows a toast
   * (FCM is unreliable; the bell was updating silently before).
   */
  const applyUnreadCount = useCallback(
    async (nextCount: number, options?: { alertOnIncrease?: boolean; latest?: AppNotification | null }) => {
      const previous = unreadCountRef.current
      const shouldAlert =
        options?.alertOnIncrease !== false &&
        hydratedRef.current &&
        nextCount > previous

      unreadCountRef.current = nextCount
      setUnreadCount(nextCount)

      if (!hydratedRef.current) {
        hydratedRef.current = true
        return
      }

      if (!shouldAlert) return

      if (options?.latest) {
        showNewNotificationAlert(options.latest)
        return
      }

      try {
        const items = await notificationsService.listNotifications({
          read: false,
          per_page: 5,
        })
        setNotifications(items)
        showNewNotificationAlert(items[0] ?? null)
      } catch {
        showNewNotificationAlert(null)
      }
    },
    [showNewNotificationAlert],
  )

  const enablePushNotifications = useCallback(async () => {
    try {
      const token = await registerWebPush({ mayRequestPermission: true })
      return token != null
    } catch (err) {
      console.warn('[FCM] Registration failed:', err)
      return false
    }
  }, [])

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const count = await notificationsService.getUnreadCount()
      await applyUnreadCount(count)
    } catch (err) {
      console.warn('[Notifications] Unread count failed:', err)
    }
  }, [isAuthenticated, applyUnreadCount])

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    setError(null)
    try {
      const [items, count] = await Promise.all([
        notificationsService.listNotifications({ read: false, per_page: 50 }),
        notificationsService.getUnreadCount(),
      ])
      setNotifications(items)
      // Opening the bell should not toast; only background bumps should.
      await applyUnreadCount(count, {
        alertOnIncrease: !isOpenRef.current,
        latest: items[0] ?? null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, applyUnreadCount])

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationsService.markAsRead(notificationId)
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId))
    const next = Math.max(0, unreadCountRef.current - 1)
    unreadCountRef.current = next
    setUnreadCount(next)
  }, [])

  const markAllAsRead = useCallback(async () => {
    await notificationsService.markAllAsRead()
    setNotifications([])
    unreadCountRef.current = 0
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      setError(null)
      setIsOpen(false)
      unreadCountRef.current = 0
      hydratedRef.current = false
      return
    }

    void refreshUnreadCount()
    void registerWebPush({ mayRequestPermission: false }).catch((err) => {
      console.warn('[FCM] Silent registration failed:', err)
    })
  }, [isAuthenticated, refreshUnreadCount])

  useEffect(() => {
    if (!isAuthenticated) return

    const unsubscribe = listenForForegroundMessages((payload) => {
      const { title, body } = getForegroundToastContent(payload)
      toast({ title, description: body || undefined, variant: 'info', durationMs: 8_000 })
      showBrowserNotification(payload)

      // Sync bell without a second toast from applyUnreadCount.
      void (async () => {
        try {
          const [items, count] = await Promise.all([
            notificationsService.listNotifications({ read: false, per_page: 50 }),
            notificationsService.getUnreadCount(),
          ])
          setNotifications(items)
          unreadCountRef.current = count
          setUnreadCount(count)
          hydratedRef.current = true
        } catch (err) {
          console.warn('[Notifications] FCM sync failed:', err)
        }
      })()
    })

    return () => {
      unsubscribe?.()
    }
  }, [isAuthenticated, toast])

  useEffect(() => {
    if (!isAuthenticated) return

    const onFocus = () => {
      void refreshUnreadCount()
      if (isOpenRef.current) void refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [isAuthenticated, refreshUnreadCount, refresh])

  useEffect(() => {
    if (!isAuthenticated) return

    const timer = window.setInterval(() => {
      void refreshUnreadCount()
    }, UNREAD_POLL_MS)

    return () => window.clearInterval(timer)
  }, [isAuthenticated, refreshUnreadCount])

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      isOpen,
      setIsOpen,
      refresh,
      refreshUnreadCount,
      enablePushNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      error,
      isOpen,
      refresh,
      refreshUnreadCount,
      enablePushNotifications,
      markAsRead,
      markAllAsRead,
    ],
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return ctx
}
