import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useNotifications } from '@/modules/notifications/components/NotificationsProvider'
import type { AppNotification } from '@/modules/notifications/types'
import {
  notificationsListPath,
  resolveNotificationRoute,
  type NotificationAudience,
} from '@/modules/notifications/utils/resolveNotificationRoute'

type OpenNotificationOptions = {
  onBeforeNavigate?: () => void
  markRead?: (notificationId: string) => Promise<void>
}

export function useNotificationAudience(): NotificationAudience {
  const { role } = useAuth()
  return role === 'admin' ? 'admin' : 'company'
}

export function notificationDestination(
  item: AppNotification,
  audience: NotificationAudience,
): string | null {
  return resolveNotificationRoute(item.referenceType, item.referenceId, item.directUrl, audience)
}

export function useNotificationAction() {
  const navigate = useNavigate()
  const audience = useNotificationAudience()
  const { markAsRead, refreshUnreadCount } = useNotifications()

  const openNotification = useCallback(
    async (item: AppNotification, options?: OpenNotificationOptions) => {
      const markReadFn = options?.markRead ?? markAsRead

      if (!item.readAt) {
        await markReadFn(item.id)
        await refreshUnreadCount()
      }

      options?.onBeforeNavigate?.()

      const path = notificationDestination(item, audience)
      if (path) {
        navigate(path)
      }
    },
    [audience, markAsRead, navigate, refreshUnreadCount],
  )

  return { openNotification, audience, listPath: notificationsListPath(audience) }
}
