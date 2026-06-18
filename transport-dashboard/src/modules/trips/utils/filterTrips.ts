import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import { formatTripRouteLabel } from '@/modules/trips/utils/mapCompanyTrip'

export type TripListFilters = {
  search: string
  status: 'all' | CompanyTrip['status']
}

export const defaultTripListFilters: TripListFilters = {
  search: '',
  status: 'all',
}

export function filterTrips(trips: CompanyTrip[], filters: TripListFilters): CompanyTrip[] {
  const q = filters.search.trim().toLowerCase()

  return trips.filter((trip) => {
    if (filters.status !== 'all' && trip.status !== filters.status) return false
    if (!q) return true

    const haystack = [
      String(trip.id),
      `#${trip.id}`,
      formatTripRouteLabel(trip),
      trip.driver?.name,
      trip.vehicle?.plate_number,
      trip.vehicle?.name,
      trip.status,
      trip.departure_time,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })
}
