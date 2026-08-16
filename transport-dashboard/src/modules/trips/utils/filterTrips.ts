import type {
  CompanyTrip,
  CompanyTripStatus,
  TripResolutionStatus,
} from '@/modules/trips/types/companyTrip'
import type { CompanyTripsListQuery } from '@/modules/trips/types/tripsListQuery'
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
): CompanyTrip[] {
  const routeId = optionalId(filters.routeId)
  const driverId = optionalId(filters.driverId)
  const originCityId = optionalId(filters.originCityId)
  const destinationCityId = optionalId(filters.destinationCityId)
  const originStationId = optionalId(filters.originStationId)
  const destinationStationId = optionalId(filters.destinationStationId)

  return trips.filter((trip) => {
    if (routeId !== 'all') {
      const tripRouteId = trip.route_id || trip.route?.id
      if (tripRouteId !== routeId) return false
    }
    if (driverId !== 'all' && trip.driver_id !== driverId) return false
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
