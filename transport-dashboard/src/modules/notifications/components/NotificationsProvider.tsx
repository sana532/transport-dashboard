import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { AppNotification } from '@/modules/notifications/types'
import {
  listenForForegroundMessages,
  registerWebPush,
  showBrowserNotification,
} from '@/modules/notifications/services/fcmService'
import { notificationsService } from '@/modules/notifications/services/notificationsService'

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

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

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
      setUnreadCount(count)
    } catch (err) {
      console.warn('[Notifications] Unread count failed:', err)
    }
  }, [isAuthenticated])

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    setError(null)
    try {
      const [items, count] = await Promise.all([
        notificationsService.listNotifications(),
        notificationsService.getUnreadCount(),
      ])
      setNotifications(items)
      setUnreadCount(count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await notificationsService.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    },
    [],
  )

  const markAllAsRead = useCallback(async () => {
    await notificationsService.markAllAsRead()
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    )
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      setError(null)
      setIsOpen(false)
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
      showBrowserNotification(payload)
      void refreshUnreadCount()
    })

    return () => {
      unsubscribe?.()
    }
  }, [isAuthenticated, refreshUnreadCount])

  useEffect(() => {
    if (!isAuthenticated) return

    const onFocus = () => {
      void refreshUnreadCount()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
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
