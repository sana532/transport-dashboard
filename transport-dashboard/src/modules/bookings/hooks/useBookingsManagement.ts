import { useCallback, useEffect, useState } from 'react'
import type { BookingsManagementData } from '@/modules/bookings/types'
import { bookingsService } from '@/modules/bookings/services/bookingsService'

export function useBookingsManagement() {
  const [data, setData] = useState<BookingsManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const next = await bookingsService.getBookingsManagementData()
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
