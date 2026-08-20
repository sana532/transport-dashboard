import type { CityRef } from '@/modules/geography/types'
import type {
  AvailableDriver,
  AvailableVehicle,
  ResourceConflict,
  ResourceCounts,
  TripResourceAvailability,
  TripResourceWindow,
  UnavailableDriver,
  UnavailableVehicle,
} from '@/modules/trips/types/resourceAvailability'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(asString).filter(Boolean)
}

function asIdList(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map(asNumber).filter((id): id is number => id != null)
}

function parseCity(value: unknown): CityRef | null {
  const record = asRecord(value)
  if (!record) return null
  const id = asNumber(record.id)
  const name = asString(record.name).trim()
  if (id == null || !name) return null
  return { id, name }
}

function parseConflict(value: unknown): ResourceConflict | null {
  const record = asRecord(value)
  if (!record) return null
  return {
    type: asString(record.type) || 'unknown',
    trip_id: asNumber(record.trip_id),
    departure_time: asString(record.departure_time) || null,
    estimated_arrival_time: asString(record.estimated_arrival_time) || null,
    origin_city: parseCity(record.origin_city),
    destination_city: parseCity(record.destination_city),
    from_city: parseCity(record.from_city),
    to_city: parseCity(record.to_city),
    required_minutes: asNumber(record.required_minutes),
    available_minutes: asNumber(record.available_minutes),
  }
}

function parseCounts(value: unknown, available: number, unavailable: number): ResourceCounts {
  const record = asRecord(value)
  return {
    available: asNumber(record?.available) ?? available,
    unavailable: asNumber(record?.unavailable) ?? unavailable,
    total: asNumber(record?.total) ?? available + unavailable,
  }
}

function parseAvailableDriver(value: unknown): AvailableDriver | null {
  const record = asRecord(value)
  if (!record) return null
  const id = asNumber(record.id)
  const name = asString(record.name).trim()
  if (id == null || !name) return null
  return {
    id,
    name,
    status: asString(record.status),
    license_status: asString(record.license_status),
  }
}

function parseUnavailableDriver(value: unknown): UnavailableDriver | null {
  const base = parseAvailableDriver(value)
  const record = asRecord(value)
  if (!base || !record) return null
  return {
    ...base,
    reasons: asStringList(record.reasons),
    message: asString(record.message).trim(),
    conflict: parseConflict(record.conflict),
  }
}

function parseAvailableVehicle(value: unknown): AvailableVehicle | null {
  const record = asRecord(value)
  if (!record) return null
  const id = asNumber(record.id)
  const plate = asString(record.plate_number).trim()
  if (id == null || !plate) return null
  return {
    id,
    plate_number: plate,
    is_active: asBoolean(record.is_active),
    mechanical_status: asString(record.mechanical_status),
    seat_count: asNumber(record.seat_count) ?? 0,
  }
}

function parseUnavailableVehicle(value: unknown): UnavailableVehicle | null {
  const base = parseAvailableVehicle(value)
  const record = asRecord(value)
  if (!base || !record) return null
  return {
    ...base,
    reasons: asStringList(record.reasons),
    message: asString(record.message).trim(),
    conflict: parseConflict(record.conflict),
  }
}

function parseWindow(value: unknown): TripResourceWindow | null {
  const record = asRecord(value)
  if (!record) return null
  const routeId = asNumber(record.route_id) ?? 0
  return {
    route_id: routeId,
    route_name: asString(record.route_name),
    origin_city_id: asNumber(record.origin_city_id),
    origin_city: parseCity(record.origin_city),
    destination_city_id: asNumber(record.destination_city_id),
    destination_city: parseCity(record.destination_city),
    departure_time: asString(record.departure_time),
    estimated_arrival_time: asString(record.estimated_arrival_time) || null,
    estimated_duration_minutes: asNumber(record.estimated_duration_minutes),
    exclude_trip_id: asNumber(record.exclude_trip_id),
  }
}

export function availabilityReasonLabel(
  reasons: string[],
  t: (key: string) => string,
): string {
  const reason = reasons[0]
  if (!reason) return ''
  const key = `tripForm.availability.reason.${reason}`
  const label = t(key)
  return label === key ? reason.replace(/_/g, ' ') : label
}

export function formatAvailabilityDepartureTime(date: string, time: string): string | null {
  if (!date.trim() || !time.trim()) return null
  const [hours = '00', minutes = '00', seconds = '00'] = time.split(':')
  if (!hours || !minutes) return null
  return `${date.trim()} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${(seconds || '00').padStart(2, '0')}`
}

/** ISO local time with Syria offset, matching availability API responses. */
export function formatAvailabilityDepartureIso(spaceDateTime: string): string | null {
  const match = spaceDateTime
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return null
  const seconds = match[4] ?? '00'
  return `${match[1]}T${match[2]}:${match[3]}:${seconds}+03:00`
}

export function mapTripResourceAvailability(payload: unknown): TripResourceAvailability | null {
  const root = asRecord(payload)
  if (!root) return null
  const data = asRecord(root.data) ?? root
  if (!data) return null

  const window =
    parseWindow(data.window) ??
    ({
      route_id: 0,
      route_name: '',
      origin_city_id: null,
      origin_city: null,
      destination_city_id: null,
      destination_city: null,
      departure_time: '',
      estimated_arrival_time: null,
      estimated_duration_minutes: null,
      exclude_trip_id: null,
    } satisfies TripResourceWindow)

  const drivers = asRecord(data.drivers)
  const vehicles = asRecord(data.vehicles)
  if (!drivers || !vehicles) return null

  const availableDrivers = Array.isArray(drivers.available)
    ? drivers.available.map(parseAvailableDriver).filter((row): row is AvailableDriver => row !== null)
    : []
  const unavailableDrivers = Array.isArray(drivers.unavailable)
    ? drivers.unavailable
        .map(parseUnavailableDriver)
        .filter((row): row is UnavailableDriver => row !== null)
    : []
  const availableVehicles = Array.isArray(vehicles.available)
    ? vehicles.available
        .map(parseAvailableVehicle)
        .filter((row): row is AvailableVehicle => row !== null)
    : []
  const unavailableVehicles = Array.isArray(vehicles.unavailable)
    ? vehicles.unavailable
        .map(parseUnavailableVehicle)
        .filter((row): row is UnavailableVehicle => row !== null)
    : []

  return {
    window,
    drivers: {
      available_ids: asIdList(drivers.available_ids).length
        ? asIdList(drivers.available_ids)
        : availableDrivers.map((row) => row.id),
      available: availableDrivers,
      unavailable: unavailableDrivers,
      counts: parseCounts(drivers.counts, availableDrivers.length, unavailableDrivers.length),
    },
    vehicles: {
      available_ids: asIdList(vehicles.available_ids).length
        ? asIdList(vehicles.available_ids)
        : availableVehicles.map((row) => row.id),
      available: availableVehicles,
      unavailable: unavailableVehicles,
      counts: parseCounts(vehicles.counts, availableVehicles.length, unavailableVehicles.length),
    },
  }
}
