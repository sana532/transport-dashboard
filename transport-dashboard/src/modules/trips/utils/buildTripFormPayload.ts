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
  if (!date || !time) return null
  const local = new Date(`${date}T${time}:00`)
  if (Number.isNaN(local.getTime())) return null
  return local.toISOString()
}

export function splitIsoToFormFields(iso: string): { date: string; time: string } {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '' }
  const year = parsed.getFullYear().toString().padStart(4, '0')
  const month = (parsed.getMonth() + 1).toString().padStart(2, '0')
  const day = parsed.getDate().toString().padStart(2, '0')
  const hours = parsed.getHours().toString().padStart(2, '0')
  const minutes = parsed.getMinutes().toString().padStart(2, '0')
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

export function defaultArrivalFromDeparture(departureIso: string): string {
  const departure = new Date(departureIso)
  if (Number.isNaN(departure.getTime())) return departureIso
  return new Date(departure.getTime() + 4 * 60 * 60 * 1000).toISOString()
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
