import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  DisplayTripLocation,
  TripLocationMode,
  TripLocationUpdate,
} from '@/modules/trips/types/tripTracking'
import {
  ageMsSinceLocation,
  estimateNextPosition,
  pushLocationHistory,
  type EstimateNextPositionInput,
} from '@/modules/trips/utils/deadReckoning'
import type { Feature, LineString } from 'geojson'

/** No real GPS update for this long → start estimation / freeze. */
export const STALE_AFTER_MS = 45_000

const ESTIMATE_TICK_MS = 1_000

export type UsePredictedTripLocationOptions = {
  staleAfterMs?: number
  /** Planned route — enables along-route prediction while GPS is silent. */
  routeLine?: Feature<LineString> | null
}

export type PredictedTripLocationResult = {
  displayLocation: DisplayTripLocation | null
  locationMode: TripLocationMode | null
  lastRealLocation: TripLocationUpdate | null
}

function toDisplay(
  location: TripLocationUpdate,
  source: DisplayTripLocation['source'],
): DisplayTripLocation {
  return { ...location, source }
}

function locationKey(location: TripLocationUpdate | null): string | null {
  if (!location) return null
  return `${location.trip_id}:${location.lat}:${location.lng}:${location.timestamp}:${location.speed ?? ''}:${location.heading ?? ''}`
}

/**
 * Wraps a real GPS location (live WS or REST fallback) with stale detection
 * and along-route / free dead-reckoning while GPS is silent.
 */
export function usePredictedTripLocation(
  realLocation: TripLocationUpdate | null,
  options?: UsePredictedTripLocationOptions,
): PredictedTripLocationResult {
  const staleAfterMs = options?.staleAfterMs ?? STALE_AFTER_MS
  const routeLine = options?.routeLine ?? null

  const [history, setHistory] = useState<TripLocationUpdate[]>([])
  const [locationMode, setLocationMode] = useState<TripLocationMode | null>(null)
  const [estimatedCoords, setEstimatedCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  )

  const realKey = locationKey(realLocation)
  const historyRef = useRef(history)
  historyRef.current = history

  // Ingest each distinct real GPS sample into history and reset to live / stale.
  useEffect(() => {
    if (!realLocation) {
      setHistory([])
      setLocationMode(null)
      setEstimatedCoords(null)
      return
    }

    const prev = historyRef.current
    const base =
      prev.length > 0 && prev[0]?.trip_id !== realLocation.trip_id ? [] : prev
    const nextHistory = pushLocationHistory(base, realLocation)
    setHistory(nextHistory)
    historyRef.current = nextHistory

    const age = ageMsSinceLocation(realLocation)
    if (age != null && age >= staleAfterMs) {
      const estimate = estimateNextPosition({
        history: nextHistory,
        now: Date.now(),
        routeLine,
      } satisfies EstimateNextPositionInput)

      if (estimate) {
        setLocationMode(estimate.mode)
        setEstimatedCoords({ lat: estimate.lat, lng: estimate.lng })
        return
      }
    }

    setLocationMode('live')
    setEstimatedCoords(null)
  }, [realKey, realLocation, staleAfterMs, routeLine])

  // While stale, tick dead reckoning every second.
  useEffect(() => {
    if (!realLocation || locationMode === 'live' || locationMode == null) return

    const tick = () => {
      const age = ageMsSinceLocation(realLocation)
      if (age == null || age < staleAfterMs) {
        setLocationMode('live')
        setEstimatedCoords(null)
        return
      }

      const estimate = estimateNextPosition({
        history: historyRef.current,
        now: Date.now(),
        routeLine,
      })

      if (!estimate) {
        setLocationMode('stale_frozen')
        setEstimatedCoords({ lat: realLocation.lat, lng: realLocation.lng })
        return
      }

      setLocationMode(estimate.mode)
      setEstimatedCoords({ lat: estimate.lat, lng: estimate.lng })
    }

    tick()
    const id = window.setInterval(tick, ESTIMATE_TICK_MS)
    return () => window.clearInterval(id)
  }, [realLocation, locationMode, staleAfterMs, routeLine])

  // Watch for crossing the stale threshold while still in live mode.
  useEffect(() => {
    if (!realLocation || locationMode !== 'live') return

    const age = ageMsSinceLocation(realLocation) ?? 0
    const remaining = Math.max(0, staleAfterMs - age)

    const id = window.setTimeout(() => {
      const estimate = estimateNextPosition({
        history: historyRef.current,
        now: Date.now(),
        routeLine,
      })
      if (!estimate) {
        setLocationMode('stale_frozen')
        setEstimatedCoords({ lat: realLocation.lat, lng: realLocation.lng })
        return
      }
      setLocationMode(estimate.mode)
      setEstimatedCoords({ lat: estimate.lat, lng: estimate.lng })
    }, remaining)

    return () => window.clearTimeout(id)
  }, [realLocation, locationMode, staleAfterMs, routeLine])

  const displayLocation = useMemo((): DisplayTripLocation | null => {
    if (!realLocation || locationMode == null) return null

    if (
      (locationMode === 'estimated' || locationMode === 'stale_frozen') &&
      estimatedCoords
    ) {
      return toDisplay(
        {
          trip_id: realLocation.trip_id,
          lat: estimatedCoords.lat,
          lng: estimatedCoords.lng,
          timestamp: realLocation.timestamp,
          speed: realLocation.speed,
          heading: realLocation.heading,
        },
        locationMode === 'estimated' ? 'estimated' : 'gps',
      )
    }

    return toDisplay(realLocation, 'gps')
  }, [realLocation, locationMode, estimatedCoords])

  return {
    displayLocation,
    locationMode,
    lastRealLocation: realLocation,
  }
}
