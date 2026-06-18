import { useCallback, useEffect, useState } from 'react'
import type { CompanyBooking } from '@/modules/bookings/types'
import { bookingsService } from '@/modules/bookings/services/bookingsService'

export function useBookingDetail(bookingId: string | undefined) {
  const [booking, setBooking] = useState<CompanyBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const id = Number(bookingId)
    if (!bookingId || !Number.isFinite(id)) {
      setBooking(null)
      setError('Missing booking reference')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const next = await bookingsService.getBooking(id)
      setBooking(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking')
      setBooking(null)
    } finally {
      setIsLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    void load()
  }, [load])

  return { booking, isLoading, error, reload: load }
}
