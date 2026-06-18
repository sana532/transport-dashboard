type RouteLabelInput = {
  route?: { name?: string; name_en?: string; name_ar?: string } | null
  origin_city?: { name: string } | null
  destination_city?: { name: string } | null
  origin_station?: { name: string } | null
  destination_station?: { name: string } | null
  route_id?: number
}

/** Prefer origin/destination cities — route.name can be stale (e.g. Hama vs Homs). */
export function formatRouteLabel(input: RouteLabelInput, locale = 'en'): string {
  const origin = input.origin_station?.name ?? input.origin_city?.name
  const destination = input.destination_station?.name ?? input.destination_city?.name

  if (origin && destination) return `${origin} → ${destination}`

  if (input.route) {
    if (locale.startsWith('ar') && input.route.name_ar) return input.route.name_ar
    if (input.route.name_en) return input.route.name_en
    if (input.route.name) return input.route.name
  }

  if (input.route_id) return `Route #${input.route_id}`
  return '—'
}
