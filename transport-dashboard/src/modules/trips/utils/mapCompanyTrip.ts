import { pickRouteNameFields } from '@/modules/routes/utils/routeDisplay'
import { parseRestAreasFromRecord } from '@/modules/routes/utils/routeRestAreas'
import { formatRouteLabel } from '@/modules/trips/utils/formatRouteLabel'
import type {
  CompanyTrip,
  CompanyTripStatus,
  TripResolutionStatus,
  TripSeatMapEntry,
  TripSeatStats,
  TripVehicleLayout,
} from '@/modules/trips/types/companyTrip'
import { normalizeTripStatusFromApi } from '@/modules/trips/utils/tripStatus'
import { formatScheduleDateTime } from '@/shared/utils/formatDateTime'

function normalizeCityRef(raw: unknown): CompanyTrip['origin_city'] {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (typeof record.id === 'number' && typeof record.name === 'string') {
    return { id: record.id, name: record.name }
  }
  return null
}

function normalizeStationRef(raw: unknown): CompanyTrip['origin_station'] {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const name = typeof record.name === 'string' ? record.name : ''
  if (!Number.isFinite(id) || !name) return null
  return { id, name }
}

function normalizeStatus(raw: unknown): CompanyTripStatus {
  return normalizeTripStatusFromApi(raw)
}

function normalizeResolutionStatus(raw: unknown): TripResolutionStatus | null {
  const key = typeof raw === 'string' ? raw.toLowerCase() : ''
  if (
    key === 'pending_review' ||
    key === 'auto_completed' ||
    key === 'auto_cancelled'
  ) {
    return key
  }
  return null
}

function normalizeFlagged(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'number') return raw !== 0
  if (typeof raw === 'string') {
    const key = raw.trim().toLowerCase()
    return key === 'true' || key === '1'
  }
  return false
}

function normalizeVehicleLayout(raw: unknown): TripVehicleLayout | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const grid =
    record.grid && typeof record.grid === 'object'
      ? (record.grid as Record<string, unknown>)
      : null
  const rows = Number(grid?.rows)
  const columns = Number(grid?.columns)
  if (!Number.isFinite(rows) || !Number.isFinite(columns)) return null

  const static_elements = Array.isArray(record.static_elements)
    ? record.static_elements
        .filter((item): item is NonNullable<TripVehicleLayout['static_elements']>[number] => {
          if (!item || typeof item !== 'object') return false
          const element = item as Record<string, unknown>
          return (
            typeof element.type === 'string' &&
            Number.isFinite(Number(element.column)) &&
            Number.isFinite(Number(element.row_start)) &&
            Number.isFinite(Number(element.row_end))
          )
        })
        .map((element) => ({
          type: element.type,
          column: Number(element.column),
          row_start: Number(element.row_start),
          row_end: Number(element.row_end),
          label: typeof element.label === 'string' ? element.label : undefined,
        }))
    : undefined

  return {
    grid: { rows, columns },
    static_elements,
    layout_type: typeof record.layout_type === 'string' ? record.layout_type : undefined,
  }
}

function normalizeBooleanFlag(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'number') return raw !== 0
  if (typeof raw === 'string') {
    const key = raw.trim().toLowerCase()
    if (key === 'true' || key === '1') return true
    if (key === 'false' || key === '0' || key === '') return false
  }
  return Boolean(raw)
}

function normalizeSeatMapEntry(raw: unknown): TripSeatMapEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const seat_number = Number(
    record.seat_number ?? record.number ?? record.seatNumber ?? record.label,
  )
  if (!Number.isFinite(seat_number)) return null

  return {
    seat_number,
    is_booked: normalizeBooleanFlag(
      record.is_booked ?? record.booked ?? record.isBooked ?? record.occupied,
    ),
    ticket_id:
      record.ticket_id === null || record.ticket_id === undefined
        ? null
        : Number(record.ticket_id),
    booking_reference:
      typeof record.booking_reference === 'string' ? record.booking_reference : null,
    passenger_name: typeof record.passenger_name === 'string' ? record.passenger_name : null,
    passenger_phone_number:
      typeof record.passenger_phone_number === 'string'
        ? record.passenger_phone_number
        : null,
    passenger_gender:
      typeof record.passenger_gender === 'string' ? record.passenger_gender : null,
  }
}

function normalizeSeatStats(raw: unknown): TripSeatStats | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const total_seats = Number(record.total_seats)
  if (!Number.isFinite(total_seats)) return null

  return {
    total_seats,
    available_seats: Number(record.available_seats) || 0,
    booked_seats: Number(record.booked_seats) || 0,
    total_revenue: Number(record.total_revenue) || 0,
  }
}

function normalizeCurrentLocation(raw: unknown): CompanyTrip['current_location'] {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const latitude =
    typeof record.latitude === 'number'
      ? record.latitude
      : typeof record.lat === 'number'
        ? record.lat
        : NaN
  const longitude =
    typeof record.longitude === 'number'
      ? record.longitude
      : typeof record.lng === 'number'
        ? record.lng
        : NaN
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { latitude, longitude }
}

