import { api } from '@/services/api'
import type { CompanyRoute, RouteFormInput } from '@/modules/routes/types'
import { pickRouteNameFields } from '@/modules/routes/utils/routeDisplay'
import { parseRestAreasFromRecord } from '@/modules/routes/utils/routeRestAreas'
import type { Station } from '@/modules/geography/types'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

function normalizeStationRef(raw: unknown): Station | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const name = typeof record.name === 'string' ? record.name : ''
  if (!Number.isFinite(id) || !name) return null
  const cityId = typeof record.city_id === 'number' ? record.city_id : Number(record.city_id)
  let city: Station['city'] = null
  if (record.city && typeof record.city === 'object') {
    const c = record.city as Record<string, unknown>
    if (typeof c.id === 'number' && typeof c.name === 'string') {
      city = { id: c.id, name: c.name }
    }
  }
  return { id, name, city_id: cityId, city }
}

function normalizeCityRef(raw: unknown): { id: number; name: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (typeof record.id === 'number' && typeof record.name === 'string') {
    return { id: record.id, name: record.name }
  }
  return null
}

export function normalizeCompanyRoute(raw: unknown): CompanyRoute | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const { name_en, name_ar, name } = pickRouteNameFields(record)
  if (!Number.isFinite(id) || !name_en) return null

  const rest_areas = parseRestAreasFromRecord(record)

  const baseFareRaw = record.base_fare
  const base_fare =
    typeof baseFareRaw === 'number' && Number.isFinite(baseFareRaw)
      ? baseFareRaw
      : baseFareRaw != null && Number.isFinite(Number(baseFareRaw))
        ? Number(baseFareRaw)
        : undefined

  const estimated_duration_hhmm =
    typeof record.estimated_duration_hhmm === 'string' && record.estimated_duration_hhmm.trim()
      ? record.estimated_duration_hhmm.trim()
      : undefined

  return {
    id,
    company_id: Number(record.company_id) || 0,
    name,
    name_en,
    name_ar,
    origin_station_id: Number(record.origin_station_id) || 0,
    destination_station_id: Number(record.destination_station_id) || 0,
    origin_city_id: Number(record.origin_city_id) || undefined,
    destination_city_id: Number(record.destination_city_id) || undefined,
    estimated_duration_hhmm,
    base_fare,
    rest_areas,
    origin_station: normalizeStationRef(record.origin_station),
    destination_station: normalizeStationRef(record.destination_station),
    origin_city: normalizeCityRef(record.origin_city),
    destination_city: normalizeCityRef(record.destination_city),
    created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : undefined,
  }
}

function unwrapList(payload: unknown): CompanyRoute[] {
  const fromArray = (items: unknown[]) =>
    items.map(normalizeCompanyRoute).filter((item): item is CompanyRoute => item !== null)

  if (Array.isArray(payload)) return fromArray(payload)
  if (!payload || typeof payload !== 'object') return []

  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) return fromArray(root.data)
  if (root.data && typeof root.data === 'object') {
    const nested = root.data as Record<string, unknown>
    if (Array.isArray(nested.data)) return fromArray(nested.data)
    const single = normalizeCompanyRoute(nested)
    if (single) return [single]
  }

  const single = normalizeCompanyRoute(root)
  return single ? [single] : []
}

function unwrapOne(payload: unknown): CompanyRoute | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeCompanyRoute(root.data)
  return normalizeCompanyRoute(root)
}

async function fetchRouteById(id: number): Promise<CompanyRoute | null> {
  try {
    const { data } = await api.get<unknown>(`/company/routes/${id}`)
    return unwrapOne(data)
  } catch {
    return null
  }
}

async function enrichRoutesWithRestAreas(routes: CompanyRoute[]): Promise<CompanyRoute[]> {
  const missing = routes.filter((route) => !route.rest_areas?.length)
  if (missing.length === 0) return routes

  const details = await Promise.all(
    missing.map(async (route) => {
      const detail = await fetchRouteById(route.id)
      return { id: route.id, rest_areas: detail?.rest_areas }
    }),
  )

  const byId = new Map(details.map((d) => [d.id, d.rest_areas]))

  return routes.map((route) => {
    const rest_areas = byId.get(route.id)
    if (rest_areas?.length) return { ...route, rest_areas }
    return route
  })
}

export const routesService = {
  async listRoutes(): Promise<CompanyRoute[]> {
    try {
      const { data } = await api.get<unknown>('/company/routes')
      const routes = unwrapList(data)
      return enrichRoutesWithRestAreas(routes)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load routes'))
    }
  },

  async getRoute(id: number): Promise<CompanyRoute> {
    try {
      const { data } = await api.get<unknown>(`/company/routes/${id}`)
      const route = unwrapOne(data)
      if (!route) throw new Error('Route not found')
      return route
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load route'))
    }
  },

  async createRoute(input: RouteFormInput): Promise<CompanyRoute> {
    try {
      const { data } = await api.post<unknown>('/company/routes', input)
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating route')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create route'))
    }
  },

  async updateRoute(id: number, input: RouteFormInput): Promise<CompanyRoute> {
    try {
      const { data } = await api.patch<unknown>(`/company/routes/${id}`, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating route')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update route'))
    }
  },

  async deleteRoute(id: number): Promise<void> {
    try {
      await api.delete(`/company/routes/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete route'))
    }
  },
}
