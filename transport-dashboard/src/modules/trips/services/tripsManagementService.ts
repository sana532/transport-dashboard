import type { TripsManagementData, TripsRecentRow } from '@/modules/trips/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import type { CompanyTripsListQuery } from '@/modules/trips/types/tripsListQuery'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import {
  formatTripDateTime,
  formatTripRouteLabel,
} from '@/modules/trips/utils/mapCompanyTrip'
import {
  enrichCompanyTrips,
  tripNeedsRouteCatalogEnrichment,
} from '@/modules/trips/utils/enrichCompanyTrips'
import { routesService } from '@/modules/routes/services/routesService'
import { isArchivedTrip } from '@/modules/trips/utils/tripStatus'
import { driversService } from '@/modules/drivers/services/driversService'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'

export { isArchivedTrip } from '@/modules/trips/utils/tripStatus'

export type TripsListPagination = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number
  to: number
}

export function mapTripToRecentRow(trip: CompanyTrip, locale: string): TripsRecentRow {
  const routeLocale = locale.startsWith('ar') ? 'ar' : 'en'
  return {
    id: `#${trip.id}`,
    numericId: trip.id,
    route: formatTripRouteLabel(trip, routeLocale),
    driver: trip.driver?.name ?? '—',
    vehicle: trip.vehicle?.plate_number ?? trip.vehicle?.name ?? '—',
    dateTime: formatTripDateTime(trip.departure_time, locale),
    status: trip.status,
    departureIso: trip.departure_time,
  }
}

async function enrichTrips(rows: CompanyTrip[]): Promise<CompanyTrip[]> {
  const needsDriverEnrichment = rows.some(
    (trip) => trip.driver_id != null && !trip.driver?.name,
  )
  const needsVehicleEnrichment = rows.some(
    (trip) =>
      trip.vehicle_id != null &&
      !trip.vehicle?.plate_number &&
      !trip.vehicle?.name,
  )
  const needsRouteEnrichment = tripNeedsRouteCatalogEnrichment(rows)

  const [drivers, vehicles, routes] = await Promise.all([
    needsDriverEnrichment ? driversService.listDrivers() : Promise.resolve([]),
    needsVehicleEnrichment ? vehiclesService.listVehicles() : Promise.resolve([]),
    needsRouteEnrichment ? routesService.listRoutes() : Promise.resolve([]),
  ])

  return enrichCompanyTrips(rows, drivers, vehicles, routes)
}

function toManagementPayload(
  trips: CompanyTrip[],
  locale: string,
): Omit<TripsManagementData, 'stats'> & { trips: CompanyTrip[] } {
  const recentTrips = trips
    .filter((trip) => !isArchivedTrip(trip.status))
    .map((trip) => mapTripToRecentRow(trip, locale))
  const archivedTrips = trips
    .filter((trip) => isArchivedTrip(trip.status))
    .map((trip) => mapTripToRecentRow(trip, locale))

  return {
    trips,
    recentTrips,
    archivedTrips,
    defaultFilters: {
      search: '',
      dateRange: '',
      route: '',
      status: 'all',
    },
  }
}

export const tripsManagementService = {
  async getTripsManagementPage(
    locale: string,
    options?: CompanyTripsListQuery,
  ): Promise<
    Omit<TripsManagementData, 'stats'> & {
      trips: CompanyTrip[]
      pagination: TripsListPagination
      counts: Record<string, unknown> | null
    }
  > {
    const pageResult = await companyTripsService.listTripsPage(options)
    const trips = await enrichTrips(pageResult.trips)

    return {
      ...toManagementPayload(trips, locale),
      counts: pageResult.counts,
      pagination: {
        currentPage: pageResult.currentPage,
        lastPage: pageResult.lastPage,
        perPage: pageResult.perPage,
        total: pageResult.total,
        from: pageResult.from,
        to: pageResult.to,
      },
    }
  },

  /** Full list for archive / legacy consumers. Prefer `getTripsManagementPage`. */
  async getTripsManagementData(
    locale: string,
    filters?: Omit<CompanyTripsListQuery, 'page' | 'perPage'>,
  ): Promise<Omit<TripsManagementData, 'stats'> & { trips: CompanyTrip[] }> {
    const rows = await companyTripsService.listTrips(filters)
    const trips = await enrichTrips(rows)
    return toManagementPayload(trips, locale)
  },
}
