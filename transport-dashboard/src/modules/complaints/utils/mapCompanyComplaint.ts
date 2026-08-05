import type {
  ComplaintAttachment,
  ComplaintCategory,
  ComplaintManagementRow,
  ComplaintStatus,
  ComplaintType,
} from '@/modules/complaints/types'
import { extractMediaUrl } from '@/shared/utils/pickMediaUrls'

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

function formatComplaintDate(raw: string, locale: string, detailed = false): string {
  if (!raw) return '—'
  const parsed = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return raw

  if (detailed) {
    return parsed.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return parsed.toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function normalizeComplaintStatus(raw: unknown): ComplaintStatus {
  const key = typeof raw === 'string' ? raw.toLowerCase().replace(/\s+/g, '_') : ''
  if (key === 'pending') return 'pending'
  if (key === 'open' || key === 'new' || key === 'submitted') return 'open'
  if (key === 'in_progress' || key === 'processing' || key === 'reviewing' || key === 'assigned') {
    return 'in_progress'
  }
  if (key === 'resolved' || key === 'completed' || key === 'done') return 'resolved'
  if (key === 'closed') return 'closed'
  return 'pending'
}

export function uiStatusToApiQuery(status: ComplaintStatus | 'all'): string | undefined {
  if (status === 'all') return undefined
  return status
}

const KNOWN_TYPES = new Set<string>([
  'service_quality',
  'delay',
  'driver_behavior',
  'vehicle_condition',
  'booking_issue',
  'safety_concern',
])

function normalizeComplaintTypeSlug(raw: string): ComplaintType {
  const slug = raw.toLowerCase().replace(/\s+/g, '_')
  if (KNOWN_TYPES.has(slug)) return slug as ComplaintType
  return 'service_quality'
}

function resolveCategoryLabel(
  record: Record<string, unknown>,
  locale: string,
): { categoryId?: number; categoryLabel: string; type: ComplaintType } {
  const nestedRaw = record.complaint_category ?? record.category
  if (nestedRaw && typeof nestedRaw === 'object') {
    const category = nestedRaw as Record<string, unknown>
    const id = typeof category.id === 'number' ? category.id : Number(category.id)
    const nameEn = pickString(category, 'name_en', 'name')
    const nameAr = pickString(category, 'name_ar')
    const label = locale === 'ar' && nameAr ? nameAr : nameEn || nameAr || '—'
    const slug = pickString(category, 'slug', 'code', 'key') || nameEn
    return {
      categoryId: Number.isFinite(id) ? id : undefined,
      categoryLabel: label,
      type: normalizeComplaintTypeSlug(slug || label),
    }
  }

  const flatName =
    pickString(record, 'complaint_category_name', 'category_name', 'type_label') ||
    pickString(record, 'type')
  const categoryIdRaw = record.complaint_category_id ?? record.category_id
  const categoryId =
    typeof categoryIdRaw === 'number'
      ? categoryIdRaw
      : Number.isFinite(Number(categoryIdRaw))
        ? Number(categoryIdRaw)
        : undefined

  return {
    categoryId,
    categoryLabel: flatName || '—',
    type: normalizeComplaintTypeSlug(flatName || 'service_quality'),
  }
}

function resolvePassenger(record: Record<string, unknown>): {
  name: string
  phone: string
  passengerId: string
  bookingPnr: string
} {
  const booking =
    record.booking && typeof record.booking === 'object'
      ? (record.booking as Record<string, unknown>)
      : null

  const bookingUser =
    booking?.user && typeof booking.user === 'object'
      ? (booking.user as Record<string, unknown>)
      : null

  /** Platform API spells the reporter as `complainter` */
  const complainer =
    record.complainter && typeof record.complainter === 'object'
      ? (record.complainter as Record<string, unknown>)
      : record.complainant && typeof record.complainant === 'object'
        ? (record.complainant as Record<string, unknown>)
        : null

  const name =
    pickNestedString(record, ['passenger', 'name']) ||
    (complainer ? pickString(complainer, 'name') : '') ||
    (bookingUser ? pickString(bookingUser, 'name') : '') ||
    pickNestedString(record, ['user', 'name']) ||
    pickNestedString(record, ['customer', 'name']) ||
    pickString(record, 'passenger_name', 'customer_name') ||
    '—'

  const phone =
    pickNestedString(record, ['passenger', 'phone_number']) ||
    pickNestedString(record, ['passenger', 'phone']) ||
    (complainer ? pickString(complainer, 'phone_number', 'phone') : '') ||
    (bookingUser ? pickString(bookingUser, 'phone_number', 'phone') : '') ||
    pickNestedString(record, ['user', 'phone_number']) ||
    pickNestedString(record, ['user', 'phone']) ||
    pickString(record, 'passenger_phone', 'phone_number', 'phone') ||
    '—'

  const idOf = (source: Record<string, unknown> | null): string =>
    source && source.id != null ? String(source.id).trim() : ''

  const passengerIdRaw =
    (record.passenger_id != null ? String(record.passenger_id).trim() : '') ||
    idOf(record.passenger && typeof record.passenger === 'object'
      ? (record.passenger as Record<string, unknown>)
      : null) ||
    idOf(complainer) ||
    idOf(bookingUser) ||
    (booking?.user_id != null ? String(booking.user_id).trim() : '') ||
    idOf(record.user && typeof record.user === 'object'
      ? (record.user as Record<string, unknown>)
      : null)

  const passengerId = passengerIdRaw ? `PSG-${passengerIdRaw}` : '—'

  const bookingPnr = booking ? pickString(booking, 'pnr_code', 'booking_code', 'reference') : ''

  return { name, phone, passengerId, bookingPnr }
}

function resolveTripInfo(
  record: Record<string, unknown>,
  bookingPnr: string,
): {
  relatedTripCode: string
  relatedTripRoute: string
  assignedDriverName: string
} {
  const trip = record.trip
  const tripRecord = trip && typeof trip === 'object' ? (trip as Record<string, unknown>) : null

  const tripId = tripRecord?.id ?? record.trip_id
  const relatedTripCode =
    pickString(record, 'trip_code', 'related_trip_code') ||
    (tripId != null && String(tripId).trim() ? `TRP-${tripId}` : '—')

  const routeName =
    pickNestedString(record, ['trip', 'route', 'name']) ||
    pickNestedString(record, ['route', 'name']) ||
    pickString(record, 'route_name', 'trip_route')

  const origin =
    pickNestedString(record, ['trip', 'origin_station', 'name']) ||
    pickNestedString(record, ['origin_station', 'name'])
  const destination =
    pickNestedString(record, ['trip', 'destination_station', 'name']) ||
    pickNestedString(record, ['destination_station', 'name'])

  let relatedTripRoute =
    routeName || (origin && destination ? `${origin} → ${destination}` : origin || destination || '')

  if (!relatedTripRoute && bookingPnr) {
    relatedTripRoute = bookingPnr
  }
  if (!relatedTripRoute) {
    relatedTripRoute = '—'
  }

  const driverRecord =
    record.driver && typeof record.driver === 'object'
      ? (record.driver as Record<string, unknown>)
      : null
  const driverUser =
    driverRecord?.user && typeof driverRecord.user === 'object'
      ? (driverRecord.user as Record<string, unknown>)
      : null

  const assignedDriverName =
    (driverUser ? pickString(driverUser, 'name') : '') ||
    pickNestedString(record, ['trip', 'driver', 'user', 'name']) ||
    pickNestedString(record, ['trip', 'driver', 'name']) ||
    (driverRecord ? pickString(driverRecord, 'name') : '') ||
    pickNestedString(record, ['driver', 'name']) ||
    pickString(record, 'driver_name', 'assigned_driver_name') ||
    '—'

  return { relatedTripCode, relatedTripRoute, assignedDriverName }
}

function resolveComplaintCode(record: Record<string, unknown>, id: number): string {
  return (
    pickString(record, 'complaint_code', 'reference', 'code', 'ticket_number') ||
    `CMP-${String(id).padStart(4, '0')}`
  )
}

function resolveAttachments(record: Record<string, unknown>): ComplaintAttachment[] {
  const raw = record.attachments
  if (!Array.isArray(raw)) return []

  const attachments: ComplaintAttachment[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const att = item as Record<string, unknown>
    const id = typeof att.id === 'number' ? att.id : Number(att.id)
    const url = extractMediaUrl(att)
    if (!Number.isFinite(id) || !url) continue
    attachments.push({
      id,
      url,
      fileName: pickString(att, 'file_name', 'name') || `attachment-${id}`,
      mimeType: pickString(att, 'mime_type', 'type') || 'application/octet-stream',
      size: typeof att.size === 'number' ? att.size : undefined,
    })
  }
  return attachments
}

export function normalizeCompanyComplaint(
  raw: unknown,
  locale: string,
): ComplaintManagementRow | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  const passenger = resolvePassenger(record)
  const trip = resolveTripInfo(record, passenger.bookingPnr)
  const category = resolveCategoryLabel(record, locale)
  const createdRaw =
    pickString(record, 'created_at', 'reported_at', 'submitted_at', 'complaint_date') || ''

  const description =
    pickString(record, 'description', 'body', 'message', 'content', 'details') ||
    pickString(record, 'subject') ||
    '—'

  const adminNotes =
    pickString(record, 'admin_notes', 'company_notes', 'internal_notes', 'notes') || ''

  const nestedCompany =
    record.company && typeof record.company === 'object'
      ? (record.company as Record<string, unknown>)
      : null
  const companyIdRaw =
    record.company_id ??
    (nestedCompany ? nestedCompany.id : undefined)
  const companyIdNum =
    typeof companyIdRaw === 'number'
      ? companyIdRaw
      : companyIdRaw != null
        ? Number(companyIdRaw)
        : undefined
  const companyName =
    pickString(record, 'company_name') ||
    (nestedCompany
      ? pickString(nestedCompany, 'name', 'name_en', 'name_ar')
      : '') ||
    undefined

  return {
    id: String(id),
    complaintCode: resolveComplaintCode(record, id),
    passengerName: passenger.name,
    phone: passenger.phone,
    type: category.type,
    categoryId: category.categoryId,
    categoryLabel: category.categoryLabel,
    reportedAtLabel: formatComplaintDate(createdRaw, locale),
    status: normalizeComplaintStatus(record.status),
    subject: pickString(record, 'subject', 'title') || undefined,
    body: pickString(record, 'body', 'message') || undefined,
    passengerId: passenger.passengerId,
    bookingPnr: passenger.bookingPnr || undefined,
    reportedAtDetailLabel: formatComplaintDate(createdRaw, locale, true),
    relatedTripCode: trip.relatedTripCode,
    relatedTripRoute: trip.relatedTripRoute,
    assignedDriverName: trip.assignedDriverName,
    description,
    adminNotes,
    attachments: resolveAttachments(record),
    companyId: Number.isFinite(companyIdNum) ? companyIdNum : undefined,
    companyName,
  }
}

export function normalizeComplaintCategory(raw: unknown, locale: string): ComplaintCategory | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  const nameEn = pickString(record, 'name_en', 'name')
  const nameAr = pickString(record, 'name_ar')
  const label = locale === 'ar' && nameAr ? nameAr : nameEn || nameAr || `Category ${id}`
  const iconUrl = pickString(record, 'icon_url', 'icon') || null
  const visibilityScope = pickString(record, 'visibility_scope') || null
  const isActiveRaw = record.is_active
  const isActive =
    typeof isActiveRaw === 'boolean'
      ? isActiveRaw
      : isActiveRaw === 0 || isActiveRaw === '0' || isActiveRaw === 'false'
        ? false
        : true

  return {
    id,
    label,
    nameEn,
    nameAr,
    iconUrl,
    visibilityScope,
    isActive,
  }
}

export function complaintDisplayType(
  row: Pick<ComplaintManagementRow, 'type' | 'categoryLabel'>,
  t: (key: string) => string,
): string {
  if (row.categoryLabel && row.categoryLabel !== '—') return row.categoryLabel
  const key = `complaints.type.${row.type}`
  const translated = t(key)
  return translated !== key ? translated : row.type
}
