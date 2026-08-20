import { useEffect, useState } from 'react'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import type { TripResourceAvailability } from '@/modules/trips/types/resourceAvailability'
import { formatAvailabilityDepartureTime } from '@/modules/trips/utils/mapResourceAvailability'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { useTranslation } from '@/shared/i18n/useTranslation'

const DEBOUNCE_MS = 300

type UseTripResourceAvailabilityArgs = {
  routeId: string
  departureDate: string
  departureTime: string
  arrivalDate: string
  arrivalTime: string
  excludeTripId?: number | null
  enabled?: boolean
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  if (!error || typeof error !== 'object') return false
  const record = error as { code?: string; name?: string }
  return (
    record.code === 'ERR_CANCELED' ||
    record.name === 'CanceledError' ||
    record.name === 'AbortError'
  )
}

export function useTripResourceAvailability({
  routeId,
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  excludeTripId = null,
  enabled = true,
}: UseTripResourceAvailabilityArgs) {
  const { t } = useTranslation()
  const [availability, setAvailability] = useState<TripResourceAvailability | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const routeNumeric = Number(routeId)
  const departure = formatAvailabilityDepartureTime(departureDate, departureTime)
  const arrival = formatAvailabilityDepartureTime(arrivalDate, arrivalTime)
  const isQueryReady =
    enabled &&
    Boolean(routeId) &&
    Number.isFinite(routeNumeric) &&
    routeNumeric > 0 &&
    Boolean(departure) &&
    Boolean(arrival)

  const currentKey = isQueryReady
    ? `${routeNumeric}|${departure}|${arrival}|${excludeTripId ?? 0}`
    : ''
  const requestKey = useDebouncedValue(currentKey, DEBOUNCE_MS)
  const isDebouncing = Boolean(currentKey) && currentKey !== requestKey

  useEffect(() => {
    if (!currentKey) {
      setAvailability(null)
      setError(null)
      setIsLoading(false)
      return
    }

    if (!requestKey || isDebouncing) {
      setIsLoading(true)
      return
    }

    const [routePart, departurePart, arrivalPart, excludePart] = requestKey.split('|')
    const route_id = Number(routePart)
    const departure_time = departurePart
    const estimated_arrival_time = arrivalPart
    const exclude_trip_id = Number(excludePart) || null

    let cancelled = false
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await companyTripsService.getResourceAvailability(
          {
            route_id,
            departure_time,
            estimated_arrival_time,
            exclude_trip_id,
          },
          controller.signal,
        )
        if (cancelled) return
        setAvailability(result)
      } catch (err) {
        if (cancelled || controller.signal.aborted || isAbortError(err)) return
        setAvailability(null)
        setError(
          err instanceof Error ? err.message : t('tripForm.availability.failed'),
        )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [currentKey, requestKey, isDebouncing, t])

  return {
    availability,
    isQueryReady,
    isLoading: isQueryReady && (isLoading || isDebouncing),
    error,
  }
}
