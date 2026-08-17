import type { RestArea } from '@/modules/geography/types'
import { translateCityName } from '@/modules/geography/utils/cityNames'

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

export function normalizeRestArea(raw: unknown): RestArea | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  if (!Number.isFinite(id) || !name) return null

  const nestedCity =
    record.city && typeof record.city === 'object' ? (record.city as Record<string, unknown>) : null

  let city: RestArea['city'] = null
  let cityId = pickNumber(record, 'city_id')

  if (nestedCity) {
    const nestedId = typeof nestedCity.id === 'number' ? nestedCity.id : Number(nestedCity.id)
    const nestedName = pickStringField(nestedCity, 'name')
    if (Number.isFinite(nestedId)) cityId = nestedId
    if (Number.isFinite(nestedId) && nestedName) {
      city = { id: nestedId, name: nestedName }
    }
  }

  const cityNameFromRoot = pickStringField(record, 'city_name')
  if (!city && cityNameFromRoot && Number.isFinite(cityId)) {
    city = { id: cityId!, name: cityNameFromRoot }
  }

  const governorate_name =
    pickStringField(record, 'governorate_name') ??
    (nestedCity ? pickStringField(nestedCity, 'governorate_name') : null) ??
    (typeof record.city === 'string' ? record.city.trim() : null)

  const description = pickStringField(record, 'description')
  const isActiveRaw = record.is_active
  const is_active =
    typeof isActiveRaw === 'boolean'
      ? isActiveRaw
      : isActiveRaw === 1 || isActiveRaw === '1' || isActiveRaw === 'true'
        ? true
        : isActiveRaw === 0 || isActiveRaw === '0' || isActiveRaw === 'false'
          ? false
          : undefined

  return {
    id,
    name,
    description,
    city_id: cityId,
    governorate_name,
    latitude: pickNumber(record, 'latitude'),
    longitude: pickNumber(record, 'longitude'),
    is_active,
    city,
  }
}

export function formatRestAreaCoords(area: RestArea): string {
  if (area.latitude != null && area.longitude != null) {
    return `${area.latitude}, ${area.longitude}`
  }
  return '—'
}

export function formatRestAreaCityLabel(area: RestArea, locale = 'en'): string {
  const raw = area.city?.name || area.governorate_name
  return raw ? translateCityName(raw, locale) : '—'
}

export function unwrapRestAreaList(payload: unknown): RestArea[] {
  const fromArray = (items: unknown[]) =>
    items.map(normalizeRestArea).filter((item): item is RestArea => item !== null)

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

export function unwrapRestAreaOne(payload: unknown): RestArea | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data && typeof root.data === 'object') {
    return normalizeRestArea(root.data)
  }
  return normalizeRestArea(root)
}

export function formatRestAreaLabel(area: RestArea, locale = 'en'): string {
  const city = formatRestAreaCityLabel(area, locale)
  if (city && city !== '—') return `${area.name} — ${city}`
  return area.name
}
