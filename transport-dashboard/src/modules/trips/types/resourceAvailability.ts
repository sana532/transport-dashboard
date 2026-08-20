import type { CityRef } from '@/modules/geography/types'

export type TripResourceAvailabilityInput = {
  route_id: number
  departure_time: string
  estimated_arrival_time: string
  exclude_trip_id?: number | null
}

export type ResourceConflictType = 'time_overlap' | 'geography_previous' | (string & {})

export type ResourceConflict = {
  type: ResourceConflictType
  trip_id: number | null
  departure_time: string | null
  estimated_arrival_time: string | null
  origin_city: CityRef | null
  destination_city: CityRef | null
  from_city: CityRef | null
  to_city: CityRef | null
  required_minutes: number | null
  available_minutes: number | null
}

export type AvailableDriver = {
  id: number
  name: string
  status: string
  license_status: string
}

export type UnavailableDriver = AvailableDriver & {
  reasons: string[]
  message: string
  conflict: ResourceConflict | null
}

export type AvailableVehicle = {
  id: number
  plate_number: string
  is_active: boolean
  mechanical_status: string
  seat_count: number
}

export type UnavailableVehicle = AvailableVehicle & {
  reasons: string[]
  message: string
  conflict: ResourceConflict | null
}

export type ResourceCounts = {
  available: number
  unavailable: number
  total: number
}

export type TripResourceWindow = {
  route_id: number
  route_name: string
  origin_city_id: number | null
  origin_city: CityRef | null
  destination_city_id: number | null
  destination_city: CityRef | null
  departure_time: string
  estimated_arrival_time: string | null
  estimated_duration_minutes: number | null
  exclude_trip_id: number | null
}

export type TripResourceAvailability = {
  window: TripResourceWindow
  drivers: {
    available_ids: number[]
    available: AvailableDriver[]
    unavailable: UnavailableDriver[]
    counts: ResourceCounts
  }
  vehicles: {
    available_ids: number[]
    available: AvailableVehicle[]
    unavailable: UnavailableVehicle[]
    counts: ResourceCounts
  }
}
