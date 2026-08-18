import { translateCityName } from '@/modules/geography/utils/cityNames'
import type { Station } from '@/modules/geography/types'
import type { CompanyRoute } from '@/modules/routes/types'

export function pickRouteNameFields(record: Record<string, unknown>): {
  name_en: string
  name_ar: string
  name: string
} {
  const nameEn =
    (typeof record.name_en === 'string' && record.name_en.trim()) ||
    (typeof record.name === 'string' && record.name.trim()) ||
    ''
  const nameAr =
    (typeof record.name_ar === 'string' && record.name_ar.trim()) || ''
  return {
    name_en: nameEn,
    name_ar: nameAr || nameEn,
    name: nameEn || nameAr,
  }
}

export function hasArabicScript(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text)
}

type StationLike = Pick<Station, 'id' | 'name'> & {
  city?: { name: string } | null
}

export function stationCityLabel(station: StationLike, locale: string): string {
  if (station.city?.name?.trim()) {
    return translateCityName(station.city.name.trim(), locale)
  }
  return station.name
}

/** Label from departure/arrival stations — used only when route has no stored name. */
export function buildRouteLabelFromStations(
  origin: StationLike,
  destination: StationLike,
  locale: string,
): string {
  const lang = locale.startsWith('ar') ? 'ar' : 'en'
  const fromLabel = stationCityLabel(origin, lang)
  const toLabel = stationCityLabel(destination, lang)
  const arrow = lang === 'ar' ? ' إلى ' : ' to '
  if (fromLabel === toLabel) {
    return `${origin.name}${arrow}${destination.name}`
  }
  return `${fromLabel}${arrow}${toLabel}`
}

export function resolveRouteStations(
  route: CompanyRoute,
  stations?: Station[],
): { origin: StationLike | null; destination: StationLike | null } {
  let origin: StationLike | null = route.origin_station
    ? {
        id: route.origin_station.id,
        name: route.origin_station.name,
        city: route.origin_city ?? route.origin_station.city ?? null,
      }
    : null

  let destination: StationLike | null = route.destination_station
    ? {
        id: route.destination_station.id,
        name: route.destination_station.name,
        city: route.destination_city ?? route.destination_station.city ?? null,
      }
    : null

  if (stations?.length) {
    if (!origin && route.origin_station_id) {
      const found = stations.find((station) => station.id === route.origin_station_id)
      if (found) origin = found
    }
    if (!destination && route.destination_station_id) {
      const found = stations.find((station) => station.id === route.destination_station_id)
      if (found) destination = found
    }
  }

  return { origin, destination }
}

/** Turn "Damascus to Homs" into "دمشق إلى حمص" when only an English label exists. */
export function translateEnglishRoutePhrase(name: string, locale: string): string {
  const trimmed = name.trim()
  if (!trimmed || !locale.startsWith('ar') || hasArabicScript(trimmed)) return trimmed

  const match = trimmed.match(/^(.+?)\s+to\s+(.+)$/i)
  if (!match) return trimmed

  const from = translateCityName(match[1].trim(), 'ar')
  const to = translateCityName(match[2].trim(), 'ar')
  if (from === match[1].trim() && to === match[2].trim()) return trimmed
  return `${from} إلى ${to}`
}

function storedRouteLabel(route: CompanyRoute, locale: string): string {
  if (locale.startsWith('ar')) {
    const ar = route.name_ar?.trim()
    if (ar) return ar
    const en = route.name_en?.trim() || route.name?.trim()
    if (en) return translateEnglishRoutePhrase(en, locale)
    return ''
  }

  return route.name_en?.trim() || route.name?.trim() || route.name_ar?.trim() || ''
}

/** Prefer names saved on the route; fall back to station/city labels only when empty. */
export function routeDisplayName(
  route: CompanyRoute,
  locale: string,
  options?: { stations?: Station[] },
): string {
  const stored = storedRouteLabel(route, locale)
  if (stored) return stored

  const { origin, destination } = resolveRouteStations(route, options?.stations)
  if (origin && destination) {
    return buildRouteLabelFromStations(origin, destination, locale)
  }

  return ''
}

export function buildAutoRouteNameEn(
  originStationId: string | number,
  destinationStationId: string | number,
  stations: Station[],
): string {
  const origin = stations.find((station) => String(station.id) === String(originStationId))
  const destination = stations.find((station) => String(station.id) === String(destinationStationId))
  if (!origin || !destination) return ''
  return buildRouteLabelFromStations(origin, destination, 'en')
}

export function buildAutoRouteNameAr(
  originStationId: string | number,
  destinationStationId: string | number,
  stations: Station[],
): string {
  const origin = stations.find((station) => String(station.id) === String(originStationId))
  const destination = stations.find((station) => String(station.id) === String(destinationStationId))
  if (!origin || !destination) return ''
  return buildRouteLabelFromStations(origin, destination, 'ar')
}
