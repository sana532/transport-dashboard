export type CityRef = {
  id: number
  name: string
}

export type City = {
  id: number
  /** Display name — usually name_en, falls back to name_ar / legacy name */
  name: string
  name_en?: string | null
  name_ar?: string | null
  /** Legacy field; prefer name_ar for Arabic label when present */
  governorate_name?: string | null
  latitude?: number
  longitude?: number
}

/** POST/PATCH body — platform cities require bilingual names */
export type CityWritePayload = {
  name_en: string
  name_ar: string
  latitude: number
  longitude: number
}

export type CityFormInput = {
  nameEn: string
  nameAr: string
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
  city_id: number
  name: string
  governorate_name: string
  latitude: number
  longitude: number
}

export type StationFormInput = {
  cityId: string
  name: string
  governorateName: string
  latitude: string
  longitude: string
}

/** Platform + company catalog — GET /api/platform/rest-areas or /api/rest-areas */
export type RestArea = {
  id: number
  name: string
  description?: string | null
  city_id?: number
  governorate_name?: string | null
  latitude?: number
  longitude?: number
  is_active?: boolean
  city?: CityRef | null
}

/** POST/PATCH body — Admin-Platform Postman → Geography → Rest Areas */
export type RestAreaWritePayload = {
  city_id: number
  name: string
  description: string
  latitude: number
  longitude: number
  is_active: boolean
}

export type RestAreaFormInput = {
  cityId: string
  name: string
  description: string
  latitude: string
  longitude: string
  isActive: boolean
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
