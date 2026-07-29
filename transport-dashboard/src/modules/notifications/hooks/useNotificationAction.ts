import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/modules/notifications/components/NotificationsProvider'
import type { AppNotification } from '@/modules/notifications/types'

type OpenNotificationOptions = {
  onBeforeNavigate?: () => void
  markRead?: (notificationId: string) => Promise<void>
}

export function useNotificationAction() {
  const navigate = useNavigate()
  const { markAsRead, refreshUnreadCount } = useNotifications()

  const openNotification = useCallback(
    async (item: AppNotification, options?: OpenNotificationOptions) => {
      const markReadFn = options?.markRead ?? markAsRead

      if (!item.readAt) {
        await markReadFn(item.id)
        await refreshUnreadCount()
      }

      options?.onBeforeNavigate?.()

      if (item.targetPath) {
        navigate(item.targetPath)
      }
    },
    [markAsRead, navigate, refreshUnreadCount],
  )

  return { openNotification }
}
