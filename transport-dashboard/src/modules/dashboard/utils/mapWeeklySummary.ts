import type {
  WeeklyAiSummary,
  WeeklyBusiestDay,
  WeeklyChangeMetric,
  WeeklyComplaint,
  WeeklyNoShows,
  WeeklyOccupancy,
  WeeklyOnTime,
  WeeklyPeakHour,
  WeeklyTopRoute,
  WeeklyTrips,
  WeeklyWorstRoute,
} from '@/modules/dashboard/types/weeklySummary'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function looksLikeWeekly(record: Record<string, unknown>): boolean {
  return (
    'metrics' in record ||
    'summary_ar' in record ||
    'ai_generated' in record ||
    'period' in record ||
    'highlights' in record
  )
}

function unwrapWeeklyPayload(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload)
  if (!root) return null
  if (looksLikeWeekly(root)) return root

  const data = asRecord(root.data)
  if (data && looksLikeWeekly(data)) return data

  const nested = data ? asRecord(data.data) : null
  if (nested && looksLikeWeekly(nested)) return nested

  return data ?? root
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const raw = record[key]
    if (raw == null || raw === '') continue
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''))
    if (Number.isFinite(n)) return n
  }
  return 0
}

function pickOptionalNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const raw = record[key]
    if (raw == null || raw === '') continue
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''))
    if (Number.isFinite(n)) return n
  }
  return null
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const raw = record[key]
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  }
  return ''
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      const row = asRecord(item)
      if (!row) return ''
      return pickString(row, 'text', 'message', 'alert', 'body', 'title')
    })
    .filter(Boolean)
}

function mapChangeMetric(value: unknown): WeeklyChangeMetric | null {
  const row = asRecord(value)
  if (!row) return null
  const thisWeek = pickOptionalNumber(row, 'this_week', 'thisWeek')
  const lastWeek = pickOptionalNumber(row, 'last_week', 'lastWeek')
  const changePct = pickOptionalNumber(row, 'change_pct', 'changePct')
  if (thisWeek == null && lastWeek == null && changePct == null) return null
  return {
    thisWeek: thisWeek ?? 0,
    lastWeek: lastWeek ?? 0,
    changePct: changePct ?? 0,
  }
}

function mapTopRoutes(value: unknown): WeeklyTopRoute[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const row = asRecord(item)
      if (!row) return null
      const routeName = pickString(row, 'route_name', 'routeName', 'name')
      if (!routeName) return null
      return {
        routeName,
        bookings: pickNumber(row, 'bookings'),
        revenue: pickNumber(row, 'revenue'),
        sharePct: pickNumber(row, 'share_pct', 'sharePct'),
      } satisfies WeeklyTopRoute
    })
    .filter((item): item is WeeklyTopRoute => item !== null)
}

function mapWorstRoutes(value: unknown): WeeklyWorstRoute[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const row = asRecord(item)
      if (!row) return null
      const routeName = pickString(row, 'route_name', 'routeName', 'name')
      if (!routeName) return null
      return {
        routeName,
        trips: pickNumber(row, 'trips'),
        seatsSold: pickNumber(row, 'seats_sold', 'seatsSold'),
        capacity: pickNumber(row, 'capacity'),
        loadFactorPct: pickNumber(row, 'load_factor_pct', 'loadFactorPct'),
      } satisfies WeeklyWorstRoute
    })
    .filter((item): item is WeeklyWorstRoute => item !== null)
}

function mapPeakHours(value: unknown): WeeklyPeakHour[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const row = asRecord(item)
      if (!row) return null
      const hour = pickString(row, 'hour')
      if (!hour) return null
      return {
        hour,
        seats: pickNumber(row, 'seats'),
      } satisfies WeeklyPeakHour
    })
    .filter((item): item is WeeklyPeakHour => item !== null)
}

function mapBusiestDay(value: unknown): WeeklyBusiestDay | null {
  const row = asRecord(value)
  if (!row) return null
  const date = pickString(row, 'date')
  const weekday = pickString(row, 'weekday')
  const seats = pickOptionalNumber(row, 'seats')
  if (!date && !weekday && seats == null) return null
  return {
    date,
    weekday,
    seats: seats ?? 0,
  }
}

function mapNoShows(value: unknown): WeeklyNoShows | null {
  const row = asRecord(value)
  if (!row) return null
  return {
    count: pickNumber(row, 'count'),
    rate: pickOptionalNumber(row, 'rate'),
    ratePct: pickOptionalNumber(row, 'rate_pct', 'ratePct'),
    lostRevenue: pickNumber(row, 'lost_revenue', 'lostRevenue'),
  }
}

