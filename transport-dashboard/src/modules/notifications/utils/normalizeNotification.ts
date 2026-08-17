import type { AppNotification } from '@/modules/notifications/types'
import { resolveNotificationRoute } from '@/modules/notifications/utils/resolveNotificationRoute'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

function readNestedData(record: Record<string, unknown>): Record<string, unknown> | null {
  const data = record.data
  if (data == null) return null
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null
    } catch {
      return null
    }
  }
  if (typeof data === 'object') return data as Record<string, unknown>
  return null
}

export function normalizeNotification(raw: unknown): AppNotification | null {
  if (raw == null || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const nested = readNestedData(record)

  const id =
    readId(record.id) ??
    readId(record.uuid) ??
    readId(record.notification_id)
  if (!id) return null

  const title =
    readString(record.title) ??
    readString(nested?.title) ??
    readString(nested?.subject) ??
    'Notification'

  const body =
    readString(record.body) ??
    readString(record.message) ??
    readString(nested?.body) ??
    readString(nested?.message) ??
    ''

  const readAt =
    readString(record.read_at) ??
    (record.read === true ? new Date().toISOString() : null)

  const createdAt =
    readString(record.created_at) ??
    readString(record.sent_at) ??
    readString(nested?.created_at)

  let referenceType =
    readString(record.reference_type) ??
    readString(nested?.reference_type) ??
    readString(record.notifiable_type) ??
    readString(nested?.notifiable_type)
  const complaintId = readId(record.complaint_id) ?? readId(nested?.complaint_id)
  const companyId = readId(record.company_id) ?? readId(nested?.company_id)
  const userId = readId(record.user_id) ?? readId(nested?.user_id)
  let referenceId =
    readId(record.reference_id) ??
    readId(nested?.reference_id) ??
    complaintId ??
    companyId ??
    userId

  if (!referenceType) {
    if (complaintId) referenceType = 'complaint'
    else if (companyId) referenceType = 'company'
    else if (userId) referenceType = 'user'
  }

  const directUrl = readString(record.url) ?? readString(nested?.url)

  return {
    id,
    title,
    body,
    readAt,
    createdAt,
    referenceType,
    referenceId,
    directUrl,
    targetPath: resolveNotificationRoute(referenceType, referenceId, directUrl),
    raw,
  }
}

export function normalizeNotificationList(payload: unknown): AppNotification[] {
  return collectApiListItems(payload)
    .map(normalizeNotification)
    .filter((item): item is AppNotification => item != null)
}

export function readUnreadCount(payload: unknown): number {
  if (typeof payload === 'number' && Number.isFinite(payload)) return payload
  if (payload == null || typeof payload !== 'object') return 0

  const record = payload as Record<string, unknown>
  const candidates = [
    record.count,
    record.unread_count,
    record.unreadCount,
    record.total,
    (record.data as Record<string, unknown> | undefined)?.count,
    (record.data as Record<string, unknown> | undefined)?.unread_count,
  ]

  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return 0
}
