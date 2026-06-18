import type { CityRef } from '@/modules/geography/types'

export type CompanyTripStatus = 'scheduled' | 'active' | 'completed' | 'cancelled'

export type TripStationRef = {
  id: number
  name: string
}

export type TripRouteRef = {
  id: number
  name: string
  name_en?: string
  name_ar?: string
  rest_areas?: unknown[]
}

export type TripVehicleRef = {
  id: number
  plate_number: string
  name: string
  image_url?: string | null
}

export type TripDriverRef = {
  id: number
  name: string
  avatar_url?: string | null
}

export type TripVehicleLayout = {
  grid: {
    rows: number
    columns: number
  }
  static_elements?: Array<{
    type: string
    column: number
    row_start: number
    row_end: number
    label?: string
  }>
  layout_type?: string
}

export type TripSeatMapEntry = {
  seat_number: number
  is_booked: boolean
  ticket_id: number | null
  booking_reference: string | null
  passenger_name: string | null
  passenger_phone_number: string | null
  passenger_gender: string | null
}

export type TripSeatStats = {
  total_seats: number
  available_seats: number
  booked_seats: number
  total_revenue: number
}

export type TripCurrentLocation = {
  latitude: number
  longitude: number
}

export type CompanyTrip = {
  id: number
  status: CompanyTripStatus
  departure_time: string
  estimated_arrival_time: string
  base_fare: number
  available_seats: number
  route_id: number
  vehicle_id: number
  driver_id: number
  origin_station_id?: number
  destination_station_id?: number
  origin_city_id?: number
  destination_city_id?: number
  origin_city?: CityRef | null
  destination_city?: CityRef | null
  origin_station?: TripStationRef | null
  destination_station?: TripStationRef | null
  route?: TripRouteRef | null
  vehicle?: TripVehicleRef | null
  driver?: TripDriverRef | null
  vehicle_layout?: TripVehicleLayout | null
  seat_map?: TripSeatMapEntry[]
  stats?: TripSeatStats | null
  current_location?: TripCurrentLocation | null
  last_location_updated_at?: string | null
  created_at?: string
  updated_at?: string
}

export type TripFormInput = {
  route_id: number
  vehicle_id: number
  driver_id: number
  departure_time: string
  estimated_arrival_time: string
  base_fare: number
  available_seats: number
  status: CompanyTripStatus
}

export type TripMutationInput = Omit<TripFormInput, 'status'>

export type TripStatusUpdateInput = {
  status: CompanyTripStatus
}

export type TripCloneInput = {
  departure_time: string
  vehicle_id: number
  driver_id: number
}
