import type { BookingStatus, CompanyBooking, PaymentStatus } from '@/modules/bookings/types'
import { formatRouteLabel } from '@/modules/trips/utils/formatRouteLabel'

function pickString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function pickNestedString(root: Record<string, unknown>, path: string[]): string | undefined {
  let node: unknown = root
  for (const key of path) {
    if (!node || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[key]
  }
  return typeof node === 'string' && node.trim() ? node.trim() : undefined
}

function normalizeBookingStatus(raw: unknown): BookingStatus {
  const key = typeof raw === 'string' ? raw.toLowerCase().replace(/\s+/g, '_') : ''
  if (key === 'pending' || key === 'awaiting_confirmation') return 'pending'
  if (key === 'confirmed' || key === 'active') return 'confirmed'
  if (key === 'cancelled' || key === 'canceled') return 'cancelled'
  if (key === 'completed' || key === 'finished') return 'completed'
  return 'unknown'
}

function normalizePaymentStatus(raw: unknown): PaymentStatus {
  const key = typeof raw === 'string' ? raw.toLowerCase().replace(/\s+/g, '_') : ''
  if (key === 'paid' || key === 'completed' || key === 'success') return 'paid'
  if (key === 'pending' || key === 'unpaid' || key === 'awaiting_payment') return 'pending'
  if (key === 'failed' || key === 'declined' || key === 'refunded') return 'failed'
  return 'unknown'
}

function resolvePassenger(record: Record<string, unknown>): { name: string; phone: string | null } {
  const nested =
    pickNestedString(record, ['passenger', 'name']) ??
    pickNestedString(record, ['user', 'name']) ??
    pickNestedString(record, ['customer', 'name'])

  const flat =
    pickString(record, 'passenger_name', 'customer_name', 'name') ?? nested ?? 'Passenger'

  const phone =
    pickString(record, 'passenger_phone', 'customer_phone', 'phone_number', 'phone') ??
    pickNestedString(record, ['passenger', 'phone_number']) ??
    pickNestedString(record, ['passenger', 'phone']) ??
    pickNestedString(record, ['user', 'phone_number']) ??
    pickNestedString(record, ['user', 'phone']) ??
    null

  return { name: flat, phone }
}

function resolveRouteLabel(record: Record<string, unknown>): string {
  const trip =
    record.trip && typeof record.trip === 'object'
      ? (record.trip as Record<string, unknown>)
      : null

  const originCity = trip?.origin_city
  const destinationCity = trip?.destination_city
  const originStation = trip?.origin_station
  const destinationStation = trip?.destination_station
  const route = trip?.route ?? record.route

  const routeIdRaw = trip?.route_id ?? record.route_id
  const routeId = typeof routeIdRaw === 'number' ? routeIdRaw : Number(routeIdRaw)

  const label = formatRouteLabel({
    route:
      route && typeof route === 'object'
        ? (route as { name?: string; name_en?: string; name_ar?: string })
        : null,
    origin_city:
      originCity && typeof originCity === 'object'
        ? (originCity as { name: string })
        : null,
    destination_city:
      destinationCity && typeof destinationCity === 'object'
        ? (destinationCity as { name: string })
        : null,
    origin_station:
      originStation && typeof originStation === 'object'
        ? (originStation as { name: string })
        : null,
    destination_station:
      destinationStation && typeof destinationStation === 'object'
        ? (destinationStation as { name: string })
        : null,
    route_id: Number.isFinite(routeId) ? routeId : undefined,
  })

  if (label !== '—') return label

  const tripId = record.trip_id ?? trip?.id
  if (typeof tripId === 'number' || Number.isFinite(Number(tripId))) {
    return `Trip #${tripId}`
  }

  return '—'
}

function resolveSeatCount(record: Record<string, unknown>): number {
  const raw =
    record.seat_count ??
    record.seats_count ??
    record.number_of_seats ??
    record.seats ??
    record.ticket_count
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (Number.isFinite(n) && n > 0) return Math.floor(n)
  if (Array.isArray(record.seat_numbers)) return record.seat_numbers.length
  if (Array.isArray(record.seats)) return record.seats.length
  return 1
}

function resolveSeatNumbers(record: Record<string, unknown>): string | null {
  const raw = record.seat_numbers ?? record.seats
  if (Array.isArray(raw)) {
    const labels = raw
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number') return String(item)
        if (item && typeof item === 'object') {
          const seat = item as Record<string, unknown>
          return (
            pickString(seat, 'seat_number', 'number', 'label') ??
            (typeof seat.id === 'number' ? String(seat.id) : undefined)
          )
        }
        return undefined
      })
      .filter((v): v is string => Boolean(v))
    return labels.length ? labels.join(', ') : null
  }
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return null
}

