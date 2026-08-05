import type { CompanyTripTemplate } from '@/modules/trip-templates/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'

export const GENERATION_HORIZON_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

export type TemplateGenerationStatus =
  | 'inactive'
  | 'incomplete'
  | 'missing'
  | 'mismatch'
  | 'partial'
  | 'ok'

export type TemplateGenerationCheck = {
  matched: number
  expected: number
  /** Upcoming trips on the same route, regardless of slot time/day. */
  sameRouteUpcoming: number
  /** Upcoming trips across all routes — zero means nothing is generating. */
  totalUpcoming: number
  horizonDays: number
  status: TemplateGenerationStatus
}

function slotTimeKey(time: string): string {
  return time.trim().slice(0, 5)
}

/**
 * Departure times are Syria wall-clock stored with a Z suffix, so weekday and
 * time must be read in UTC to match what the schedule form and lists show.
 */
function tripSlotKey(departureMs: number): { time: string; weekday: number } {
  const date = new Date(departureMs)
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return { time: `${hours}:${minutes}`, weekday: date.getUTCDay() }
}

function startOfNextUtcDay(nowMs: number): number {
  const now = new Date(nowMs)
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + DAY_MS
}

/**
 * Compares a schedule template against trips the API already returns, so the
 * dashboard can tell whether backend generation is actually running.
 * Only whole upcoming days are counted to avoid partial-day false alarms.
 */
export function checkTemplateGeneration(
  template: CompanyTripTemplate,
  trips: CompanyTrip[],
  nowMs = Date.now(),
  horizonDays = GENERATION_HORIZON_DAYS,
): TemplateGenerationCheck {
  const slotTimes = new Set(
    template.schedule.map((slot) => slotTimeKey(slot.time)).filter(Boolean),
  )
  const days = new Set(template.daysOfWeek)

  const windowStart = startOfNextUtcDay(nowMs)
  const windowEnd = windowStart + horizonDays * DAY_MS

  let expected = 0
  for (let offset = 0; offset < horizonDays; offset += 1) {
    const weekday = new Date(windowStart + offset * DAY_MS).getUTCDay()
    if (days.has(weekday)) expected += slotTimes.size
  }

  let matched = 0
  let sameRouteUpcoming = 0
  let totalUpcoming = 0

  for (const trip of trips) {
    if (trip.status === 'cancelled') continue

    const departureMs = Date.parse(trip.departure_time)
    if (!Number.isFinite(departureMs)) continue
    if (departureMs < windowStart || departureMs >= windowEnd) continue

    totalUpcoming += 1
    if (trip.route_id !== template.routeId) continue
    sameRouteUpcoming += 1

    const { time, weekday } = tripSlotKey(departureMs)
    if (!days.has(weekday)) continue
    if (!slotTimes.has(time)) continue

    matched += 1
  }

  let status: TemplateGenerationStatus
  if (!template.isActive) status = 'inactive'
  else if (expected === 0) status = 'incomplete'
  else if (matched >= expected) status = 'ok'
  else if (matched > 0) status = 'partial'
  else if (sameRouteUpcoming > 0) status = 'mismatch'
  else status = 'missing'

  return {
    matched,
    expected,
    sameRouteUpcoming,
    totalUpcoming,
    horizonDays,
    status,
  }
}
