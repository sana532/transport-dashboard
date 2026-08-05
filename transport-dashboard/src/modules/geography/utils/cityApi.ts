import type { City } from '@/modules/geography/types'

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

export function normalizeCity(raw: unknown): City | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  const name_en = pickStringField(record, 'name_en')
  const name_ar = pickStringField(record, 'name_ar')
  const legacyName = pickStringField(record, 'name')
  const name = name_en ?? name_ar ?? legacyName
  if (!name) return null

  return {
    id,
    name,
    name_en,
    name_ar,
    governorate_name: pickStringField(record, 'governorate_name') ?? name_ar,
    latitude: pickNumber(record, 'latitude'),
    longitude: pickNumber(record, 'longitude'),
  }
}

export function unwrapCityList(payload: unknown): City[] {
  const fromArray = (items: unknown[]) =>
    items.map(normalizeCity).filter((item): item is City => item !== null)

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

export function unwrapCityOne(payload: unknown): City | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data && typeof root.data === 'object') {
    return normalizeCity(root.data)
  }
  return normalizeCity(root)
}

export function formatCityCoords(city: City): string {
  if (city.latitude != null && city.longitude != null) {
    return `${city.latitude}, ${city.longitude}`
  }
  return '—'
}

/** Dropdown / table label: "English — Arabic" when both exist */
export function formatCityLabel(city: City): string {
  const en = city.name_en?.trim() || city.name
  const ar = city.name_ar?.trim() || city.governorate_name?.trim()
  if (ar && ar !== en) return `${en} — ${ar}`
  return en
}
