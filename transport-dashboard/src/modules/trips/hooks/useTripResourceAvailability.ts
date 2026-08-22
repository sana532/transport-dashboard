import { useQuery } from '@tanstack/react-query'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import { formatAvailabilityDepartureTime } from '@/modules/trips/utils/mapResourceAvailability'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

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

export const tripResourceAvailabilityQueryKey = (
  routeId: number,
  departure: string,
  arrival: string,
  excludeTripId: number,
) => ['trips', 'resource-availability', routeId, departure, arrival, excludeTripId] as const

export function useTripResourceAvailability({
  routeId,
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  excludeTripId = null,
  enabled = true,
}: UseTripResourceAvailabilityArgs) {
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

  const parsed = requestKey
    ? requestKey.split('|')
    : ([] as string[])
  const queryRouteId = Number(parsed[0])
  const queryDeparture = parsed[1] ?? ''
  const queryArrival = parsed[2] ?? ''
  const queryExcludeId = Number(parsed[3]) || 0

  const query = useQuery({
    queryKey: tripResourceAvailabilityQueryKey(
      queryRouteId,
      queryDeparture,
      queryArrival,
      queryExcludeId,
    ),
    enabled: Boolean(requestKey) && !isDebouncing && isQueryReady,
    staleTime: 15_000,
    queryFn: ({ signal }) =>
      companyTripsService.getResourceAvailability(
        {
          route_id: queryRouteId,
          departure_time: queryDeparture,
          estimated_arrival_time: queryArrival,
          exclude_trip_id: queryExcludeId > 0 ? queryExcludeId : null,
        },
        signal,
      ),
  })

  return {
    availability: isQueryReady ? query.data ?? null : null,
    isQueryReady,
    isLoading: isQueryReady && (isDebouncing || query.isFetching),
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
  }
}