function mapTrips(value: unknown): WeeklyTrips | null {
  const row = asRecord(value)
  if (!row) return null
  return {
    completed: pickNumber(row, 'completed'),
    cancelled: pickNumber(row, 'cancelled'),
    total: pickNumber(row, 'total'),
    cancellationRatePct: pickNumber(row, 'cancellation_rate_pct', 'cancellationRatePct'),
  }
}

function mapOccupancy(value: unknown): WeeklyOccupancy | null {
  const row = asRecord(value)
  if (!row) return null
  const tripsMeasured = pickOptionalNumber(row, 'trips_measured', 'tripsMeasured')
  if (tripsMeasured === 0) return null
  return {
    avgLoadFactorPct: pickNumber(row, 'avg_load_factor_pct', 'avgLoadFactorPct'),
    seatsSold: pickNumber(row, 'seats_sold', 'seatsSold'),
    seatsCapacity: pickNumber(row, 'seats_capacity', 'seatsCapacity'),
    tripsMeasured: tripsMeasured ?? 0,
  }
}

function mapOnTime(value: unknown): WeeklyOnTime | null {
  const row = asRecord(value)
  if (!row) return null
  return {
    measuredTrips: pickNumber(row, 'measured_trips', 'measuredTrips'),
    onTimePct: pickNumber(row, 'on_time_pct', 'onTimePct'),
    lateTrips: pickNumber(row, 'late_trips', 'lateTrips'),
    avgDelayMinutes: pickNumber(row, 'avg_delay_minutes', 'avgDelayMinutes'),
  }
}

function mapComplaints(value: unknown): WeeklyComplaint[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string' && item.trim()) {
        return { label: item.trim(), count: null } satisfies WeeklyComplaint
      }
      const row = asRecord(item)
      if (!row) return null
      const nested = asRecord(row.complaint_category) ?? asRecord(row.category)
      const label =
        pickString(
          row,
          'category_name',
          'name',
          'name_ar',
          'name_en',
          'label',
          'title',
          'complaint_category',
        ) ||
        (nested ? pickString(nested, 'name', 'name_ar', 'name_en', 'title') : '')
      if (!label) return null
      return {
        label,
        count: pickOptionalNumber(row, 'count', 'total'),
      } satisfies WeeklyComplaint
    })
    .filter((item): item is WeeklyComplaint => item !== null)
}

/** Normalize GET /company/dashboard/weekly-summary — display-only, no metric math. */
export function mapWeeklySummary(payload: unknown): WeeklyAiSummary | null {
  const root = unwrapWeeklyPayload(payload)
  if (!root) return null

  const period = asRecord(root.period)
  const metrics = asRecord(root.metrics) ?? {}
  const peak = asRecord(metrics.peak) ?? asRecord(root.peak)

  const summaryRaw = root.summary_ar
  const summaryAr =
    typeof summaryRaw === 'string' && summaryRaw.trim() ? summaryRaw.trim() : null

  return {
    periodStart: period ? pickString(period, 'start') : pickString(root, 'period_start'),
    periodEnd: period ? pickString(period, 'end') : pickString(root, 'period_end'),
    currency: pickString(root, 'currency') || 'SYP',
    alerts: asStringList(root.alerts),
    summaryAr,
    highlights: asStringList(root.highlights),
    aiGenerated: root.ai_generated === true || root.aiGenerated === true,
    revenue: mapChangeMetric(metrics.revenue),
    passengers: mapChangeMetric(metrics.passengers),
    topRoutes: mapTopRoutes(metrics.top_routes ?? metrics.topRoutes),
    noShows: mapNoShows(metrics.no_shows ?? metrics.noShows),
    trips: mapTrips(metrics.trips),
    occupancy: mapOccupancy(metrics.occupancy),
    worstRoutes: mapWorstRoutes(metrics.worst_routes ?? metrics.worstRoutes),
    busiestDay: mapBusiestDay(peak?.busiest_day ?? peak?.busiestDay),
    peakHours: mapPeakHours(peak?.peak_hours ?? peak?.peakHours),
    onTime: mapOnTime(metrics.on_time ?? metrics.onTime),
    topComplaints: mapComplaints(metrics.top_complaints ?? metrics.topComplaints ?? root.top_complaints),
  }
}
