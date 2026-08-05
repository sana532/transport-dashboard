import type { CompanyTrip } from '@/modules/trips/types/companyTrip'

/**
 * A scheduled trip needs review once its expected arrival has passed.
 * Falls back to departure time only when the arrival timestamp is invalid.
 */
export function isScheduledTripOverdue(
  trip: Pick<CompanyTrip, 'status' | 'departure_time' | 'estimated_arrival_time'>,
  nowMs = Date.now(),
): boolean {
  if (trip.status !== 'scheduled') return false

  const arrivalMs = Date.parse(trip.estimated_arrival_time)
  if (Number.isFinite(arrivalMs)) return arrivalMs < nowMs

  const departureMs = Date.parse(trip.departure_time)
  return Number.isFinite(departureMs) && departureMs < nowMs
}
