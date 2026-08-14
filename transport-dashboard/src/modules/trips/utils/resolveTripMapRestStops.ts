import { nearestPointOnLine, point } from '@turf/turf'
import type { Feature, LineString } from 'geojson'
import type { RestArea } from '@/modules/geography/types'
import type { RouteRestAreaStop } from '@/modules/geography/types'
import type { TripMapRestStop } from '@/modules/trips/components/TripTrackingMap'

/** Max distance from the planned route to treat a catalog rest area as on-path. */
export const REST_AREA_NEAR_ROUTE_KM = 3

function catalogToMapStop(area: RestArea, durationMinutes?: number): TripMapRestStop | null {
  if (
    area.latitude == null ||
    area.longitude == null ||
    !Number.isFinite(area.latitude) ||
    !Number.isFinite(area.longitude)
  ) {
    return null
  }
  if (area.is_active === false) return null

  return {
    id: area.id,
    name: area.name,
    lat: area.latitude,
    lng: area.longitude,
    durationMinutes,
  }
}

function distanceToRouteKm(
  lat: number,
  lng: number,
  routeLine: Feature<LineString>,
): number | null {
  try {
    const snapped = nearestPointOnLine(routeLine, point([lng, lat]), { units: 'kilometers' })
    const dist = snapped.properties.dist
    return typeof dist === 'number' && Number.isFinite(dist) ? dist : null
  } catch {
    return null
  }
}

/**
 * Prefer trip-linked rest stops; otherwise pick active catalog areas near the route polyline.
 */
export function resolveTripMapRestStops(input: {
  routeStops?: RouteRestAreaStop[] | null
  catalog: RestArea[]
  routeLine?: Feature<LineString> | null
  nearRouteKm?: number
}): TripMapRestStop[] {
  const { routeStops, catalog, routeLine, nearRouteKm = REST_AREA_NEAR_ROUTE_KM } = input
  const byId = new Map(catalog.map((area) => [area.id, area]))

  const fromTrip =
    routeStops
      ?.slice()
      .sort((a, b) => a.stop_order - b.stop_order)
      .map((stop) => {
        const nested = stop.rest_area
        const fromNested = nested ? catalogToMapStop(nested, stop.duration_minutes) : null
        if (fromNested) return fromNested

        const fromCatalog = byId.get(stop.id)
        return fromCatalog ? catalogToMapStop(fromCatalog, stop.duration_minutes) : null
      })
      .filter((item): item is TripMapRestStop => item != null) ?? []

  if (fromTrip.length > 0) return fromTrip

  if (!routeLine || routeLine.geometry.coordinates.length < 2) return []

  return catalog
    .map((area) => {
      const mapped = catalogToMapStop(area)
      if (!mapped) return null
      const distKm = distanceToRouteKm(mapped.lat, mapped.lng, routeLine)
      if (distKm == null || distKm > nearRouteKm) return null
      return { stop: mapped, distKm }
    })
    .filter((item): item is { stop: TripMapRestStop; distKm: number } => item != null)
    .sort((a, b) => a.distKm - b.distKm)
    .map((item) => item.stop)
}
