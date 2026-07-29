import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import { formatTripRouteLabel } from '@/modules/trips/utils/mapCompanyTrip'
import { splitScheduleIsoToFormFields } from '@/shared/utils/formatDateTime'

export type TripListFilters = {
  search: string
  status: 'all' | CompanyTrip['status']
  routeId: string
  departureDate: string
  departureTime: string
}

export const defaultTripListFilters: TripListFilters = {
  search: '',
  status: 'all',
  routeId: 'all',
  departureDate: '',
  departureTime: '',
}

export function hasActiveTripFilters(filters: TripListFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.routeId !== 'all' ||
    filters.departureDate !== '' ||
    filters.departureTime !== ''
  )
}

export function filterTrips(trips: CompanyTrip[], filters: TripListFilters): CompanyTrip[] {
  const q = filters.search.trim().toLowerCase()
  const routeFilter = filters.routeId !== 'all' ? Number(filters.routeId) : null

  return trips.filter((trip) => {
    if (filters.status !== 'all' && trip.status !== filters.status) return false
    if (routeFilter != null && Number.isFinite(routeFilter) && trip.route_id !== routeFilter) {
      return false
    }

    const { date, time } = splitScheduleIsoToFormFields(trip.departure_time)
    if (filters.departureDate && date !== filters.departureDate) return false
    if (filters.departureTime && time.slice(0, 5) !== filters.departureTime.slice(0, 5)) {
      return false
    }

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
      date,
      time,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })
}
