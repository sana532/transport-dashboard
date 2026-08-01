import {
  BusFront,
  CircleDollarSign,
  Route,
  TrendingDown,
  TrendingUp,
  Users,
  UserX,
} from 'lucide-react'
import type {
  DashboardStatCard,
  RevenueTrendPoint,
  RoutePerformanceSlice,
} from '@/modules/dashboard/types'

const ROUTE_COLORS = ['#2F3E1F', '#3F5429', '#5B7242', '#7A8F63', '#9EAE8A', '#B8C4A8']

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

/**
 * Unwrap `{ data: T }` envelopes, but keep flat KPI payloads that already
 * expose fields like `monthly_revenue` at the root.
 */
function unwrapData(payload: unknown): unknown {
  const root = asRecord(payload)
  if (!root || !('data' in root)) return payload

  const hasKpiFields =
    'monthly_revenue' in root ||
    'daily_revenue' in root ||
    'total_active_vehicles' in root ||
    'total_monthly_passengers' in root ||
    'most_profitable_route' in root

  if (hasKpiFields) return root

  const inner = root.data
  if (inner == null) return root
  if (asRecord(inner) || Array.isArray(inner)) return inner
  return root
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
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

/** Always Latin digits so KPI values stay readable with dashboard fonts. */
function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

function formatMoney(value: number): string {
  return `${formatCount(value)} SYP`
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return `${formatCount(rounded)}%`
}

function monthKeyFromValue(raw: unknown): string | undefined {
  if (typeof raw === 'number' && raw >= 1 && raw <= 12) return MONTH_KEYS[raw - 1]
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim().toLowerCase()
  if ((MONTH_KEYS as readonly string[]).includes(trimmed)) return trimmed
  const iso = trimmed.match(/^(\d{4})-(\d{2})/)
  if (iso) {
    const month = Number(iso[2])
    if (month >= 1 && month <= 12) return MONTH_KEYS[month - 1]
  }
  const short = trimmed.slice(0, 3)
  if ((MONTH_KEYS as readonly string[]).includes(short)) return short
  return undefined
}

function pushCard(
  cards: DashboardStatCard[],
  card: Omit<DashboardStatCard, 'trendTone'> & { trendTone?: DashboardStatCard['trendTone'] },
) {
  cards.push({
    trendTone: 'neutral',
    ...card,
  })
}

/** Normalize GET /company/dashboard/kpis */
export function mapDashboardKpis(payload: unknown, _locale: string): DashboardStatCard[] {
  const record = asRecord(unwrapData(payload)) ?? asRecord(payload)
  if (!record) return []

  const cards: DashboardStatCard[] = []

  const monthlyRevenue = pickNumber(
    record,
    'monthly_revenue',
    'revenue_monthly',
    'revenue_this_month',
    'total_revenue',
  )
  if (monthlyRevenue != null) {
    pushCard(cards, {
      id: 'monthly-revenue',
      titleKey: 'dashboard.stats.monthlyRevenue.title',
      value: formatMoney(monthlyRevenue),
      Icon: CircleDollarSign,
    })
  }

  const passengers = pickNumber(
    record,
    'total_monthly_passengers',
    'monthly_passengers',
    'passengers_monthly',
    'passengers_count',
    'total_passengers',
    'passengers',
  )
  if (passengers != null) {
    pushCard(cards, {
      id: 'monthly-passengers',
      titleKey: 'dashboard.stats.monthlyPassengers.title',
      value: formatCount(passengers),
      Icon: Users,
    })
  }

  const dailyRevenue = pickNumber(
    record,
    'daily_revenue',
    'revenue_today',
    'today_revenue',
    'revenue_daily',
  )
  if (dailyRevenue != null) {
    pushCard(cards, {
      id: 'daily-revenue',
      titleKey: 'dashboard.stats.dailyRevenue.title',
      value: formatMoney(dailyRevenue),
      Icon: TrendingUp,
    })
  }

  const topRouteNested =
    asRecord(record.most_profitable_route) ??
    asRecord(record.top_route) ??
    asRecord(record.best_route)

  if (topRouteNested) {
    const routeName = pickString(
      topRouteNested,
      'route_name',
      'name',
      'name_en',
      'name_ar',
      'code',
      'label',
      'title',
    )
    const routeRevenue = pickNumber(
      topRouteNested,
      'monthly_revenue',
      'revenue',
      'total_revenue',
    )
    if (routeName) {
      pushCard(cards, {
        id: 'top-route',
        titleKey: 'dashboard.stats.topRoute.title',
        value: routeName,
        trendLabel: routeRevenue != null ? formatMoney(routeRevenue) : undefined,
        Icon: Route,
      })
    }
  } else {
    const routeName = pickString(
      record,
      'top_route_name',
      'most_profitable_route_name',
      'top_route',
    )
    if (routeName) {
      pushCard(cards, {
        id: 'top-route',
        titleKey: 'dashboard.stats.topRoute.title',
        value: routeName,
        Icon: Route,
      })
    }
  }

  const vehicles = pickNumber(
    record,
    'total_active_vehicles',
    'active_vehicles',
    'buses_count',
    'vehicles_count',
    'total_buses',
    'total_vehicles',
    'fleet_size',
    'buses',
    'vehicles',
  )
  if (vehicles != null) {
    pushCard(cards, {
      id: 'buses',
      titleKey: 'dashboard.stats.buses.title',
      value: formatCount(vehicles),
      Icon: BusFront,
    })
  }

  const noShowRate = pickNumber(record, 'no_show_rate', 'noshow_rate', 'no_shows_rate')
  if (noShowRate != null) {
    pushCard(cards, {
      id: 'no-show-rate',
      titleKey: 'dashboard.stats.noShowRate.title',
      value: formatPercent(noShowRate),
      Icon: UserX,
    })
  }

  const lostRevenue = pickNumber(
    record,
    'lost_revenue_from_no_shows',
    'lost_revenue_no_shows',
    'no_show_lost_revenue',
  )
  if (lostRevenue != null) {
    pushCard(cards, {
      id: 'lost-revenue-no-shows',
      titleKey: 'dashboard.stats.lostRevenueNoShows.title',
      value: formatMoney(lostRevenue),
      Icon: TrendingDown,
    })
  }

  return cards
}

/** Normalize GET /company/dashboard/charts/revenue-trend */
export function mapRevenueTrend(payload: unknown): RevenueTrendPoint[] {
  const data = unwrapData(payload)
  const list = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)?.points)
      ? (asRecord(data)!.points as unknown[])
      : Array.isArray(asRecord(data)?.series)
        ? (asRecord(data)!.series as unknown[])
        : Array.isArray(asRecord(payload)?.data)
          ? (asRecord(payload)!.data as unknown[])
          : []

  const points: RevenueTrendPoint[] = []
  list.forEach((item, index) => {
    const row = asRecord(item)
    if (!row) return
    const revenue = pickNumber(row, 'revenue', 'amount', 'value', 'total', 'total_revenue')
    if (revenue == null) return
    const monthKey = monthKeyFromValue(
      row.month_key ?? row.monthKey ?? row.month ?? row.period ?? row.label ?? row.date,
    )
    const label = pickString(row, 'label', 'month_label', 'name', 'period_label')
    points.push({
      id: `rev-${index}`,
      monthKey: monthKey ?? (label ? undefined : MONTH_KEYS[index % 12]),
      label: label || undefined,
      revenue,
    })
  })
  return points
}

