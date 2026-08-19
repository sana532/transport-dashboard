import type {
  CompanyTrip,
  CompanyTripStatus,
  TripResolutionStatus,
} from '@/modules/trips/types/companyTrip'
import type { CompanyTripsListQuery } from '@/modules/trips/types/tripsListQuery'
import type { CompanyRoute } from '@/modules/routes/types'
import { formatRouteLabel } from '@/modules/trips/utils/formatRouteLabel'
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

/** Date/city/station (and similar) are not in the backend list contract — scan all pages locally. */
export function requiresFullTripScan(filters: TripListFilters): boolean {
  return hasActiveTripFilters(filters)
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

function catalogRouteForTrip(
  trip: CompanyTrip,
  routes?: CompanyRoute[] | null,
): CompanyRoute | undefined {
  const routeId = resolveTripRouteId(trip)
  if (routeId == null || !routes?.length) return undefined
  return routes.find((route) => route.id === routeId)
}

function tripOriginCityIds(trip: CompanyTrip, catalogRoute?: CompanyRoute): number[] {
  return [
    trip.origin_city_id,
    trip.origin_city?.id,
    catalogRoute?.origin_city_id,
    catalogRoute?.origin_city?.id,
    catalogRoute?.origin_station?.city_id,
    catalogRoute?.origin_station?.city?.id,
  ].filter((id): id is number => id != null && Number.isFinite(id) && id > 0)
}

function tripDestinationCityIds(trip: CompanyTrip, catalogRoute?: CompanyRoute): number[] {
  return [
    trip.destination_city_id,
    trip.destination_city?.id,
    catalogRoute?.destination_city_id,
    catalogRoute?.destination_city?.id,
    catalogRoute?.destination_station?.city_id,
    catalogRoute?.destination_station?.city?.id,
  ].filter((id): id is number => id != null && Number.isFinite(id) && id > 0)
}

function tripOriginStationIds(trip: CompanyTrip, catalogRoute?: CompanyRoute): number[] {
  return [
    trip.origin_station_id,
    trip.origin_station?.id,
    catalogRoute?.origin_station_id,
    catalogRoute?.origin_station?.id,
  ].filter((id): id is number => id != null && Number.isFinite(id) && id > 0)
}

function tripDestinationStationIds(trip: CompanyTrip, catalogRoute?: CompanyRoute): number[] {
  return [
    trip.destination_station_id,
    trip.destination_station?.id,
    catalogRoute?.destination_station_id,
    catalogRoute?.destination_station?.id,
  ].filter((id): id is number => id != null && Number.isFinite(id) && id > 0)
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

function tripMatchesDriver(trip: CompanyTrip, driverId: number, aliasIds?: number[]): boolean {
  const ids = new Set<number>([driverId, ...(aliasIds ?? [])].filter((id) => Number.isFinite(id) && id > 0))
  const tripIds = [trip.driver_id, trip.driver?.id].filter(
    (id): id is number => id != null && Number.isFinite(id) && id > 0,
  )
  return tripIds.some((id) => ids.has(id))
}

function tripMatchesSearch(trip: CompanyTrip, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    String(trip.id),
    `#${trip.id}`,
    trip.route?.name,
    trip.route?.name_en,
    trip.route?.name_ar,
    formatRouteLabel(trip, 'ar'),
    formatRouteLabel(trip, 'en'),
    trip.driver?.name,
    trip.vehicle?.name,
    trip.vehicle?.plate_number,
    trip.origin_city?.name,
    trip.destination_city?.name,
    trip.origin_station?.name,
    trip.destination_station?.name,
  ]

  return haystack.some((value) => value?.toLowerCase().includes(q))
}

function tripMatchesDeparture(trip: CompanyTrip, date: string, time: string): boolean {
  if (!date && !time) return true

  const split = splitScheduleIsoToFormFields(trip.departure_time)
  const isoDate = trip.departure_time.slice(0, 10)
  const tripDate = split.date || (/^\d{4}-\d{2}-\d{2}/.test(isoDate) ? isoDate : '')
  const tripTime = (split.time || trip.departure_time.slice(11, 16)).slice(0, 5)

  if (date && tripDate !== date) return false
  if (time && tripTime !== time.slice(0, 5)) return false
  return true
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

export type ApplyLocalTripFiltersOptions = {
  selectedRoute?: CompanyRoute | null
  routes?: CompanyRoute[] | null
  /** Extra ids for the selected driver (user id + driver_profile id). */
  driverAliasIds?: number[]
}

/** Local filters — source of truth when the list API ignores city/station/date (or `view`). */
export function applyLocalTripFilters(
  trips: CompanyTrip[],
  filters: TripListFilters,
  options?: ApplyLocalTripFiltersOptions,
): CompanyTrip[] {
  const routeId = optionalId(filters.routeId)
  const driverId = optionalId(filters.driverId)
  const originCityId = optionalId(filters.originCityId)
  const destinationCityId = optionalId(filters.destinationCityId)
  const originStationId = optionalId(filters.originStationId)
  const destinationStationId = optionalId(filters.destinationStationId)

  return trips.filter((trip) => {
    if (filters.status !== 'all' && trip.status !== filters.status) return false
    if (
      filters.resolutionStatus !== 'all' &&
      trip.resolution_status !== filters.resolutionStatus
    ) {
      return false
    }
    if (!tripMatchesSearch(trip, filters.search)) return false

    const catalogRoute = catalogRouteForTrip(trip, options?.routes) ?? options?.selectedRoute ?? undefined

    if (routeId !== 'all') {
      if (!tripMatchesSelectedRoute(trip, routeId, options?.selectedRoute)) return false
    }
    if (driverId !== 'all' && !tripMatchesDriver(trip, driverId, options?.driverAliasIds)) {
      return false
    }
    if (originCityId !== 'all' && !tripOriginCityIds(trip, catalogRoute).includes(originCityId)) {
      return false
    }
    if (
      destinationCityId !== 'all' &&
      !tripDestinationCityIds(trip, catalogRoute).includes(destinationCityId)
    ) {
      return false
    }
    if (
      originStationId !== 'all' &&
      !tripOriginStationIds(trip, catalogRoute).includes(originStationId)
    ) {
      return false
    }
    if (
      destinationStationId !== 'all' &&
      !tripDestinationStationIds(trip, catalogRoute).includes(destinationStationId)
    ) {
      return false
    }

    if (!tripMatchesDeparture(trip, filters.departureDate, filters.departureTime)) {
      return false
    }
    return true
  })
}
