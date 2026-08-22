import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { bookingsService } from '@/modules/bookings/services/bookingsService'
import { driversService } from '@/modules/drivers/services/driversService'
import { mapCompanyDriverToDriver } from '@/modules/drivers/utils/mapCompanyDriver'
import { routesService } from '@/modules/routes/services/routesService'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import { isArchivedTrip } from '@/modules/trips/services/tripsManagementService'
import type {
  CompanyTripStatus,
  TripMutationInput,
} from '@/modules/trips/types/companyTrip'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'
import { mapCompanyVehicleToVehicle } from '@/modules/vehicles/utils/mapCompanyVehicle'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'

export const tripFormCatalogQueryKey = ['trip-form', 'catalog'] as const

export const tripDetailQueryKey = (id: number) => ['trips', 'detail', id] as const

export function useTripFormCatalog() {
  const query = useQuery({
    queryKey: tripFormCatalogQueryKey,
    queryFn: async () => {
      const [routes, vehicleRows, driverRows] = await Promise.all([
        routesService.listRoutes(),
        vehiclesService.listVehicles(),
        driversService.listDrivers(),
      ])
      return {
        routes,
        vehicles: vehicleRows.map(mapCompanyVehicleToVehicle),
        drivers: driverRows.map(mapCompanyDriverToDriver),
      }
    },
  })

  return {
    routes: query.data?.routes ?? [],
    vehicles: query.data?.vehicles ?? [],
    drivers: query.data?.drivers ?? [],
    isLoading: query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
  }
}

export function useTripFormTrip(tripId: number | null) {
  const enabled = tripId != null && Number.isFinite(tripId) && tripId > 0

  const query = useQuery({
    queryKey: tripDetailQueryKey(enabled ? tripId : 0),
    enabled,
    staleTime: 0,
    queryFn: async () => {
      const id = tripId as number
      const trip = await companyTripsService.getTrip(id)
      let bookingsCount = 0
      try {
        const tripBookings = await bookingsService.listBookingsForTrip(id)
        bookingsCount = tripBookings.length
      } catch {
        // Fall back to trip seat stats if bookings endpoint fails
      }
      const fromStats = trip.stats?.booked_seats ?? 0
      const fromSeatMap = trip.seat_map?.filter((seat) => seat.is_booked).length ?? 0
      return {
        trip,
        bookedCount: Math.max(bookingsCount, fromStats, fromSeatMap),
      }
    },
  })

  return {
    trip: query.data?.trip ?? null,
    bookedCount: query.data?.bookedCount ?? 0,
    isLoading: enabled && query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
  }
}

type SaveTripInput = {
  isEdit: boolean
  tripId: number | null
  payload: TripMutationInput
  status: CompanyTripStatus
  initialStatus: CompanyTripStatus | null
}

type SaveTripResult =
  | { destination: 'archive'; tripId: number; status: CompanyTripStatus }
  | { destination: 'list' }

export function useSaveTrip() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (input: SaveTripInput): Promise<SaveTripResult> => {
      if (input.isEdit && input.tripId != null) {
        await companyTripsService.updateTrip(input.tripId, input.payload)
        if (input.status !== input.initialStatus) {
          await companyTripsService.updateTripStatus(input.tripId, { status: input.status })
        }
        const verified = await companyTripsService.getTrip(input.tripId)
        if (verified.status !== input.status) {
          throw new Error(t('tripForm.error.statusNotSaved'))
        }
        if (isArchivedTrip(input.status)) {
          return { destination: 'archive', tripId: input.tripId, status: input.status }
        }
        return { destination: 'list' }
      }

      await companyTripsService.createTrip(input.payload)
      return { destination: 'list' }
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] })
      if (result.destination === 'archive') {
        navigate(paths.company.tripArchive, {
          state: { archivedTripId: result.tripId, status: result.status },
        })
        return
      }
      navigate(paths.company.trips)
    },
  })
}
