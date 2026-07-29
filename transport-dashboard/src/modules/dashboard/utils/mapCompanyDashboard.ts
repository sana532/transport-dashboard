import {
  BusFront,
  CircleDollarSign,
  Route,
  TrendingUp,
  Users,
  type LucideIcon,
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

function unwrapData(payload: unknown): unknown {
  const root = asRecord(payload)
  if (!root) return payload
  if ('data' in root) return root.data
  return payload
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const raw = record[key]
    if (raw == null || raw === '') continue
    const n = typeof raw === 'number' ? raw : Number(raw)
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

function formatCount(value: number, locale: string): string {
  return value.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')
}

function formatMoney(value: number, locale: string): string {
  return `${formatCount(value, locale)} SYP`
}

function formatTrendPercent(value: number | null): string | undefined {
  if (value == null || !Number.isFinite(value)) return undefined
  const rounded = Math.round(value * 10) / 10
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded}%`
}

function resolveTrend(
  record: Record<string, unknown>,
  prefixes: string[],
): { label?: string; tone: DashboardStatCard['trendTone'] } {
  for (const prefix of prefixes) {
    const percent = pickNumber(
      record,
      `${prefix}_change_percent`,
      `${prefix}_growth_percent`,
      `${prefix}_trend_percent`,
      `${prefix}_change`,
      `${prefix}_growth`,
      `${prefix}_trend`,
    )
    if (percent != null) {
      return {
        label: formatTrendPercent(percent),
        tone: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral',
      }
    }
    const text = pickString(record, `${prefix}_trend_label`, `${prefix}_note`)
    if (text) return { label: text, tone: 'neutral' }
  }
  return { tone: 'neutral' }
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

type KpiDef = {
  id: string
  titleKey: string
  Icon: LucideIcon
  valueKeys: string[]
  format: 'count' | 'money' | 'text'
  trendPrefixes: string[]
  nestedKeys?: string[]
}

const KPI_DEFS: KpiDef[] = [
  {
    id: 'monthly-passengers',
    titleKey: 'dashboard.stats.monthlyPassengers.title',
    Icon: Users,
    valueKeys: [
      'monthly_passengers',
      'passengers_monthly',
      'passengers_count',
      'total_passengers',
      'passengers',
    ],
    format: 'count',
    trendPrefixes: ['monthly_passengers', 'passengers'],
  },
  {
    id: 'monthly-revenue',
    titleKey: 'dashboard.stats.monthlyRevenue.title',
    Icon: CircleDollarSign,
    valueKeys: ['monthly_revenue', 'revenue_monthly', 'revenue_this_month', 'total_revenue'],
    format: 'money',
    trendPrefixes: ['monthly_revenue', 'revenue'],
  },
  {
    id: 'daily-revenue',
    titleKey: 'dashboard.stats.dailyRevenue.title',
    Icon: TrendingUp,
    valueKeys: ['daily_revenue', 'revenue_today', 'today_revenue', 'revenue_daily'],
    format: 'money',
    trendPrefixes: ['daily_revenue', 'today_revenue'],
  },
  {
    id: 'top-route',
    titleKey: 'dashboard.stats.topRoute.title',
    Icon: Route,
    valueKeys: ['top_route', 'most_profitable_route', 'best_route', 'top_route_name'],
    format: 'text',
    trendPrefixes: ['top_route'],
    nestedKeys: ['top_route', 'most_profitable_route', 'best_route'],
  },
  {
    id: 'buses',
    titleKey: 'dashboard.stats.buses.title',
    Icon: BusFront,
    valueKeys: [
      'buses_count',
      'vehicles_count',
      'total_buses',
      'total_vehicles',
      'fleet_size',
      'buses',
      'vehicles',
    ],
    format: 'count',
    trendPrefixes: ['buses', 'vehicles', 'fleet'],
    nestedKeys: ['buses', 'vehicles', 'fleet'],
  },
]

function resolveKpiValue(
  record: Record<string, unknown>,
  def: KpiDef,
  locale: string,
): { value: string; trendLabel?: string; trendTone: DashboardStatCard['trendTone'] } | null {
  if (def.format === 'text' || def.nestedKeys) {
    for (const key of def.nestedKeys ?? []) {
      const nested = asRecord(record[key])
      if (nested) {
        const label = pickString(nested, 'name', 'name_en', 'name_ar', 'code', 'label', 'title')
        if (label) {
          const revenue = pickNumber(nested, 'revenue', 'monthly_revenue', 'total_revenue')
          const trend = resolveTrend(nested, def.trendPrefixes)
          return {
            value: label,
            trendLabel:
              trend.label ??
              (revenue != null ? formatMoney(revenue, locale) : undefined),
            trendTone: trend.tone,
          }
        }
        const count = pickNumber(nested, 'total', 'count', 'active', 'operational')
        if (count != null && def.format === 'count') {
          const operational = pickNumber(nested, 'operational', 'active')
          const maintenance = pickNumber(nested, 'maintenance', 'inactive')
          const trend = resolveTrend(nested, def.trendPrefixes)
          return {
            value: formatCount(count, locale),
            trendLabel:
              trend.label ??
              (operational != null || maintenance != null
                ? [
                    operational != null
                      ? `${formatCount(operational, locale)} ${locale === 'ar' ? 'عاملة' : 'operational'}`
                      : null,
                    maintenance != null
                      ? `${formatCount(maintenance, locale)} ${locale === 'ar' ? 'صيانة' : 'maintenance'}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(', ')
                : undefined),
            trendTone: trend.tone,
          }
        }
      }
    }
  }

  if (def.format === 'text') {
    const text = pickString(record, ...def.valueKeys)
    if (!text) return null
    const trend = resolveTrend(record, def.trendPrefixes)
    return { value: text, trendLabel: trend.label, trendTone: trend.tone }
  }

  const amount = pickNumber(record, ...def.valueKeys)
  if (amount == null) return null
  const trend = resolveTrend(record, def.trendPrefixes)
  return {
    value: def.format === 'money' ? formatMoney(amount, locale) : formatCount(amount, locale),
    trendLabel: trend.label,
    trendTone: trend.tone,
  }
}

/** Normalize GET /company/dashboard/kpis */
export function mapDashboardKpis(payload: unknown, locale: string): DashboardStatCard[] {
  const data = unwrapData(payload)
  const record = asRecord(data) ?? asRecord(payload)
  if (!record) return []

  const cards: DashboardStatCard[] = []
  for (const def of KPI_DEFS) {
    const mapped = resolveKpiValue(record, def, locale)
    if (!mapped) continue
    cards.push({
      id: def.id,
      titleKey: def.titleKey,
      value: mapped.value,
      trendLabel: mapped.trendLabel,
      trendTone: mapped.trendTone,
      Icon: def.Icon,
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
