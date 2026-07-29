import type {
  PackageSubscriberRow,
  PackageSubscriberRowStatus,
} from '@/modules/subscription-packages/types'

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function pickNestedString(root: Record<string, unknown>, path: string[]): string {
  let node: unknown = root
  for (const key of path) {
    if (!node || typeof node !== 'object') return ''
    node = (node as Record<string, unknown>)[key]
  }
  return typeof node === 'string' && node.trim() ? node.trim() : ''
}

function resolveSubscriberName(record: Record<string, unknown>): string {
  return (
    pickNestedString(record, ['user', 'name']) ||
    pickNestedString(record, ['passenger', 'name']) ||
    pickNestedString(record, ['customer', 'name']) ||
    pickString(record, 'passenger_name', 'customer_name', 'subscriber_name', 'name') ||
    '—'
  )
}

function resolveSubscriberPhone(record: Record<string, unknown>): string {
  return (
    pickNestedString(record, ['user', 'phone_number']) ||
    pickNestedString(record, ['user', 'phone']) ||
    pickNestedString(record, ['passenger', 'phone_number']) ||
    pickNestedString(record, ['passenger', 'phone']) ||
    pickString(record, 'phone_number', 'phone', 'passenger_phone', 'customer_phone') ||
    '—'
  )
}

function resolveAvatarUrl(record: Record<string, unknown>): string | undefined {
  const raw =
    pickNestedString(record, ['user', 'profile_picture']) ||
    pickNestedString(record, ['user', 'avatar']) ||
    pickNestedString(record, ['user', 'avatar_url']) ||
    pickNestedString(record, ['passenger', 'profile_picture']) ||
    pickNestedString(record, ['passenger', 'avatar']) ||
    pickString(record, 'avatar', 'avatar_url', 'photo', 'profile_picture')
  return raw || undefined
}

function resolveDateRaw(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function formatSubscriberDate(raw: string, locale: string): string {
  if (!raw) return '—'
  const parsed = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function normalizeSubscriberStatus(record: Record<string, unknown>): PackageSubscriberRowStatus {
  const raw = pickString(record, 'status', 'subscription_status', 'state').toLowerCase()
  if (raw === 'active' || raw === 'valid' || raw === 'current') return 'active'

  const expiresAt = resolveDateRaw(
    record,
    'expires_at',
    'expiration_date',
    'valid_until',
    'ended_at',
  )
  if (expiresAt) {
    const expiry = new Date(expiresAt.includes('T') ? expiresAt : expiresAt.replace(' ', 'T'))
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) return 'expired'
  }

  if (raw === 'expired' || raw === 'cancelled' || raw === 'canceled' || raw === 'inactive') {
    return 'expired'
  }

  return 'active'
}

export function normalizeCompanySubscriptionSubscriber(
  raw: unknown,
  locale: string,
): PackageSubscriberRow | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  const subscriptionRaw = resolveDateRaw(
    record,
    'subscribed_at',
    'subscription_date',
    'started_at',
    'created_at',
  )
  const expirationRaw = resolveDateRaw(
    record,
    'expires_at',
    'expiration_date',
    'valid_until',
    'ended_at',
  )

  return {
    id: String(id),
    name: resolveSubscriberName(record),
    phone: resolveSubscriberPhone(record),
    avatarUrl: resolveAvatarUrl(record),
    subscriptionDate: formatSubscriberDate(subscriptionRaw, locale),
    expirationDate: formatSubscriberDate(expirationRaw, locale),
    status: normalizeSubscriberStatus(record),
    subscribedAtRaw: subscriptionRaw || undefined,
  }
}