export function normalizeCompanyTrip(raw: unknown): CompanyTrip | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  const departure =
    typeof record.departure_time === 'string' ? record.departure_time : ''
  if (!departure) return null

  const estimated =
    typeof record.estimated_arrival_time === 'string'
      ? record.estimated_arrival_time
      : departure

  let route: CompanyTrip['route'] = null
  if (record.route && typeof record.route === 'object') {
    const r = record.route as Record<string, unknown>
    const routeId = typeof r.id === 'number' ? r.id : Number(r.id)
    const { name_en, name_ar, name } = pickRouteNameFields(r)
    if (Number.isFinite(routeId) && (name_en || name)) {
      const polylineRaw = r.route_polyline ?? r.polyline ?? r.encoded_polyline
      const distanceRaw = r.route_distance_meters ?? r.distance_meters
      const durationRaw = r.route_duration_seconds ?? r.duration_seconds

      const route_polyline =
        typeof polylineRaw === 'string' && polylineRaw.trim()
          ? polylineRaw.trim()
          : null
      const route_distance_meters =
        typeof distanceRaw === 'number'
          ? distanceRaw
          : typeof distanceRaw === 'string'
            ? Number(distanceRaw)
            : null
      const route_duration_seconds =
        typeof durationRaw === 'number'
          ? durationRaw
          : typeof durationRaw === 'string'
            ? Number(durationRaw)
            : null

      route = {
        id: routeId,
        name: name || name_en,
        name_en: name_en || name,
        name_ar,
        route_polyline,
        route_distance_meters:
          route_distance_meters != null && Number.isFinite(route_distance_meters)
            ? route_distance_meters
            : null,
        route_duration_seconds:
          route_duration_seconds != null && Number.isFinite(route_duration_seconds)
            ? route_duration_seconds
            : null,
        rest_areas: parseRestAreasFromRecord(r) ?? [],
      }
    }
  }

  let vehicle: CompanyTrip['vehicle'] = null
  if (record.vehicle && typeof record.vehicle === 'object') {
    const v = record.vehicle as Record<string, unknown>
    const vehicleId = typeof v.id === 'number' ? v.id : Number(v.id)
    if (Number.isFinite(vehicleId)) {
      vehicle = {
        id: vehicleId,
        plate_number:
          typeof v.plate_number === 'string' ? v.plate_number : String(vehicleId),
        name: typeof v.name === 'string' ? v.name : 'Bus',
        image_url: typeof v.image_url === 'string' ? v.image_url : null,
      }
    }
  }

  let driver: CompanyTrip['driver'] = null
  if (record.driver && typeof record.driver === 'object') {
    const d = record.driver as Record<string, unknown>
    const driverId = typeof d.id === 'number' ? d.id : Number(d.id)
    const driverName = typeof d.name === 'string' ? d.name : ''
    if (Number.isFinite(driverId) && driverName) {
      driver = {
        id: driverId,
        name: driverName,
        avatar_url: typeof d.avatar_url === 'string' ? d.avatar_url : null,
      }
    }
  }

  return {
    id,
    status: normalizeStatus(record.status),
    resolution_status: normalizeResolutionStatus(record.resolution_status),
    flagged: normalizeFlagged(record.flagged ?? record.is_flagged),
    departure_time: departure,
    estimated_arrival_time: estimated,
    base_fare: Number(record.base_fare) || 0,
    available_seats: Number(record.available_seats) || 0,
    route_id: Number(record.route_id) || route?.id || 0,
    vehicle_id: Number(record.vehicle_id) || vehicle?.id || 0,
    driver_id: Number(record.driver_id) || driver?.id || 0,
    origin_station_id: Number(record.origin_station_id) || undefined,
    destination_station_id: Number(record.destination_station_id) || undefined,
    origin_city_id: Number(record.origin_city_id) || undefined,
    destination_city_id: Number(record.destination_city_id) || undefined,
    origin_city: normalizeCityRef(record.origin_city),
    destination_city: normalizeCityRef(record.destination_city),
    origin_station: normalizeStationRef(record.origin_station),
    destination_station: normalizeStationRef(record.destination_station),
    route,
    vehicle,
    driver,
    vehicle_layout: normalizeVehicleLayout(record.vehicle_layout),
    seat_map: Array.isArray(record.seat_map)
      ? record.seat_map
          .map(normalizeSeatMapEntry)
          .filter((item): item is TripSeatMapEntry => item !== null)
      : undefined,
    stats: normalizeSeatStats(record.stats),
    current_location: normalizeCurrentLocation(record.current_location),
    last_location_updated_at:
      typeof record.last_location_updated_at === 'string'
        ? record.last_location_updated_at
        : null,
    last_speed: (() => {
      const raw = record.last_speed
      const value =
        typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : null
      return value != null && Number.isFinite(value) ? value : null
    })(),
    last_heading: (() => {
      const raw = record.last_heading
      const value =
        typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : null
      return value != null && Number.isFinite(value) ? value : null
    })(),
    created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : undefined,
  }
}

export function formatTripRouteLabel(trip: CompanyTrip, locale = 'en'): string {
  return formatRouteLabel(trip, locale)
}

export function formatTripDateTime(iso: string, locale: string): string {
  return formatScheduleDateTime(iso, locale)
}
