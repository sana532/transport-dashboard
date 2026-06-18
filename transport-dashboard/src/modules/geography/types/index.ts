export type CityRef = {
  id: number
  name: string
}

export type City = {
  id: number
  name: string
  governorate_name?: string | null
  latitude?: number
  longitude?: number
}

/** POST/PATCH body — Postman Geography → Cities */
export type CityWritePayload = {
  name: string
  governorate_name: string
  latitude: number
  longitude: number
}

export type CityFormInput = {
  name: string
  governorateName: string
  latitude: string
  longitude: string
}

export type Station = {
  id: number
  city_id: number
  name: string
  governorate_name?: string | null
  latitude?: number
  longitude?: number
  city?: CityRef | null
}

/** POST/PATCH body for platform admin — see Postman Geography → Stations */
export type StationWritePayload = {
  name: string
  governorate_name: string
  latitude: number
  longitude: number
}

export type StationFormInput = {
  name: string
  governorateName: string
  latitude: string
  longitude: string
}

/** Read-only catalog — GET /api/rest-areas (company Postman → Geography) */
export type RestArea = {
  id: number
  name: string
  city_id?: number
  governorate_name?: string | null
  latitude?: number
  longitude?: number
  city?: CityRef | null
}

/** Sent on POST/PATCH /api/company/routes */
export type RouteRestAreaInput = {
  id: number
  stop_order: number
  duration_minutes: number
}

/** Rest stop as returned on a company route */
export type RouteRestAreaStop = RouteRestAreaInput & {
  rest_area?: RestArea | null
}
