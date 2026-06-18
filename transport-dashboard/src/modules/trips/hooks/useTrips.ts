import { useCallback, useState } from 'react'
import type { Trip } from '@/modules/trips/types'

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const reset = useCallback(() => setTrips([]), [])

  return { trips, isLoading, setTrips, setIsLoading, reset }
}
