import type {
  CompanyTripTemplate,
  TripTemplateInput,
  TripTemplateScheduleSlot,
} from '@/modules/trip-templates/types'

function parseNumber(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : null
}

function parseDaysOfWeek(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((d) => (typeof d === 'number' ? d : Number(d)))
    .filter((d) => Number.isFinite(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b)
}

function parseSchedule(raw: unknown): TripTemplateScheduleSlot[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const time = typeof row.time === 'string' ? row.time.trim() : ''
      const vehicleId = parseNumber(row.vehicle_id)
      if (!time || vehicleId == null) return null
      const driverRaw = row.driver_id
      const driverId =
        driverRaw == null || driverRaw === ''
          ? null
          : parseNumber(driverRaw)
      return { time, vehicleId, driverId }
    })
    .filter((slot): slot is TripTemplateScheduleSlot => slot !== null)
}

export function normalizeCompanyTripTemplate(raw: unknown): CompanyTripTemplate | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = parseNumber(record.id)
  if (id == null) return null

  const name = typeof record.name === 'string' ? record.name.trim() : ''
  const routeId = parseNumber(record.route_id)
  if (!name || routeId == null) return null

  let routeName: string | null = null
  if (record.route && typeof record.route === 'object') {
    const route = record.route as Record<string, unknown>
    routeName = typeof route.name === 'string' ? route.name.trim() : null
  }

  return {
    id,
    companyId: parseNumber(record.company_id) ?? 0,
    routeId,
    name,
    daysOfWeek: parseDaysOfWeek(record.days_of_week),
    schedule: parseSchedule(record.schedule),
    basePrice: parseNumber(record.base_price),
    isActive: record.is_active !== false && record.is_active !== 0 && record.is_active !== '0',
    routeName,
    createdAt: typeof record.created_at === 'string' ? record.created_at : '',
    updatedAt: typeof record.updated_at === 'string' ? record.updated_at : '',
  }
}

export function tripTemplateToInput(template: CompanyTripTemplate): TripTemplateInput {
  const input: TripTemplateInput = {
    route_id: template.routeId,
    name: template.name,
    days_of_week: template.daysOfWeek,
    schedule: template.schedule.map((slot) => ({
      time: slot.time,
      vehicle_id: slot.vehicleId,
      driver_id: slot.driverId,
    })),
    is_active: template.isActive,
  }
  if (template.basePrice != null) {
    input.base_price = template.basePrice
  }
  return input
}

export function formatDaysOfWeekLabel(
  days: number[],
  t: (key: string) => string,
): string {
  const unique = [...new Set(days)].sort((a, b) => a - b)
  if (unique.length === 0) return '—'
  if (unique.length === 7) return t('tripTemplates.daysEveryday')
  return unique.map((d) => t(`tripTemplates.day.${d}`)).join(t('tripTemplates.daySeparator'))
}
