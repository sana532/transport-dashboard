import { formatRouteLabel } from '@/modules/trips/utils/formatRouteLabel'
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
    (typeof record.name_ar === 'string' && record.name_ar.trim()) || nameEn
  return {
    name_en: nameEn,
    name_ar: nameAr,
    name: nameEn || nameAr,
  }
}

export function routeDisplayName(route: CompanyRoute, locale: string): string {
  const label = formatRouteLabel(
    {
      route,
      origin_city: route.origin_city,
      destination_city: route.destination_city,
      origin_station: route.origin_station,
      destination_station: route.destination_station,
      route_id: route.id,
    },
    locale,
  )
  if (label !== '—') return label

  if (locale.startsWith('ar')) {
    return route.name_ar?.trim() || route.name_en?.trim() || route.name?.trim() || ''
  }
  return route.name_en?.trim() || route.name?.trim() || route.name_ar?.trim() || ''
}
