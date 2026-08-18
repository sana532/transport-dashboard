import type {
  CompanyTrip,
  CompanyTripStatus,
  TripResolutionStatus,
} from '@/modules/trips/types/companyTrip'
import type { CompanyTripsListQuery } from '@/modules/trips/types/tripsListQuery'
import type { CompanyRoute } from '@/modules/routes/types'
import { splitScheduleIsoToFormFields } from '@/shared/utils/formatDateTime'

export type TripListFilters = {
  search: string
  status: 'all' | CompanyTripStatus
  resolutionStatus: 'all' | TripResolutionStatus
  routeId: string
  driverId: string
  originCityId: string
  destinationCityId: string
  originStationId: string
  destinationStationId: string
  /** Kept local — not in backend filter contract yet. */
  departureDate: string
  departureTime: string
}

export const defaultTripListFilters: TripListFilters = {
  search: '',
  status: 'all',
  resolutionStatus: 'all',
  routeId: 'all',
  driverId: 'all',
  originCityId: 'all',
  destinationCityId: 'all',
  originStationId: 'all',
  destinationStationId: 'all',
  departureDate: '',
  departureTime: '',
}

export function hasActiveTripFilters(filters: TripListFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.resolutionStatus !== 'all' ||
    filters.routeId !== 'all' ||
    filters.driverId !== 'all' ||
    filters.originCityId !== 'all' ||
    filters.destinationCityId !== 'all' ||
    filters.originStationId !== 'all' ||
    filters.destinationStationId !== 'all' ||
    filters.departureDate !== '' ||
    filters.departureTime !== ''
  )
}

function optionalId(value: string): number | 'all' {
  if (value === 'all' || value === '') return 'all'
  const id = Number(value)
  return Number.isFinite(id) ? id : 'all'
}

export function resolveTripRouteId(trip: CompanyTrip): number | null {
  const candidates: unknown[] = [trip.route_id, trip.route?.id]
  for (const raw of candidates) {
    if (raw == null || raw === 0) continue
    const id = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isFinite(id) && id > 0) return id
  }
  return null
}

function tripMatchesRouteEndpoints(trip: CompanyTrip, route: CompanyRoute): boolean {
  if (
    route.origin_station_id &&
    route.destination_station_id &&
    trip.origin_station_id &&
    trip.destination_station_id &&
    trip.origin_station_id === route.origin_station_id &&
    trip.destination_station_id === route.destination_station_id
  ) {
    return true
  }

  if (
    route.origin_city_id &&
    route.destination_city_id &&
    trip.origin_city_id &&
    trip.destination_city_id &&
    trip.origin_city_id === route.origin_city_id &&
    trip.destination_city_id === route.destination_city_id
  ) {
    return true
  }

  return false
}

export function tripMatchesSelectedRoute(
  trip: CompanyTrip,
  routeId: number,
  selectedRoute?: CompanyRoute | null,
): boolean {
  const tripRouteId = resolveTripRouteId(trip)
  if (tripRouteId != null && tripRouteId === routeId) return true
  if (selectedRoute && tripMatchesRouteEndpoints(trip, selectedRoute)) return true
  return false
}

/** Maps UI filter state to GET /company/trips query params. */
export function tripListFiltersToQuery(
  filters: TripListFilters,
  options?: { page?: number; perPage?: number },
): CompanyTripsListQuery {
  return {
    page: options?.page,
    perPage: options?.perPage,
    search: filters.search,
    status: filters.status,
    resolutionStatus: filters.resolutionStatus,
    routeId: optionalId(filters.routeId),
    driverId: optionalId(filters.driverId),
    originCityId: optionalId(filters.originCityId),
    destinationCityId: optionalId(filters.destinationCityId),
    originStationId: optionalId(filters.originStationId),
    destinationStationId: optionalId(filters.destinationStationId),
  }
}

/** Local-only filters that are not part of the trips list API contract yet,
 *  plus id-based safety nets when the current page still contains mismatches. */
export function applyLocalTripFilters(
  trips: CompanyTrip[],
  filters: TripListFilters,
  options?: { selectedRoute?: CompanyRoute | null },
): CompanyTrip[] {
  const routeId = optionalId(filters.routeId)
  const driverId = optionalId(filters.driverId)
  const originCityId = optionalId(filters.originCityId)
  const destinationCityId = optionalId(filters.destinationCityId)
  const originStationId = optionalId(filters.originStationId)
  const destinationStationId = optionalId(filters.destinationStationId)

  return trips.filter((trip) => {
    if (routeId !== 'all') {
      if (!tripMatchesSelectedRoute(trip, routeId, options?.selectedRoute)) return false
    }
    if (driverId !== 'all') {
      const tripDriverId = Number(trip.driver_id)
      if (!Number.isFinite(tripDriverId) || tripDriverId !== driverId) return false
    }
    if (originCityId !== 'all' && trip.origin_city_id !== originCityId) return false
    if (
      destinationCityId !== 'all' &&
      trip.destination_city_id !== destinationCityId
    ) {
      return false
    }
    if (originStationId !== 'all' && trip.origin_station_id !== originStationId) {
      return false
    }
    if (
      destinationStationId !== 'all' &&
      trip.destination_station_id !== destinationStationId
    ) {
      return false
    }

    if (!filters.departureDate && !filters.departureTime) return true

    const { date, time } = splitScheduleIsoToFormFields(trip.departure_time)
    if (filters.departureDate && date !== filters.departureDate) return false
    if (
      filters.departureTime &&
      time.slice(0, 5) !== filters.departureTime.slice(0, 5)
    ) {
      return false
    }
    return true
  })
}
