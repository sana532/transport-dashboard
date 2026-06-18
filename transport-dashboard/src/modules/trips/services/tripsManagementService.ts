import type { TripsManagementData, TripsRecentRow } from '@/modules/trips/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import {
  formatTripDateTime,
  formatTripRouteLabel,
} from '@/modules/trips/utils/mapCompanyTrip'
import { enrichCompanyTrips } from '@/modules/trips/utils/enrichCompanyTrips'
import { isArchivedTrip } from '@/modules/trips/utils/tripStatus'
import { driversService } from '@/modules/drivers/services/driversService'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'

export { isArchivedTrip } from '@/modules/trips/utils/tripStatus'

export function mapTripToRecentRow(trip: CompanyTrip, locale: string): TripsRecentRow {
  return {
    id: `#${trip.id}`,
    numericId: trip.id,
    route: formatTripRouteLabel(trip),
    driver: trip.driver?.name ?? '—',
    vehicle: trip.vehicle?.plate_number ?? trip.vehicle?.name ?? '—',
    dateTime: formatTripDateTime(trip.departure_time, locale),
    status: trip.status,
    departureIso: trip.departure_time,
  }
}

export const tripsManagementService = {
  async getTripsManagementData(
    locale: string,
  ): Promise<Omit<TripsManagementData, 'stats'> & { trips: CompanyTrip[] }> {
    const [rows, drivers, vehicles] = await Promise.all([
      companyTripsService.listTrips(),
      driversService.listDrivers(),
      vehiclesService.listVehicles(),
    ])
    const trips = enrichCompanyTrips(rows, drivers, vehicles)
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
  },
}
