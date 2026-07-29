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
}

export type RegisterFcmTokenInput = {
  token: string
  platform: 'web' | 'android' | 'ios'
}