function resolvePaymentSummary(record: Record<string, unknown>): Record<string, unknown> | null {
  const summary = record.payment_summary
  return summary && typeof summary === 'object' ? (summary as Record<string, unknown>) : null
}

function resolveAmount(record: Record<string, unknown>): number | null {
  const summary = resolvePaymentSummary(record)
  const raw =
    summary?.final_paid ??
    summary?.base_price ??
    record.total_amount ??
    record.total_price ??
    record.amount ??
    record.fare ??
    record.price ??
    record.paid_amount
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : null
}

function resolveCurrency(record: Record<string, unknown>): string | null {
  const summary = resolvePaymentSummary(record)
  const raw = summary?.currency ?? record.currency
  return typeof raw === 'string' && raw.trim() ? raw.trim().toUpperCase() : null
}

function resolvePaymentMethod(record: Record<string, unknown>): string | null {
  const summary = resolvePaymentSummary(record)
  const raw = summary?.method ?? record.payment_method ?? record.paymentMethod
  return typeof raw === 'string' && raw.trim() ? raw.trim().toLowerCase() : null
}

function resolvePaymentStatus(record: Record<string, unknown>): PaymentStatus {
  const explicit = normalizePaymentStatus(
    record.payment_status ?? record.payment_state ?? record.payment,
  )
  if (explicit !== 'unknown') return explicit

  const summary = resolvePaymentSummary(record)
  const finalPaid = Number(summary?.final_paid)
  if (Number.isFinite(finalPaid) && finalPaid > 0) return 'paid'

  const basePrice = Number(summary?.base_price)
  if (Number.isFinite(basePrice) && basePrice > 0 && resolvePaymentMethod(record)) {
    return 'paid'
  }

  return 'unknown'
}

function resolveReference(record: Record<string, unknown>, id: number): string {
  return (
    pickString(record, 'pnr_code', 'booking_code', 'reference', 'code', 'booking_reference') ??
    `BK-${id}`
  )
}

function resolveBookedAt(record: Record<string, unknown>): string {
  return (
    pickString(
      record,
      'booked_at',
      'booking_date',
      'created_at',
      'reserved_at',
    ) ?? ''
  )
}

export function normalizeCompanyBooking(raw: unknown): CompanyBooking | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  const passenger = resolvePassenger(record)
  const tripRaw = record.trip_id ?? pickNestedString(record, ['trip', 'id'])
  const tripId =
    typeof tripRaw === 'number'
      ? tripRaw
      : Number.isFinite(Number(tripRaw))
        ? Number(tripRaw)
        : null

  const bookingStatus = normalizeBookingStatus(
    record.status ?? record.booking_status ?? record.state,
  )
  const paymentStatus = resolvePaymentStatus(record)
  const paymentMethod = resolvePaymentMethod(record)
  const currency = resolveCurrency(record)

  const bookedAt = resolveBookedAt(record)
  const departureTime =
    pickString(record, 'departure_time') ??
    pickNestedString(record, ['trip', 'departure_time']) ??
    null

  return {
    id,
    reference: resolveReference(record, id),
    passengerName: passenger.name,
    passengerPhone: passenger.phone,
    routeLabel: resolveRouteLabel(record),
    tripId,
    seatCount: resolveSeatCount(record),
    seatNumbers: resolveSeatNumbers(record),
    totalAmount: resolveAmount(record),
    currency,
    paymentMethod,
    bookingStatus,
    paymentStatus,
    bookedAt,
    departureTime,
  }
}

export function formatBookingDate(
  isoOrDate: string,
  locale: string,
): string {
  if (!isoOrDate) return '—'
  const date = new Date(isoOrDate)
  if (Number.isNaN(date.getTime())) return isoOrDate
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatBookingAmount(
  amount: number | null,
  locale: string,
  currency = 'SYP',
): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPaymentMethodLabel(
  method: string | null,
  t: (key: string) => string,
): string {
  if (!method) return '—'
  const key = `bookings.paymentMethod.${method}`
  const translated = t(key)
  return translated === key ? method : translated
}
