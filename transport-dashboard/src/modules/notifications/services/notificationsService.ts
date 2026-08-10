import type {
  AppNotification,
  NotificationListFilter,
  RegisterFcmTokenInput,
} from '@/modules/notifications/types'
import {
  normalizeNotificationList,
  readUnreadCount,
} from '@/modules/notifications/utils/normalizeNotification'
import { api } from '@/services/api'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

export const notificationsService = {
  async registerFcmToken(input: RegisterFcmTokenInput): Promise<void> {
    try {
      await api.post('/auth/fcm-token', input)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to register push token'))
    }
  },

  async listNotifications(filter?: NotificationListFilter): Promise<AppNotification[]> {
    try {
      const params: Record<string, string | number> = {
        // API defaults to a tiny page (e.g. 8); request enough for the bell + page.
        per_page: filter?.per_page ?? 50,
      }
      if (filter?.page != null && filter.page > 0) params.page = filter.page
      if (filter?.read === true) params.read = 1
      if (filter?.read === false) params.read = 0

      const { data } = await api.get<unknown>('/notifications', { params })
      return normalizeNotificationList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load notifications'))
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const { data } = await api.get<unknown>('/notifications/unread-count')
      return readUnreadCount(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load unread count'))
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${encodeURIComponent(notificationId)}/mark`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to mark notification as read'))
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/mark-all')
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to mark all notifications as read'))
    }
  },
}