/** Normalize GET /company/dashboard/charts/route-performance */
export function mapRoutePerformance(payload: unknown): RoutePerformanceSlice[] {
  const data = unwrapData(payload)
  const list = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)?.routes)
      ? (asRecord(data)!.routes as unknown[])
      : Array.isArray(asRecord(data)?.items)
        ? (asRecord(data)!.items as unknown[])
        : Array.isArray(asRecord(payload)?.data)
          ? (asRecord(payload)!.data as unknown[])
          : []

  const rows = list
    .map((item, index) => {
      const row = asRecord(item)
      if (!row) return null
      const name = pickString(
        row,
        'name',
        'route_name',
        'route',
        'label',
        'code',
        'name_en',
        'name_ar',
      )
      const value =
        pickNumber(row, 'percentage', 'percent', 'share', 'value', 'ratio') ??
        pickNumber(row, 'revenue', 'amount', 'total')
      if (value == null) return null
      return {
        id: pickString(row, 'id', 'route_id') || `route-${index}`,
        name: name || `Route ${index + 1}`,
        value,
        color: ROUTE_COLORS[index % ROUTE_COLORS.length],
      } satisfies RoutePerformanceSlice
    })
    .filter((item): item is RoutePerformanceSlice => item !== null)

  const looksLikePercent = rows.every((row) => row.value <= 100)
  if (looksLikePercent || rows.length === 0) return rows

  const total = rows.reduce((sum, row) => sum + row.value, 0)
  if (total <= 0) return rows
  return rows.map((row) => ({
    ...row,
    value: Math.round((row.value / total) * 1000) / 10,
  }))
}
