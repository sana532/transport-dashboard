import type { CompanyBooking } from '@/modules/bookings/types'
import type { TripSeatMapEntry } from '@/modules/trips/types/companyTrip'

/** Booking statuses that should occupy seats on the trip map. */
const OCCUPYING_STATUSES = new Set(['pending', 'confirmed', 'completed', 'unknown'])

export function parseBookingSeatNumbers(seatNumbers: string | null | undefined): number[] {
  if (!seatNumbers?.trim()) return []
  return seatNumbers
    .split(/[,،;/|\s]+/)
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

/** Seat numbers occupied by active trip bookings (pending included). */
export function collectOccupiedSeatNumbers(bookings: CompanyBooking[]): Map<number, CompanyBooking> {
  const occupied = new Map<number, CompanyBooking>()
  for (const booking of bookings) {
    if (!OCCUPYING_STATUSES.has(booking.bookingStatus)) continue
    for (const seatNumber of parseBookingSeatNumbers(booking.seatNumbers)) {
      if (!occupied.has(seatNumber)) occupied.set(seatNumber, booking)
    }
  }
  return occupied
}

/**
 * Overlays trip bookings onto API seat_map so pending/confirmed seats show as booked
 * even when the trip payload's `is_booked` flags lag behind.
 */
export function mergeBookingsIntoSeatMap(
  seatMap: TripSeatMapEntry[] | undefined,
  bookings: CompanyBooking[],
): TripSeatMapEntry[] | undefined {
  if (!seatMap?.length) return seatMap

  const occupied = collectOccupiedSeatNumbers(bookings)
  if (occupied.size === 0) return seatMap

  const byNumber = new Map<number, TripSeatMapEntry>()
  for (const seat of seatMap) {
    byNumber.set(seat.seat_number, { ...seat })
  }

  for (const [seatNumber, booking] of occupied) {
    const existing = byNumber.get(seatNumber)
    if (existing) {
      byNumber.set(seatNumber, {
        ...existing,
        is_booked: true,
        booking_reference: existing.booking_reference ?? booking.reference,
        passenger_name: existing.passenger_name ?? booking.passengerName,
        passenger_phone_number:
          existing.passenger_phone_number ?? booking.passengerPhone,
      })
    } else {
      byNumber.set(seatNumber, {
        seat_number: seatNumber,
        is_booked: true,
        ticket_id: null,
        booking_reference: booking.reference,
        passenger_name: booking.passengerName,
        passenger_phone_number: booking.passengerPhone,
        passenger_gender: null,
      })
    }
  }

  return Array.from(byNumber.values()).sort((a, b) => a.seat_number - b.seat_number)
}
