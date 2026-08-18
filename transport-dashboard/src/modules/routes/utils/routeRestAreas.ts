import type { RouteRestAreaInput, RouteRestAreaStop, RestArea } from '@/modules/geography/types'
import { normalizeRestArea } from '@/modules/geography/utils/restAreaApi'

export type RestAreaStopFormRow = {
  rest_area_id: string
  stop_order: string
  duration_minutes: string
}

export const emptyRestAreaStopRow = (): RestAreaStopFormRow => ({
  rest_area_id: '',
  stop_order: '1',
  duration_minutes: '10',
})

function pickPivot(record: Record<string, unknown>): Record<string, unknown> | null {
  const pivot = record.pivot
  return pivot && typeof pivot === 'object' ? (pivot as Record<string, unknown>) : null
}

export function normalizeRouteRestAreaStop(
  raw: unknown,
  fallbackOrder = 1,
): RouteRestAreaStop | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return {
      id: raw,
      stop_order: fallbackOrder,
      duration_minutes: 10,
      rest_area: null,
    }
  }

  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const pivot = pickPivot(record)

  const nested =
    record.rest_area && typeof record.rest_area === 'object'
      ? (record.rest_area as Record<string, unknown>)
      : null

  const restAreaId = Number(record.rest_area_id ?? nested?.id)
  const id = Number.isFinite(restAreaId) ? restAreaId : Number(record.id)

  const stop_order = Number(
    record.stop_order ?? pivot?.stop_order ?? fallbackOrder,
  )
  const duration_minutes = Number(
    record.duration_minutes ?? pivot?.duration_minutes ?? 10,
  )

  if (!Number.isFinite(id)) return null

  const rest_area = nested
    ? normalizeRestArea(nested)
    : normalizeRestArea(record)

  return {
    id,
    stop_order: Number.isFinite(stop_order) ? stop_order : fallbackOrder,
    duration_minutes: Number.isFinite(duration_minutes) ? duration_minutes : 10,
    rest_area,
  }
}

/** Parses rest_areas / restAreas / route_rest_areas from API list or show payloads. */
export function parseRestAreasFromRecord(record: Record<string, unknown>): RouteRestAreaStop[] | undefined {
  const raw =
    record.rest_areas ??
    record.restAreas ??
    record.route_rest_areas ??
    record.rest_area_stops

  if (!Array.isArray(raw) || raw.length === 0) return undefined

  const stops = raw
    .map((item, index) => normalizeRouteRestAreaStop(item, index + 1))
    .filter((item): item is RouteRestAreaStop => item !== null)

  return stops.length > 0 ? stops : undefined
}

export function routeRestStopsToFormRows(stops: RouteRestAreaStop[] | undefined): RestAreaStopFormRow[] {
  if (!stops?.length) return []
  return stops.map((stop) => ({
    rest_area_id: String(stop.rest_area?.id ?? stop.id),
    stop_order: String(stop.stop_order),
    duration_minutes: String(stop.duration_minutes),
  }))
}

export function buildRestAreasPayload(rows: RestAreaStopFormRow[]): RouteRestAreaInput[] {
  const parsed: RouteRestAreaInput[] = []

  for (const row of rows) {
    const id = Number(row.rest_area_id)
    const stop_order = Number(row.stop_order)
    const duration_minutes = Number(row.duration_minutes)
    if (!Number.isFinite(id) || !Number.isFinite(stop_order) || !Number.isFinite(duration_minutes)) {
      continue
    }
    if (duration_minutes < 0) continue
    parsed.push({ id, stop_order, duration_minutes })
  }

  return parsed.sort((a, b) => a.stop_order - b.stop_order)
}

export function restAreaLabelForStop(stop: RouteRestAreaStop, catalog: RestArea[]): string {
  if (stop.rest_area?.name) return stop.rest_area.name
  const found = catalog.find((a) => a.id === stop.id)
  return found?.name ?? `#${stop.id}`
}
