import { useCallback, useEffect, useState } from 'react'
import { bookingsService } from '@/modules/bookings/services/bookingsService'
import type { CompanyBooking } from '@/modules/bookings/types'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import { mergeBookingsIntoSeatMap } from '@/modules/trips/utils/mergeBookingsIntoSeatMap'

function bookingHasSeatNumbers(booking: CompanyBooking): boolean {
  return Boolean(booking.seatNumbers?.trim())
}

async function hydrateBookingSeats(bookings: CompanyBooking[]): Promise<CompanyBooking[]> {
  const needsDetail = bookings.filter(
    (booking) => booking.seatCount > 0 && !bookingHasSeatNumbers(booking),
  )
  if (needsDetail.length === 0) return bookings

  const detailed = await Promise.all(
    needsDetail.map(async (booking) => {
      try {
        return await bookingsService.getBooking(booking.id)
      } catch {
        return booking
      }
    }),
  )

  const byId = new Map(detailed.map((booking) => [booking.id, booking]))
  return bookings.map((booking) => {
    const full = byId.get(booking.id)
    if (!full?.seatNumbers?.trim()) return booking
    return {
      ...booking,
      seatNumbers: full.seatNumbers,
      seatCount: full.seatCount || booking.seatCount,
    }
  })
}

function mergeBookingLists(
  primary: CompanyBooking[],
  fallback: CompanyBooking[],
): CompanyBooking[] {
  const byId = new Map<number, CompanyBooking>()
  for (const booking of [...fallback, ...primary]) {
    const existing = byId.get(booking.id)
    if (!existing) {
      byId.set(booking.id, booking)
      continue
    }
    byId.set(booking.id, {
      ...existing,
      ...booking,
      seatNumbers: booking.seatNumbers?.trim()
        ? booking.seatNumbers
        : existing.seatNumbers,
      seatCount: Math.max(booking.seatCount, existing.seatCount),
    })
  }
  return Array.from(byId.values())
}

/**
 * Prefer trip bookings endpoint; fall back to company bookings filtered by trip
 * (API seat_map often lags for pending bookings).
 */
async function loadTripBookings(tripId: number): Promise<CompanyBooking[]> {
  let tripBookings: CompanyBooking[] = []
  try {
    tripBookings = await bookingsService.listBookingsForTrip(tripId)
  } catch {
    tripBookings = []
  }

  const needsFallback =
    tripBookings.length === 0 || tripBookings.some((b) => !bookingHasSeatNumbers(b))

  if (!needsFallback) {
    return hydrateBookingSeats(tripBookings)
  }

  try {
    const all = await bookingsService.listBookings()
    const forTrip = all.filter((booking) => booking.tripId === tripId)
    return hydrateBookingSeats(mergeBookingLists(tripBookings, forTrip))
  } catch {
    return hydrateBookingSeats(tripBookings)
  }
}

function applyBookingSeatsToTrip(
  trip: CompanyTrip,
  bookings: CompanyBooking[],
): CompanyTrip {
  const mergedSeatMap = mergeBookingsIntoSeatMap(trip.seat_map, bookings)
  if (!mergedSeatMap) return trip

  const bookedSeats = mergedSeatMap.filter((seat) => seat.is_booked).length
  const totalSeats = trip.stats?.total_seats ?? mergedSeatMap.length
  const availableSeats = Math.max(0, totalSeats - bookedSeats)

  return {
    ...trip,
    seat_map: mergedSeatMap,
    available_seats: availableSeats,
    stats: trip.stats
      ? {
          ...trip.stats,
          booked_seats: Math.max(trip.stats.booked_seats, bookedSeats),
          available_seats: availableSeats,
        }
      : {
          total_seats: totalSeats,
          available_seats: availableSeats,
          booked_seats: bookedSeats,
          total_revenue: 0,
        },
  }
}

export function useTripDetails(tripId: string | undefined) {
  const [trip, setTrip] = useState<CompanyTrip | null>(null)
  const [bookings, setBookings] = useState<CompanyBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const id = Number(tripId)
    if (!Number.isFinite(id)) {
      setError('Invalid trip id')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const [tripData, bookingRows] = await Promise.all([
        companyTripsService.getTrip(id),
        loadTripBookings(id),
      ])

      setTrip(applyBookingSeatsToTrip(tripData, bookingRows))
      setBookings(bookingRows)
    } catch (err) {
      setTrip(null)
      setBookings([])
      setError(err instanceof Error ? err.message : 'Failed to load trip')
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    void load()
  }, [load])

  return { trip, bookings, isLoading, error, reload: load }
}
