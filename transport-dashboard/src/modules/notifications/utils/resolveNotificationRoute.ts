import { paths } from '@/routes/paths'

export type NotificationAudience = 'company' | 'admin'

function readId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

function normalizeTypeKey(referenceType: string): string {
  const trimmed = referenceType.trim()
  const shortName = trimmed.includes('\\') ? trimmed.slice(trimmed.lastIndexOf('\\') + 1) : trimmed
  return shortName.toLowerCase()
}

function remapDirectUrl(directUrl: string, audience: NotificationAudience): string | null {
  if (!directUrl.startsWith('/')) return null
  if (audience === 'company') {
    if (directUrl.startsWith('/admin/')) return paths.company.notifications
    return directUrl
  }

  const complaintMatch = directUrl.match(/^\/(?:company|admin)\/complaints\/([^/?#]+)/)
  if (complaintMatch) return paths.admin.complaintDetails(complaintMatch[1])

  const userMatch = directUrl.match(/^\/(?:company|admin)\/users\/([^/?#]+)/)
  if (userMatch) return paths.admin.userDetails(userMatch[1])

  const companyMatch = directUrl.match(/^\/admin\/companies\/([^/?#]+)/)
  if (companyMatch) return paths.admin.companyDetails(companyMatch[1])

  if (directUrl.startsWith('/admin/')) return directUrl
  if (directUrl.startsWith('/company/notifications')) return paths.admin.notifications

  return null
}

/**
 * Maps backend `reference_type` + `reference_id` to an in-app route.
 * Company: Trip + 469 → /company/trips/469
 * Admin: Complaint + 12 → /admin/complaints/12
 */
export function resolveNotificationRoute(
  referenceType: string | null | undefined,
  referenceId: unknown,
  directUrl?: string | null,
  audience: NotificationAudience = 'company',
): string | null {
  if (directUrl?.startsWith('/')) {
    return remapDirectUrl(directUrl, audience)
  }

  const id = readId(referenceId)
  if (!referenceType?.trim() || !id) return null

  const type = normalizeTypeKey(referenceType)

  if (audience === 'admin') {
    if (type === 'complaint' || type.endsWith('complaint')) {
      return paths.admin.complaintDetails(id)
    }
    if (type === 'company' || type.endsWith('company')) {
      return paths.admin.companyDetails(id)
    }
    if (type === 'user' || type.endsWith('user')) {
      return paths.admin.userDetails(id)
    }
    if (type.includes('promo')) {
      return paths.admin.promoCodeEdit(id)
    }
    return null
  }

  if (type === 'trip' || type.endsWith('trip')) {
    return paths.company.tripDetails(id)
  }
  if (type === 'booking' || type.endsWith('booking')) {
    return paths.company.bookingDetails(id)
  }
  if (type === 'complaint' || type.endsWith('complaint')) {
    return paths.company.complaintDetails(id)
  }

  return null
}

export function notificationsListPath(audience: NotificationAudience): string {
  return audience === 'admin' ? paths.admin.notifications : paths.company.notifications
}
