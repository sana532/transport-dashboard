import { paths } from '@/routes/paths'

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

/**
 * Maps backend `reference_type` + `reference_id` to an in-app route.
 * Example: Modules\Operations\Models\Trip + 469 → /company/trips/469
 */
export function resolveNotificationRoute(
  referenceType: string | null | undefined,
  referenceId: unknown,
  directUrl?: string | null,
): string | null {
  if (directUrl?.startsWith('/')) return directUrl

  const id = readId(referenceId)
  if (!referenceType?.trim() || !id) return null

  const type = normalizeTypeKey(referenceType)

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
