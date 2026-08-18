import {
  buildRouteLabelFromStations,
  hasArabicScript,
  translateEnglishRoutePhrase,
} from '@/modules/routes/utils/routeDisplay'

type RouteLabelInput = {
  route?: { name?: string; name_en?: string; name_ar?: string } | null
  origin_city?: { name: string } | null
  destination_city?: { name: string } | null
  origin_station?: { name: string; city?: { name: string } | null } | null
  destination_station?: { name: string; city?: { name: string } | null } | null
  route_id?: number
}

function storedRouteName(input: RouteLabelInput, locale: string): string {
  if (!input.route) return ''

  if (locale.startsWith('ar')) {
    const ar = input.route.name_ar?.trim()
    if (ar) return ar
    const en = input.route.name_en?.trim() || input.route.name?.trim()
    if (en) return translateEnglishRoutePhrase(en, locale)
    return ''
  }

  return (
    input.route.name_en?.trim() ||
    input.route.name?.trim() ||
    input.route.name_ar?.trim() ||
    ''
  )
}

/** Prefer stored route name; use stations only when the route has no label. */
export function formatRouteLabel(input: RouteLabelInput, locale = 'en'): string {
  const stored = storedRouteName(input, locale)
  if (stored) return stored

  if (input.origin_station?.name && input.destination_station?.name) {
    return buildRouteLabelFromStations(
      {
        id: 0,
        name: input.origin_station.name,
        city: input.origin_city ?? input.origin_station.city ?? null,
      },
      {
        id: 0,
        name: input.destination_station.name,
        city: input.destination_city ?? input.destination_station.city ?? null,
      },
      locale,
    )
  }

  if (input.route) {
    if (locale.startsWith('ar')) {
      const ar = input.route.name_ar?.trim()
      if (ar && hasArabicScript(ar)) return ar
      const en = input.route.name_en?.trim() || input.route.name?.trim()
      if (en) return translateEnglishRoutePhrase(en, locale)
    } else {
      if (input.route.name_en) return input.route.name_en
      if (input.route.name) return input.route.name
      if (input.route.name_ar) return input.route.name_ar
    }
  }

  if (input.route_id) return locale.startsWith('ar') ? `مسار #${input.route_id}` : `Route #${input.route_id}`
  return '—'
}
