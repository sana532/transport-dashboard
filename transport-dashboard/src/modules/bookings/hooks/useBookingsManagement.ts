import { useCallback, useEffect, useRef, useState } from 'react'
import type { BookingsManagementData } from '@/modules/bookings/types'
import { bookingsService } from '@/modules/bookings/services/bookingsService'

export function useBookingsManagement() {
  const [data, setData] = useState<BookingsManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const next = await bookingsService.getBookingsManagementData()
      if (requestId !== requestIdRef.current) return
      setData(next)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
      setData(null)
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void load()
    return () => {
      requestIdRef.current += 1
    }
  }, [load])

  return { data, isLoading, error, reload: load }
}
