import type { Station } from '@/modules/geography/types'

function pickNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function pickStringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** Some API rows return governorate + coords merged in one string, e.g. Damascus33.53, 36.32 */
function parseMergedLocationLabel(value: string): {
  label: string
  latitude?: number
  longitude?: number
} | null {
  const match = value.match(/^(.+?)(\d+\.\d+)\s*,\s*(\d+\.\d+)\s*$/)
  if (!match) return null
  const latitude = Number(match[2])
  const longitude = Number(match[3])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { label: match[1].trim(), latitude, longitude }
}

export function normalizeStation(raw: unknown): Station | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const cityIdRoot = typeof record.city_id === 'number' ? record.city_id : Number(record.city_id)
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  if (!Number.isFinite(id) || !name) return null

  const nestedCity =
    record.city && typeof record.city === 'object' ? (record.city as Record<string, unknown>) : null

  const cityNameFromRoot = pickStringField(record, 'city_name')

  let city: Station['city'] = null
  let cityId = cityIdRoot

  if (nestedCity) {
    const nestedId = typeof nestedCity.id === 'number' ? nestedCity.id : Number(nestedCity.id)
    const nestedName = pickStringField(nestedCity, 'name')
    if (Number.isFinite(nestedId)) cityId = nestedId
    if (Number.isFinite(nestedId) && nestedName) {
      city = { id: nestedId, name: nestedName }
    }
  } else if (typeof record.city === 'string' && record.city.trim()) {
    city = null
  }

  if (!city && cityNameFromRoot && Number.isFinite(cityId)) {
    city = { id: cityId, name: cityNameFromRoot }
  }

  let governorate_name =
    pickStringField(record, 'governorate_name') ??
    (nestedCity ? pickStringField(nestedCity, 'governorate_name') : null) ??
    (typeof record.city === 'string' ? record.city.trim() : null)

  let latitude =
    pickNumber(record, 'latitude') ?? (nestedCity ? pickNumber(nestedCity, 'latitude') : undefined)

  let longitude =
    pickNumber(record, 'longitude') ??
    (nestedCity ? pickNumber(nestedCity, 'longitude') : undefined)

  const mergedFromCityName =
    city?.name && (!governorate_name || latitude == null)
      ? parseMergedLocationLabel(city.name)
      : null

  if (mergedFromCityName) {
    governorate_name = governorate_name ?? mergedFromCityName.label
    latitude = latitude ?? mergedFromCityName.latitude
    longitude = longitude ?? mergedFromCityName.longitude
    city = { id: city!.id, name: mergedFromCityName.label }
  }

  return {
    id,
    city_id: Number.isFinite(cityId) ? cityId : 0,
    name,
    governorate_name,
    latitude,
    longitude,
    city,
  }
}

export function unwrapStationList(payload: unknown): Station[] {
  const fromArray = (items: unknown[]) =>
    items.map(normalizeStation).filter((item): item is Station => item !== null)

  if (Array.isArray(payload)) return fromArray(payload)
  if (!payload || typeof payload !== 'object') return []

  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) return fromArray(root.data)
  if (root.data && typeof root.data === 'object') {
    const nested = root.data as Record<string, unknown>
    if (Array.isArray(nested.data)) return fromArray(nested.data)
  }
  return []
}

/** Display-only: strip merged coords from city label if API returns them in name. */
export function formatStationCityLabel(station: {
  city?: { name: string } | null
  city_id: number
}): string {
  if (station.city?.name) {
    const parsed = parseMergedLocationLabel(station.city.name)
    return parsed?.label ?? station.city.name
  }
  return station.city_id ? `#${station.city_id}` : '—'
}

export function unwrapStationOne(payload: unknown): Station | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data && typeof root.data === 'object') {
    return normalizeStation(root.data)
  }
  return normalizeStation(root)
}
