import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RevenueTrendPoint, RoutePerformanceSlice } from '@/modules/dashboard/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'

type DashboardChartsRowProps = {
  revenueTrendData: RevenueTrendPoint[]
  routePerformanceData: RoutePerformanceSlice[]
}

function formatAxisMoney(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}

export function DashboardChartsRow({
  revenueTrendData,
  routePerformanceData,
}: DashboardChartsRowProps) {
  const { t, locale } = useTranslation()
  const numberLocale = locale === 'ar' ? 'ar-SY' : 'en-US'

  const lineChartData = useMemo(() => {
    const mapped = revenueTrendData.map((d, index) => ({
      ...d,
      monthLabel:
        d.label ||
        (d.monthKey
          ? t(`dashboard.months.${d.monthKey}`)
          : t('dashboard.months.unknown', { n: index + 1 })),
    }))

    const firstActive = mapped.findIndex((d) => d.revenue > 0)
    const lastActive = mapped.findLastIndex((d) => d.revenue > 0)
    if (firstActive === -1) return mapped
    const start = Math.max(0, firstActive - 1)
    const end = Math.min(mapped.length - 1, lastActive + 1)
    return mapped.slice(start, end + 1)
  }, [revenueTrendData, t])

  const hasRevenueActivity = lineChartData.some((d) => d.revenue > 0)

  const routeRows = useMemo(() => {
    const rows = routePerformanceData.map((s) => ({
      ...s,
      displayName: s.labelKey ? t(s.labelKey) : s.name,
    }))
    const max = Math.max(...rows.map((r) => r.value), 0)
    return rows
      .slice()
      .sort((a, b) => b.value - a.value)
      .map((row) => ({
        ...row,
        widthPercent: max > 0 ? Math.max(6, Math.round((row.value / max) * 100)) : 0,
      }))
  }, [routePerformanceData, t])

  return (
    <div className="grid gap-5 xl:grid-cols-5">
      <Card className="overflow-hidden border-border shadow-sm xl:col-span-3">
        <CardHeader className="border-b border-border/70 bg-surface-muted/30 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                {t('dashboard.revenueTrendTitle')}
              </CardTitle>
              <p className="mt-1 text-xs text-text-muted">{t('dashboard.revenueTrendHint')}</p>
            </div>
            <span className="rounded-full bg-[#2F3E1F]/10 px-2.5 py-1 text-[11px] font-medium text-[#2F3E1F]">
              {t('dashboard.last12Months')}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {!hasRevenueActivity ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/20 px-6 text-center">
              <p className="text-sm font-medium text-text-primary">{t('dashboard.emptyChartTitle')}</p>
              <p className="mt-1 max-w-sm text-xs text-text-muted">{t('dashboard.emptyChart')}</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineChartData} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2F3E1F" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#2F3E1F" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE3" vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#8B9383' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={18}
                  />
                  <YAxis
                    tickFormatter={formatAxisMoney}
                    tick={{ fontSize: 11, fill: '#8B9383' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ stroke: '#2F3E1F', strokeOpacity: 0.2 }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                    }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString(numberLocale)} SYP`,
                      t('dashboard.revenue'),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2F3E1F"
                    strokeWidth={2.5}
                    fill="url(#revenueFill)"
                    dot={{ r: 3, fill: '#2F3E1F', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#2F3E1F' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border shadow-sm xl:col-span-2">
        <CardHeader className="border-b border-border/70 bg-surface-muted/30 pb-3">
          <CardTitle className="text-base font-semibold">
            {t('dashboard.routePerformanceTitle')}
          </CardTitle>
          <p className="mt-1 text-xs text-text-muted">{t('dashboard.routePerformanceHint')}</p>
        </CardHeader>
        <CardContent className="p-5">
          {routeRows.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/20 px-6 text-center">
              <p className="text-sm font-medium text-text-primary">{t('dashboard.emptyChartTitle')}</p>
              <p className="mt-1 max-w-sm text-xs text-text-muted">{t('dashboard.emptyChart')}</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {routeRows.map((row, index) => (
                <li key={row.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        <span className="me-2 text-xs text-text-muted">{index + 1}.</span>
                        {row.displayName}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
                      {row.value <= 100
                        ? `${row.value}%`
                        : `${row.value.toLocaleString(numberLocale)} SYP`}
                    </p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={cn('h-full rounded-full transition-all')}
                      style={{
                        width: `${row.widthPercent}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
