import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppNotification } from '@/modules/notifications/types'
import { notificationsService } from '@/modules/notifications/services/notificationsService'

export type NotificationReadFilter = 'all' | 'unread' | 'read'

function toApiFilter(filter: NotificationReadFilter) {
  if (filter === 'unread') return { read: false as const }
  if (filter === 'read') return { read: true as const }
  return undefined
}

export function useNotificationsPage(filter: NotificationReadFilter) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const items = await notificationsService.listNotifications(toApiFilter(filter))
      if (requestId !== requestIdRef.current) return
      setNotifications(items)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
      setNotifications([])
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [filter])

  useEffect(() => {
    void load()
    return () => {
      requestIdRef.current += 1
    }
  }, [load])

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationsService.markAsRead(notificationId)
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
          : item,
      ),
    )
  }, [])

  const markAllAsRead = useCallback(async () => {
    await notificationsService.markAllAsRead()
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    )
  }, [])

  return {
    notifications,
    isLoading,
    error,
    reload: load,
    markAsRead,
    markAllAsRead,
  }
}
