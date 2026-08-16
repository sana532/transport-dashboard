import { api } from '@/services/api'
import type {
  CompanyLookups,
  CompanyLookupsQuery,
  LookupCity,
  LookupDriver,
  LookupRoute,
  LookupStation,
  LookupVehicle,
} from '@/modules/lookups/types'
import { routesService } from '@/modules/routes/services/routesService'
import { driversService } from '@/modules/drivers/services/driversService'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function pickId(record: Record<string, unknown>): number | null {
  const raw = record.id
  const id = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(id) ? id : null
}

function pickName(record: Record<string, unknown>): string {
  const nameEn = typeof record.name_en === 'string' ? record.name_en.trim() : ''
  const nameAr = typeof record.name_ar === 'string' ? record.name_ar.trim() : ''
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  return name || nameEn || nameAr
}

function normalizeRoute(raw: unknown): LookupRoute | null {
  const record = asRecord(raw)
  if (!record) return null
  const nested = asRecord(record.route)
  const id =
    pickId(record) ??
    (nested ? pickId(nested) : null) ??
    (record.route_id != null && Number.isFinite(Number(record.route_id))
      ? Number(record.route_id)
      : null)
  const name = pickName(record) || (nested ? pickName(nested) : '')
  if (id == null || !name) return null
  return {
    id,
    name,
    name_en:
      typeof record.name_en === 'string'
        ? record.name_en
        : nested && typeof nested.name_en === 'string'
          ? nested.name_en
          : undefined,
    name_ar:
      typeof record.name_ar === 'string'
        ? record.name_ar
        : nested && typeof nested.name_ar === 'string'
          ? nested.name_ar
          : undefined,
  }
}

function normalizeDriver(raw: unknown): LookupDriver | null {
  const record = asRecord(raw)
  if (!record) return null
  const id = pickId(record)
  const nestedUser = asRecord(record.user)
  const name =
    pickName(record) ||
    (nestedUser ? pickName(nestedUser) : '') ||
    (typeof record.full_name === 'string' ? record.full_name.trim() : '')
  if (id == null || !name) return null
  return { id, name }
}

function normalizeVehicle(raw: unknown): LookupVehicle | null {
  const record = asRecord(raw)
  if (!record) return null
  const id = pickId(record)
  if (id == null) return null
  const plate =
    typeof record.plate_number === 'string'
      ? record.plate_number
      : typeof record.plateNumber === 'string'
        ? record.plateNumber
        : null
  const name = pickName(record) || plate || `Vehicle #${id}`
  return { id, name, plate_number: plate }
}

function normalizeCity(raw: unknown): LookupCity | null {
  const record = asRecord(raw)
  if (!record) return null
  const id = pickId(record)
  const name = pickName(record)
  if (id == null || !name) return null
  return { id, name }
}

function normalizeStation(raw: unknown): LookupStation | null {
  const record = asRecord(raw)
  if (!record) return null
  const id = pickId(record)
  const name = pickName(record)
  if (id == null || !name) return null
  const cityIdRaw = record.city_id
  const city_id =
    typeof cityIdRaw === 'number'
      ? cityIdRaw
      : cityIdRaw != null && Number.isFinite(Number(cityIdRaw))
        ? Number(cityIdRaw)
        : undefined
  return { id, name, city_id }
}

function readBucket(payload: unknown, keys: string[]): unknown[] {
  const root = asRecord(payload)
  if (!root) return []

  const candidates = [root, asRecord(root.data), asRecord(asRecord(root.data)?.data)].filter(
    (item): item is Record<string, unknown> => item != null,
  )

  for (const data of candidates) {
    for (const key of keys) {
      const value = data[key]
      if (Array.isArray(value)) return value
    }
    // Nested under data.lookups.*
    const lookups = asRecord(data.lookups)
    if (lookups) {
      for (const key of keys) {
        const value = lookups[key]
        if (Array.isArray(value)) return value
      }
    }
  }

  return []
}

