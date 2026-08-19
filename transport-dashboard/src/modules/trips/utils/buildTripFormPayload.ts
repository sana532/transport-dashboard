import { combineScheduleDateTimeToIso, splitScheduleIsoToFormFields } from '@/shared/utils/formatDateTime'
import type { CompanyTripStatus, TripFormInput, TripMutationInput } from '@/modules/trips/types/companyTrip'

export type TripFormState = {
  routeId: string
  vehicleId: string
  driverId: string
  departureDate: string
  departureTime: string
  arrivalDate: string
  arrivalTime: string
  baseFare: string
  availableSeats: string
  status: CompanyTripStatus
}

export function combineDateTimeToIso(date: string, time: string): string | null {
  return combineScheduleDateTimeToIso(date, time)
}

export function splitIsoToFormFields(iso: string): { date: string; time: string } {
  return splitScheduleIsoToFormFields(iso)
}

export function defaultArrivalFromDeparture(departureIso: string): string {
  return arrivalFromDepartureAndDuration(departureIso, '04:00')
}

export function arrivalFromDepartureAndDuration(
  departureIso: string,
  durationHhmm?: string | null,
): string {
  const match = durationHhmm?.trim().match(/^(\d{1,2}):(\d{2})$/)
  const addHours = match ? Number(match[1]) : 4
  const addMinutes = match ? Number(match[2]) : 0
  if (!Number.isFinite(addHours) || !Number.isFinite(addMinutes)) {
    return departureIso
  }

  const departure = splitScheduleIsoToFormFields(departureIso)
  if (!departure.date || !departure.time) return departureIso

  const [hours, minutes] = departure.time.split(':').map((value) => Number(value))
  const totalMinutes = hours * 60 + minutes + addHours * 60 + addMinutes
  const dayOffset = Math.floor(totalMinutes / (24 * 60))
  const remainder = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const arrivalHours = Math.floor(remainder / 60)
  const arrivalMinutes = remainder % 60
  const arrivalDate = dayOffset > 0 ? shiftDateByDays(departure.date, dayOffset) : departure.date

  return (
    combineScheduleDateTimeToIso(
      arrivalDate,
      `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`,
    ) ?? departureIso
  )
}

function shiftDateByDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map((value) => Number(value))
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return shifted.toISOString().slice(0, 10)
}

export function buildTripFormPayload(state: TripFormState): TripFormInput | null {
  const departureIso = combineDateTimeToIso(state.departureDate, state.departureTime)
  if (!departureIso) return null

  let arrivalIso = combineDateTimeToIso(state.arrivalDate, state.arrivalTime)
  if (!arrivalIso) {
    arrivalIso = defaultArrivalFromDeparture(departureIso)
  }

  const routeId = Number(state.routeId)
  const vehicleId = Number(state.vehicleId)
  const driverId = Number(state.driverId)
  const baseFare = Number(state.baseFare)
  const availableSeats = Number(state.availableSeats)

  if (
    !Number.isFinite(routeId) ||
    !Number.isFinite(vehicleId) ||
    !Number.isFinite(driverId) ||
    !Number.isFinite(baseFare) ||
    baseFare <= 0 ||
    !Number.isInteger(availableSeats) ||
    availableSeats <= 0
  ) {
    return null
  }

  return {
    route_id: routeId,
    vehicle_id: vehicleId,
    driver_id: driverId,
    departure_time: departureIso,
    estimated_arrival_time: arrivalIso,
    base_fare: baseFare,
    available_seats: availableSeats,
    status: state.status,
  }
}

export function buildTripMutationPayload(state: TripFormState): TripMutationInput | null {
  const payload = buildTripFormPayload(state)
  if (!payload) return null
  const { status: _status, ...mutation } = payload
  return mutation
}

export function applyCompanyTripToFormState(trip: {
  route_id: number
  vehicle_id: number
  driver_id: number
  departure_time: string
  estimated_arrival_time: string
  base_fare: number
  available_seats: number
  status: CompanyTripStatus
}): TripFormState {
  const departure = splitIsoToFormFields(trip.departure_time)
  const arrival = splitIsoToFormFields(trip.estimated_arrival_time)

  return {
    routeId: String(trip.route_id),
    vehicleId: String(trip.vehicle_id),
    driverId: String(trip.driver_id),
    departureDate: departure.date,
    departureTime: departure.time,
    arrivalDate: arrival.date,
    arrivalTime: arrival.time,
    baseFare: String(trip.base_fare),
    availableSeats: String(trip.available_seats),
    status: trip.status,
  }
}
