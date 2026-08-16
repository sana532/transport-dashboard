import type {
  CompanyTripStatus,
  TripResolutionStatus,
} from '@/modules/trips/types/companyTrip'
import { serializeTripStatusForApi } from '@/modules/trips/utils/tripStatus'

/** Query params for GET /api/company/trips (server-side filters). */
export type CompanyTripsListQuery = {
  page?: number
  perPage?: number
  search?: string
  status?: CompanyTripStatus | 'all'
  resolutionStatus?: TripResolutionStatus | 'all'
  flagged?: boolean
  routeId?: number | 'all'
  driverId?: number | 'all'
  originCityId?: number | 'all'
  destinationCityId?: number | 'all'
  originStationId?: number | 'all'
  destinationStationId?: number | 'all'
}

function asId(value: number | string | 'all' | undefined | null): number | undefined {
  if (value == null || value === 'all' || value === '') return undefined
  const id = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(id) ? id : undefined
}

export function buildCompanyTripsListParams(
  query: CompanyTripsListQuery,
): Record<string, string | number | boolean> {
  const page = Math.max(1, Math.floor(query.page ?? 1))
  const perPage = Math.min(20, Math.max(1, Math.floor(query.perPage ?? 20)))
  const params: Record<string, string | number | boolean> = {
    page,
    per_page: perPage,
  }

  const search = query.search?.trim()
  if (search) params.search = search

  if (query.status && query.status !== 'all') {
    params.status = serializeTripStatusForApi(query.status)
  }

  if (query.resolutionStatus && query.resolutionStatus !== 'all') {
    params.resolution_status = query.resolutionStatus
  }

  if (query.flagged === true) params.flagged = true

  const routeId = asId(query.routeId)
  if (routeId != null) params.route_id = routeId

  const driverId = asId(query.driverId)
  if (driverId != null) params.driver_id = driverId

  const originCityId = asId(query.originCityId)
  if (originCityId != null) params.origin_city_id = originCityId

  const destinationCityId = asId(query.destinationCityId)
  if (destinationCityId != null) params.destination_city_id = destinationCityId

  const originStationId = asId(query.originStationId)
  if (originStationId != null) params.origin_station_id = originStationId

  const destinationStationId = asId(query.destinationStationId)
  if (destinationStationId != null) {
    params.destination_station_id = destinationStationId
  }

  return params
}
