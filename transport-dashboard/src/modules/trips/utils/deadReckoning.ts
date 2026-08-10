import { bearing, destination, distance, lineString, point } from '@turf/turf'
import type { Feature, LineString } from 'geojson'
import type { TripLocationMode, TripLocationUpdate } from '@/modules/trips/types/tripTracking'

/** Ignore jitter smaller than this when deriving speed/bearing. */
export const MIN_MOVE_METERS = 8

/** Cap unrealistic GPS jumps (~120 km/h). */
export const MAX_SPEED_MPS = 120 / 3.6

/** Below this, treat the bus as stopped and freeze instead of drifting. */
export const MIN_RELIABLE_SPEED_MPS = 0.5

export const LOCATION_HISTORY_MAX = 5

export type MotionEstimate = {
  bearingDeg: number
  speedMps: number
  reliable: boolean
}

export type EstimateNextPositionInput = {
  history: TripLocationUpdate[]
  /** Wall-clock ms used to measure elapsed time since the last real GPS sample. */
  now: number
  /**
   * Phase C: optional route LineString. When provided in a later phase,
   * estimation should snap/advance along the route (`nearestPointOnLine` + `along`).
   * Phase B ignores this and uses free dead reckoning.
   */
  routeLine?: Feature<LineString> | null
}

export type EstimatedPosition = {
  lat: number
  lng: number
  mode: Extract<TripLocationMode, 'estimated' | 'stale_frozen'>
}

function parseTimestampMs(timestamp: string): number | null {
  const ms = Date.parse(timestamp)
  return Number.isFinite(ms) ? ms : null
}

/**
 * Derive bearing + speed from the most recent meaningful segment in history.
 * Prefers the last two points that moved at least MIN_MOVE_METERS.
 */
export function deriveMotionFromHistory(history: TripLocationUpdate[]): MotionEstimate | null {
  if (history.length < 2) return null

  for (let end = history.length - 1; end >= 1; end -= 1) {
    const to = history[end]
    const from = history[end - 1]
    const fromMs = parseTimestampMs(from.timestamp)
    const toMs = parseTimestampMs(to.timestamp)
    if (fromMs == null || toMs == null) continue

    const dtSec = (toMs - fromMs) / 1000
    if (dtSec <= 0) continue

    const fromPt = point([from.lng, from.lat])
    const toPt = point([to.lng, to.lat])
    const movedMeters = distance(fromPt, toPt, { units: 'meters' })
    if (movedMeters < MIN_MOVE_METERS) continue

    const speedMps = Math.min(movedMeters / dtSec, MAX_SPEED_MPS)
    const bearingDeg = bearing(fromPt, toPt)

    return {
      bearingDeg,
      speedMps,
      reliable: speedMps >= MIN_RELIABLE_SPEED_MPS,
    }
  }

  return null
}

function estimateDeadReckoning(
  last: TripLocationUpdate,
  motion: MotionEstimate,
  now: number,
): EstimatedPosition {
  if (!motion.reliable) {
    return { lat: last.lat, lng: last.lng, mode: 'stale_frozen' }
  }

  const lastMs = parseTimestampMs(last.timestamp) ?? now
  const elapsedSec = Math.max(0, (now - lastMs) / 1000)
  if (elapsedSec <= 0) {
    return { lat: last.lat, lng: last.lng, mode: 'stale_frozen' }
  }

  const distanceKm = (motion.speedMps * elapsedSec) / 1000
  const next = destination(point([last.lng, last.lat]), distanceKm, motion.bearingDeg, {
    units: 'kilometers',
  })
  const [lng, lat] = next.geometry.coordinates

  return { lat, lng, mode: 'estimated' }
}

/**
 * Estimate where the bus should be when GPS has gone stale.
 *
 * Phase B: dead reckoning from recent points (bearing + speed).
 * Phase C: pass `routeLine` and switch the body to along-route advance;
 * the call site / hook contract stays the same.
 */
export function estimateNextPosition(input: EstimateNextPositionInput): EstimatedPosition | null {
  const { history, now, routeLine: _routeLine } = input
  if (history.length === 0) return null

  const last = history[history.length - 1]
  const motion = deriveMotionFromHistory(history)

  // Phase C hook: when routeLine is available, replace this branch with
  // nearestPointOnLine + along(routeLine, distanceTraveled).
  void _routeLine

  if (!motion) {
    return { lat: last.lat, lng: last.lng, mode: 'stale_frozen' }
  }

  return estimateDeadReckoning(last, motion, now)
}

/** Helper for Phase C callers that already have coordinate arrays. */
export function coordinatesToRouteLine(
  coordinates: Array<[number, number]>,
): Feature<LineString> | null {
  if (coordinates.length < 2) return null
  return lineString(coordinates)
}

export function pushLocationHistory(
  history: TripLocationUpdate[],
  next: TripLocationUpdate,
  max = LOCATION_HISTORY_MAX,
): TripLocationUpdate[] {
  const last = history[history.length - 1]
  if (
    last &&
    last.trip_id === next.trip_id &&
    last.lat === next.lat &&
    last.lng === next.lng &&
    last.timestamp === next.timestamp
  ) {
    return history
  }

  const merged = [...history, next]
  if (merged.length <= max) return merged
  return merged.slice(merged.length - max)
}

export function ageMsSinceLocation(location: TripLocationUpdate, now = Date.now()): number | null {
  const ms = parseTimestampMs(location.timestamp)
  if (ms == null) return null
  return Math.max(0, now - ms)
}
