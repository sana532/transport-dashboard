export type AppNotification = {
  id: string
  title: string
  body: string
  readAt: string | null
  createdAt: string | null
  referenceType: string | null
  referenceId: string | null
  targetPath: string | null
  raw: unknown
}

export type NotificationListFilter = {
  read?: boolean
  /** Laravel paginator page size (API default is often very small). */
  per_page?: number
  page?: number
}

export type RegisterFcmTokenInput = {
  token: string
  platform: 'web' | 'android' | 'ios'
  /** Dashboard UI language — backend uses this for push copy. */
  locale?: 'ar' | 'en'
  language?: 'ar' | 'en'
}

