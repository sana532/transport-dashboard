import { lineString } from '@turf/turf'
import type { Feature, LineString, Position } from 'geojson'

/**
 * Decode a Google-encoded polyline (precision 5) into [lat, lng] pairs.
 * Spec: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodeRoutePolyline(
  encoded: string | null | undefined,
): Array<[number, number]> {
  if (!encoded || !encoded.trim()) return []

  const coordinates: Array<[number, number]> = []
  let index = 0
  let lat = 0
  let lng = 0
  const input = encoded.trim()

  try {
    while (index < input.length) {
      let result = 0
      let shift = 0
      let byte: number

      do {
        byte = input.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
      lat += deltaLat

      result = 0
      shift = 0

      do {
        byte = input.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1
      lng += deltaLng

      const nextLat = lat / 1e5
      const nextLng = lng / 1e5
      if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
        coordinates.push([nextLat, nextLng])
      }
    }
  } catch {
    return []
  }

  return coordinates
}

/** Turf LineString uses [lng, lat]. */
export function routePolylineToLineString(
  encoded: string | null | undefined,
): Feature<LineString> | null {
  const latLngs = decodeRoutePolyline(encoded)
  if (latLngs.length < 2) return null

  const coordinates: Position[] = latLngs.map(([lat, lng]) => [lng, lat])
  return lineString(coordinates)
}
