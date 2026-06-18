import { useCallback, useEffect, useState } from 'react'
import { bookingsService } from '@/modules/bookings/services/bookingsService'
import type { CompanyBooking } from '@/modules/bookings/types'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'

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
        bookingsService.listBookingsForTrip(id),
      ])
      setTrip(tripData)
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
