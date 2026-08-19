import type { CityRef } from '@/modules/geography/types'

/** Lightweight options from GET /api/company/lookups */
export type LookupRoute = {
  id: number
  name: string
  name_en?: string
  name_ar?: string
}

export type LookupDriver = {
  id: number
  name: string
  /** User id when the lookup row is a driver profile. */
  user_id?: number
  /** driver_profile.id when the lookup row is a user. */
  profile_id?: number
}

export type LookupVehicle = {
  id: number
  name: string
  plate_number?: string | null
}

export type LookupCity = CityRef

export type LookupStation = {
  id: number
  name: string
  city_id?: number
}

export type CompanyLookups = {
  routes: LookupRoute[]
  drivers: LookupDriver[]
  vehicles: LookupVehicle[]
  cities: LookupCity[]
  stations: LookupStation[]
}

export type CompanyLookupsQuery = {
  routes?: boolean
  drivers?: boolean
  vehicles?: boolean
  cities?: boolean
  stations?: boolean
}
