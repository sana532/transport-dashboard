export type TripLocationUpdate = {
  trip_id: number
  lat: number
  lng: number
  timestamp: string
}

export type TripTrackingConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'unconfigured'

export const TRIP_LOCATION_UPDATED_EVENT = '.Modules\\Operations\\Events\\TripLocationUpdated'

/** Laravel may broadcast with dots instead of backslashes. */
export const TRIP_LOCATION_UPDATED_EVENT_DOTS =
  '.Modules.Operations.Events.TripLocationUpdated'

/** When the event uses broadcastAs('TripLocationUpdated'). */
export const TRIP_LOCATION_UPDATED_EVENT_SHORT = '.TripLocationUpdated'

export function tripTrackingChannel(tripId: number): string {
  return `trip.${tripId}.tracking`
}

export function tripPrivateChannelName(tripId: number): string {
  return `private-trip.${tripId}.tracking`
}

function parseNumericId(value: unknown, fallback?: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  if (typeof fallback === 'number' && Number.isFinite(fallback)) return fallback
  return NaN
}

function unwrapBroadcastPayload(raw: unknown): Record<string, unknown> | null {
  let value: unknown = raw

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }

  if (!value || typeof value !== 'object') return null

  const row = value as Record<string, unknown>
  let nested: unknown = row.data ?? row

  if (typeof nested === 'string') {
    try {
      nested = JSON.parse(nested)
    } catch {
      nested = row
    }
  }

  return nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : null
}

export function parseTripLocationPayload(
  raw: unknown,
  fallbackTripId?: number,
): TripLocationUpdate | null {
  const nested = unwrapBroadcastPayload(raw)
  if (!nested) return null

  const trip_id = parseNumericId(nested.trip_id, fallbackTripId)

  const latRaw = nested.lat ?? nested.latitude
  const lngRaw = nested.lng ?? nested.longitude

  const lat =
    typeof latRaw === 'number'
      ? latRaw
      : typeof latRaw === 'string'
        ? Number(latRaw)
        : NaN

  const lng =
    typeof lngRaw === 'number'
      ? lngRaw
      : typeof lngRaw === 'string'
        ? Number(lngRaw)
        : NaN

  const timestamp =
    typeof nested.timestamp === 'string'
      ? nested.timestamp
      : typeof nested.last_location_updated_at === 'string'
        ? nested.last_location_updated_at
        : new Date().toISOString()

  if (!Number.isFinite(trip_id) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { trip_id, lat, lng, timestamp }
}
