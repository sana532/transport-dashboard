import type { CityRef, RouteRestAreaInput, RouteRestAreaStop, Station } from '@/modules/geography/types'

export type CompanyRoute = {
  id: number
  company_id: number
  /** Display fallback — prefer routeDisplayName() */
  name: string
  name_en: string
  name_ar: string
  origin_station_id: number
  destination_station_id: number
  origin_city_id?: number
  destination_city_id?: number
  estimated_duration_hhmm?: string | null
  base_fare?: number | null
  rest_areas?: RouteRestAreaStop[]
  origin_station?: Station | null
  destination_station?: Station | null
  origin_city?: CityRef | null
  destination_city?: CityRef | null
  created_at?: string
  updated_at?: string
}

export type RouteFormInput = {
  name_en: string
  name_ar: string
  origin_station_id: number
  destination_station_id: number
  estimated_duration_hhmm?: string
  base_fare?: number
  rest_areas?: RouteRestAreaInput[]
}
