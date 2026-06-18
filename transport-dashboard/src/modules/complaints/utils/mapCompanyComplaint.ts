import type {
  ComplaintCategory,
  ComplaintManagementRow,
  ComplaintStatus,
  ComplaintType,
} from '@/modules/complaints/types'

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
  if (key === 'pending' || key === 'open' || key === 'new' || key === 'submitted') return 'open'
  if (key === 'in_progress' || key === 'processing' || key === 'reviewing' || key === 'assigned') {
    return 'in_progress'
  }
  if (key === 'resolved' || key === 'closed' || key === 'completed' || key === 'done') {
    return 'resolved'
  }
  return 'open'
}

export function uiStatusToApiQuery(status: ComplaintStatus | 'all'): string | undefined {
  if (status === 'all') return undefined
  if (status === 'open') return 'pending'
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

  const name =
    pickNestedString(record, ['passenger', 'name']) ||
    (bookingUser ? pickString(bookingUser, 'name') : '') ||
    pickNestedString(record, ['user', 'name']) ||
    pickNestedString(record, ['customer', 'name']) ||
    pickString(record, 'passenger_name', 'customer_name') ||
    '—'

  const phone =
    pickNestedString(record, ['passenger', 'phone_number']) ||
    pickNestedString(record, ['passenger', 'phone']) ||
    (bookingUser ? pickString(bookingUser, 'phone_number', 'phone') : '') ||
    pickNestedString(record, ['user', 'phone_number']) ||
    pickNestedString(record, ['user', 'phone']) ||
    pickString(record, 'passenger_phone', 'phone_number', 'phone') ||
    '—'

  const passengerIdRaw =
    (record.passenger_id ??
      pickNestedString(record, ['passenger', 'id']) ??
      (bookingUser ? pickString(bookingUser, 'id') : null) ??
      (booking?.user_id != null ? String(booking.user_id) : null) ??
      pickNestedString(record, ['user', 'id'])) ||
    ''

  const passengerId =
    passengerIdRaw != null && String(passengerIdRaw).trim()
      ? `PSG-${passengerIdRaw}`
      : '—'

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

  return { id, label, nameEn, nameAr }
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
