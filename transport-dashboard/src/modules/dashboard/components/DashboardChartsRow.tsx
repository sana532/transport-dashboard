import { useMemo } from 'react'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RevenueTrendPoint, RoutePerformanceSlice } from '@/modules/dashboard/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { useTranslation } from '@/shared/i18n/useTranslation'

type DashboardChartsRowProps = {
  revenueTrendData: RevenueTrendPoint[]
  routePerformanceData: RoutePerformanceSlice[]
}

export function DashboardChartsRow({
  revenueTrendData,
  routePerformanceData,
}: DashboardChartsRowProps) {
  const { t } = useTranslation()

  const lineChartData = useMemo(
    () =>
      revenueTrendData.map((d) => ({
        ...d,
        monthLabel: t(`dashboard.months.${d.monthKey}`),
      })),
    [revenueTrendData, t],
  )

  const pieChartData = useMemo(
    () =>
      routePerformanceData.map((s) => ({
        ...s,
        displayName: s.labelKey ? t(s.labelKey) : s.name,
      })),
    [routePerformanceData, t],
  )

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-surface-muted">
          <CardTitle className="text-base">{t('dashboard.revenueTrendTitle')}</CardTitle>
          <Button variant="outline" className="h-8 px-3 text-xs">
            {t('dashboard.last12Months')}
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 rounded-lg border border-surface-muted bg-background p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineChartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  width={34}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, t('dashboard.revenue')]}
                  labelStyle={{ color: '#111827' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2F3E1F"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#2F3E1F' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('dashboard.routePerformanceTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 rounded-lg border border-surface-muted bg-background p-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="displayName"
                  cx="42%"
                  cy="50%"
                  outerRadius={84}
                  innerRadius={0}
                  paddingAngle={0}
                  stroke="none"
                  label={({ value }) => `${value}%`}
                  labelLine={false}
                >
                  {pieChartData.map((slice) => (
                    <Cell key={slice.id} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${Number(value)}%`, t('dashboard.share')]} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="square"
                  wrapperStyle={{ fontSize: '12px', color: '#374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