function parseList<T>(
  payload: unknown,
  keys: string[],
  normalize: (raw: unknown) => T | null,
): T[] {
  // Only read the named bucket — never fall back to collectApiListItems,
  // which mixes routes/drivers/cities from the same lookups payload.
  const bucket = readBucket(payload, keys)
  return bucket.map(normalize).filter((item): item is T => item !== null)
}

function buildLookupsParams(query: CompanyLookupsQuery): Record<string, string | number | boolean> {
  // Match backend flag style: ?routes&drivers&vehicles
  const params: Record<string, string | number | boolean> = {}
  if (query.routes) params.routes = true
  if (query.drivers) params.drivers = true
  if (query.vehicles) params.vehicles = true
  if (query.cities) params.cities = true
  if (query.stations) params.stations = true
  return params
}

const emptyLookups = (): CompanyLookups => ({
  routes: [],
  drivers: [],
  vehicles: [],
  cities: [],
  stations: [],
})

async function fallbackRoutes(): Promise<LookupRoute[]> {
  try {
    const routes = await routesService.listRoutes()
    return routes.map((route) => ({
      id: route.id,
      name: route.name_en || route.name || route.name_ar || `Route #${route.id}`,
      name_en: route.name_en,
      name_ar: route.name_ar,
    }))
  } catch {
    return []
  }
}

async function fallbackDrivers(): Promise<LookupDriver[]> {
  try {
    const drivers = await driversService.listDrivers()
    return drivers
      .map((driver) => {
        const id = Number(driver.id)
        const name = driver.name?.trim() || `Driver #${driver.id}`
        if (!Number.isFinite(id) || !name) return null
        return { id, name }
      })
      .filter((item): item is LookupDriver => item != null)
  } catch {
    return []
  }
}

async function fallbackVehicles(): Promise<LookupVehicle[]> {
  try {
    const vehicles = await vehiclesService.listVehicles()
    const result: LookupVehicle[] = []
    for (const vehicle of vehicles) {
      const id = Number(vehicle.id)
      if (!Number.isFinite(id)) continue
      const plate =
        typeof vehicle.plate_number === 'string' ? vehicle.plate_number : null
      result.push({
        id,
        name: plate || vehicle.vehicle_model?.name || `Vehicle #${id}`,
        plate_number: plate,
      })
    }
    return result
  } catch {
    return []
  }
}

export const companyLookupsService = {
  async getLookups(query: CompanyLookupsQuery = {}): Promise<CompanyLookups> {
    const requested =
      query.routes || query.drivers || query.vehicles || query.cities || query.stations
        ? query
        : {
            routes: true,
            drivers: true,
            vehicles: true,
            cities: true,
            stations: true,
          }

    let routes: LookupRoute[] = []
    let drivers: LookupDriver[] = []
    let vehicles: LookupVehicle[] = []
    let cities: LookupCity[] = []
    let stations: LookupStation[] = []

    try {
      const { data } = await api.get<unknown>('/company/lookups', {
        params: buildLookupsParams(requested),
      })

      routes = requested.routes
        ? parseList(data, ['routes', 'Routes'], normalizeRoute)
        : []
      drivers = requested.drivers
        ? parseList(data, ['drivers', 'Drivers'], normalizeDriver)
        : []
      vehicles = requested.vehicles
        ? parseList(data, ['vehicles', 'Vehicles'], normalizeVehicle)
        : []
      cities = requested.cities
        ? parseList(data, ['cities', 'Cities'], normalizeCity)
        : []
      stations = requested.stations
        ? parseList(data, ['stations', 'Stations'], normalizeStation)
        : []
    } catch {
      // Fall through to dedicated list endpoints below.
    }

    if (requested.routes && routes.length === 0) routes = await fallbackRoutes()
    if (requested.drivers && drivers.length === 0) drivers = await fallbackDrivers()
    if (requested.vehicles && vehicles.length === 0) {
      vehicles = await fallbackVehicles()
    }

    return { routes, drivers, vehicles, cities, stations }
  },

  empty: emptyLookups,
}
