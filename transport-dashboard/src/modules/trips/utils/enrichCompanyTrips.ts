import type { CompanyDriver } from '@/modules/drivers/types'
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

export function enrichCompanyTrips(
  trips: CompanyTrip[],
  drivers: CompanyDriver[],
  vehicles: CompanyVehicle[],
): CompanyTrip[] {
  return trips.map((trip) => ({
    ...trip,
    driver: resolveDriverRef(trip, drivers),
    vehicle: resolveVehicleRef(trip, vehicles),
  }))
}
