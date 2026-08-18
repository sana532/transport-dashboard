import type { ReactNode } from 'react'
import { AlertTriangle, Clock3, Timer } from 'lucide-react'
import type { WeeklyAiSummary } from '@/modules/dashboard/types/weeklySummary'
import {
  clampPct,
  formatWeeklyCount,
  formatWeeklyDate,
  formatWeeklyMoney,
  formatWeeklyPct,
} from '@/modules/dashboard/utils/formatWeeklySummary'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'

type WeeklySummaryListsProps = {
  data: WeeklyAiSummary
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function BarRow({
  label,
  value,
  widthPercent,
  barClass,
  meta,
}: {
  label: string
  value: string
  widthPercent: number
  barClass?: string
  meta?: string
}) {
  return (
    <li>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-text-primary">{label}</p>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-text-primary" dir="ltr">
          {value}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn('h-full rounded-full bg-[#2F3E1F]', barClass)}
          style={{ width: `${clampPct(Math.max(widthPercent, 4))}%` }}
        />
      </div>
      {meta ? (
        <p className="mt-1 text-xs text-text-muted" dir="ltr">
          {meta}
        </p>
      ) : null}
    </li>
  )
}

function occupancyBarClass(pct: number): string {
  if (pct >= 70) return 'bg-green-600'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-red-600'
}

export function WeeklySummaryLists({ data }: WeeklySummaryListsProps) {
  const { t, locale } = useTranslation()
  const showPeak = data.busiestDay != null || data.peakHours.length > 0
  const showOnTime = data.onTime != null
  const maxPeakSeats = Math.max(...data.peakHours.map((row) => row.seats), 0)

  if (
    data.topRoutes.length === 0 &&
    data.worstRoutes.length === 0 &&
    !showPeak &&
    !showOnTime &&
    data.topComplaints.length === 0
  ) {
    return null
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {data.topRoutes.length > 0 ? (
        <Panel title={t('dashboard.weekly.topRoutes')} hint={t('dashboard.weekly.topRoutesHint')}>
          <ul className="space-y-4">
            {data.topRoutes.map((route) => (
              <BarRow
                key={route.routeName}
                label={route.routeName}
                value={formatWeeklyPct(route.sharePct)}
                widthPercent={route.sharePct}
                meta={`${t('dashboard.weekly.bookings')}: ${formatWeeklyCount(route.bookings)} · ${formatWeeklyMoney(route.revenue, data.currency)}`}
              />
            ))}
          </ul>
        </Panel>
      ) : null}

      {data.worstRoutes.length > 0 ? (
        <Panel title={t('dashboard.weekly.worstRoutes')} hint={t('dashboard.weekly.worstRoutesHint')}>
          <ul className="space-y-4">
            {data.worstRoutes.map((route) => (
              <BarRow
                key={route.routeName}
                label={route.routeName}
                value={formatWeeklyPct(route.loadFactorPct)}
                widthPercent={route.loadFactorPct}
                barClass={occupancyBarClass(route.loadFactorPct)}
                meta={`${formatWeeklyCount(route.seatsSold)} / ${formatWeeklyCount(route.capacity)} · ${formatWeeklyCount(route.trips)} ${t('dashboard.weekly.tripsUnit')}`}
              />
            ))}
          </ul>
        </Panel>
      ) : null}

      {showPeak ? (
        <Panel title={t('dashboard.weekly.peak')}>
          <div className="space-y-4">
            {data.busiestDay ? (
              <div className="rounded-xl bg-surface-muted/40 px-4 py-3">
                <p className="text-xs font-medium text-text-muted">{t('dashboard.weekly.busiestDay')}</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {data.busiestDay.weekday}
                  {data.busiestDay.date ? ` · ${formatWeeklyDate(data.busiestDay.date, locale)}` : ''}
                </p>
                <p className="mt-1 text-xs text-text-muted" dir="ltr">
                  {formatWeeklyCount(data.busiestDay.seats)} {t('dashboard.weekly.seatsUnit')}
                </p>
              </div>
            ) : null}

            {data.peakHours.length > 0 ? (
              <div>
                <p className="mb-3 text-xs font-medium text-text-muted">{t('dashboard.weekly.peakHours')}</p>
                <ul className="space-y-3">
                  {data.peakHours.map((row) => (
                    <BarRow
                      key={row.hour}
                      label={row.hour}
                      value={`${formatWeeklyCount(row.seats)} ${t('dashboard.weekly.seatsUnit')}`}
                      widthPercent={maxPeakSeats > 0 ? (row.seats / maxPeakSeats) * 100 : 0}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {showOnTime && data.onTime ? (
        <Panel title={t('dashboard.weekly.onTime')}>
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-sm text-text-muted">
                  <Timer className="h-4 w-4 text-[#2F3E1F]" aria-hidden />
                  {t('dashboard.weekly.onTimePct')}
                </p>
                <p className="text-xl font-semibold tabular-nums text-text-primary" dir="ltr">
                  {formatWeeklyPct(data.onTime.onTimePct)}
                </p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    data.onTime.onTimePct >= 80
                      ? 'bg-green-600'
                      : data.onTime.onTimePct >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-600',
                  )}
                  style={{ width: `${clampPct(data.onTime.onTimePct)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface-muted/40 px-3 py-2">
                <p className="text-xs text-text-muted">{t('dashboard.weekly.lateTripsLabel')}</p>
                <p className="mt-1 font-semibold text-text-primary" dir="ltr">
                  {formatWeeklyCount(data.onTime.lateTrips)}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted/40 px-3 py-2">
                <p className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  {t('dashboard.weekly.avgDelayLabel')}
                </p>
                <p className="mt-1 font-semibold text-text-primary" dir="ltr">
                  {formatWeeklyCount(data.onTime.avgDelayMinutes)}
                </p>
              </div>
            </div>
            <p className="text-xs text-text-muted">
              {t('dashboard.weekly.measuredTrips', {
                n: formatWeeklyCount(data.onTime.measuredTrips),
              })}
            </p>
          </div>
        </Panel>
      ) : null}

      {data.topComplaints.length > 0 ? (
        <Panel title={t('dashboard.weekly.topComplaints')}>
          <ul className="space-y-2">
            {data.topComplaints.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.count != null ? (
                  <span className="shrink-0 font-semibold tabular-nums" dir="ltr">
                    {formatWeeklyCount(item.count)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  )
}
