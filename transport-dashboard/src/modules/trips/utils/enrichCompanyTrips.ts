import type { CompanyDriver } from '@/modules/drivers/types'
import type { CompanyRoute } from '@/modules/routes/types'
import type { CompanyVehicle } from '@/modules/vehicles/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'

function resolveDriverRef(
  trip: CompanyTrip,
  drivers: CompanyDriver[],
): CompanyTrip['driver'] {
  if (trip.driver?.name) return trip.driver

  const byUserId = drivers.find((driver) => driver.id === trip.driver_id)
  if (byUserId) {
    return {
      id: trip.driver_id,
      name: byUserId.name,
      avatar_url: byUserId.driver_profile?.avatar ?? null,
    }
  }

  const byProfileId = drivers.find(
    (driver) => driver.driver_profile?.id === trip.driver_id,
  )
  if (byProfileId) {
    return {
      id: trip.driver_id,
      name: byProfileId.name,
      avatar_url: byProfileId.driver_profile?.avatar ?? null,
    }
  }

  return trip.driver ?? null
}

function resolveVehicleRef(
  trip: CompanyTrip,
  vehicles: CompanyVehicle[],
): CompanyTrip['vehicle'] {
  if (trip.vehicle?.plate_number || trip.vehicle?.name) return trip.vehicle

  const vehicle = vehicles.find((row) => row.id === trip.vehicle_id)
  if (!vehicle) return trip.vehicle ?? null

  return {
    id: vehicle.id,
    plate_number: vehicle.plate_number,
    name: vehicle.vehicle_model?.name ?? 'Bus',
    image_url: vehicle.photos[0] ?? null,
  }
}

function routeHasStoredName(route: CompanyTrip['route']): boolean {
  if (!route) return false
  return Boolean(
    route.name_en?.trim() || route.name?.trim() || route.name_ar?.trim(),
  )
}

function resolveRouteRef(
  trip: CompanyTrip,
  catalogRoute: CompanyRoute | undefined,
): CompanyTrip['route'] {
  if (routeHasStoredName(trip.route)) return trip.route

  if (!catalogRoute) return trip.route ?? null

  return {
    id: catalogRoute.id,
    name: catalogRoute.name,
    name_en: catalogRoute.name_en,
    name_ar: catalogRoute.name_ar,
    rest_areas: catalogRoute.rest_areas,
  }
}

function tripNeedsRouteEnrichment(trip: CompanyTrip): boolean {
  if (!trip.route_id) return false
  return !routeHasStoredName(trip.route)
}

export function tripNeedsRouteCatalogEnrichment(trips: CompanyTrip[]): boolean {
  return trips.some(tripNeedsRouteEnrichment)
}

export function enrichCompanyTrips(
  trips: CompanyTrip[],
  drivers: CompanyDriver[],
  vehicles: CompanyVehicle[],
  routes: CompanyRoute[] = [],
): CompanyTrip[] {
  return trips.map((trip) => {
    const catalogRoute = routes.find((route) => route.id === trip.route_id)

    return {
      ...trip,
      route: resolveRouteRef(trip, catalogRoute),
      origin_station:
        trip.origin_station ??
        (catalogRoute?.origin_station
          ? { id: catalogRoute.origin_station.id, name: catalogRoute.origin_station.name }
          : trip.origin_station),
      destination_station:
        trip.destination_station ??
        (catalogRoute?.destination_station
          ? {
              id: catalogRoute.destination_station.id,
              name: catalogRoute.destination_station.name,
            }
          : trip.destination_station),
      origin_city: trip.origin_city ?? catalogRoute?.origin_city ?? null,
      destination_city: trip.destination_city ?? catalogRoute?.destination_city ?? null,
      driver: resolveDriverRef(trip, drivers),
      vehicle: resolveVehicleRef(trip, vehicles),
    }
  })
}
