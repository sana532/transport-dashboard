import type { LucideIcon } from 'lucide-react'
import {
  Armchair,
  CircleDollarSign,
  RouteOff,
  ShipWheel,
  Users,
} from 'lucide-react'
import type { WeeklyAiSummary } from '@/modules/dashboard/types/weeklySummary'
import {
  clampPct,
  formatWeeklyChange,
  formatWeeklyCount,
  formatWeeklyMoney,
  formatWeeklyPct,
  gaugeWidthFromRate,
} from '@/modules/dashboard/utils/formatWeeklySummary'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'

type WeeklySummaryKpisProps = {
  data: WeeklyAiSummary
}

function Gauge({
  percent,
  tone,
}: {
  percent: number
  tone: 'neutral' | 'good' | 'warn' | 'bad'
}) {
  const color =
    tone === 'good'
      ? 'bg-green-600'
      : tone === 'warn'
        ? 'bg-amber-500'
        : tone === 'bad'
          ? 'bg-red-600'
          : 'bg-[#2F3E1F]'

  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
      <div className={cn('h-full rounded-full', color)} style={{ width: `${clampPct(percent)}%` }} />
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  rows,
  gauge,
}: {
  title: string
  value: string
  icon: LucideIcon
  trend?: { label: string; tone: 'up' | 'down' }
  rows?: Array<{ label: string; value: string }>
  gauge?: { percent: number; tone: 'neutral' | 'good' | 'warn' | 'bad' }
}) {
  return (
    <article className="h-full rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-muted">{title}</p>
          <p className="mt-2 break-words text-xl font-semibold tracking-tight text-text-primary" dir="ltr">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2F3E1F]/10 text-[#2F3E1F]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      {trend ? (
        <p
          className={cn(
            'mt-2 text-xs font-medium',
            trend.tone === 'down' ? 'text-red-600' : 'text-green-700',
          )}
          dir="ltr"
        >
          {trend.label}
        </p>
      ) : null}
      {rows && rows.length > 0 ? (
        <dl className="mt-3 space-y-1.5 border-t border-surface-muted pt-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3 text-xs">
              <dt className="text-text-muted">{row.label}</dt>
              <dd className="text-end font-medium tabular-nums text-text-primary" dir="ltr">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {gauge ? <Gauge percent={gauge.percent} tone={gauge.tone} /> : null}
    </article>
  )
}

function occupancyTone(pct: number): 'good' | 'warn' | 'bad' {
  if (pct >= 70) return 'good'
  if (pct >= 40) return 'warn'
  return 'bad'
}

function cancellationTone(pct: number): 'good' | 'warn' | 'bad' {
  if (pct >= 20) return 'bad'
  if (pct >= 10) return 'warn'
  return 'good'
}

export function WeeklySummaryKpis({ data }: WeeklySummaryKpisProps) {
  const { t } = useTranslation()

  if (!data.revenue && !data.passengers && !data.trips && !data.occupancy && !data.noShows) {
    return null
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {data.revenue ? (
        <KpiCard
          title={t('dashboard.weekly.revenue')}
          value={formatWeeklyMoney(data.revenue.thisWeek, data.currency)}
          icon={CircleDollarSign}
          trend={formatWeeklyChange(data.revenue.changePct)}
          rows={[
            {
              label: t('dashboard.weekly.lastWeek'),
              value: formatWeeklyMoney(data.revenue.lastWeek, data.currency),
            },
          ]}
        />
      ) : null}

      {data.passengers ? (
        <KpiCard
          title={t('dashboard.weekly.passengers')}
          value={formatWeeklyCount(data.passengers.thisWeek)}
          icon={Users}
          trend={formatWeeklyChange(data.passengers.changePct)}
          rows={[
            {
              label: t('dashboard.weekly.lastWeek'),
              value: formatWeeklyCount(data.passengers.lastWeek),
            },
          ]}
        />
      ) : null}

      {data.trips ? (
        <KpiCard
          title={t('dashboard.weekly.trips')}
          value={formatWeeklyCount(data.trips.total)}
          icon={ShipWheel}
          rows={[
            {
              label: t('dashboard.weekly.completedLabel'),
              value: formatWeeklyCount(data.trips.completed),
            },
            {
              label: t('dashboard.weekly.cancelledLabel'),
              value: formatWeeklyCount(data.trips.cancelled),
            },
            {
              label: t('dashboard.weekly.cancellationRate'),
              value: formatWeeklyPct(data.trips.cancellationRatePct),
            },
          ]}
          gauge={{
            percent: data.trips.cancellationRatePct,
            tone: cancellationTone(data.trips.cancellationRatePct),
          }}
        />
      ) : null}

      {data.occupancy ? (
        <KpiCard
          title={t('dashboard.weekly.occupancy')}
          value={formatWeeklyPct(data.occupancy.avgLoadFactorPct)}
          icon={Armchair}
          rows={[
            {
              label: t('dashboard.weekly.seatsUnit'),
              value: `${formatWeeklyCount(data.occupancy.seatsSold)} / ${formatWeeklyCount(data.occupancy.seatsCapacity)}`,
            },
            {
              label: t('dashboard.weekly.tripsUnit'),
              value: formatWeeklyCount(data.occupancy.tripsMeasured),
            },
          ]}
          gauge={{
            percent: data.occupancy.avgLoadFactorPct,
            tone: occupancyTone(data.occupancy.avgLoadFactorPct),
          }}
        />
      ) : null}

      {data.noShows ? (
        <KpiCard
          title={t('dashboard.weekly.noShows')}
          value={
            data.noShows.ratePct != null
              ? formatWeeklyPct(data.noShows.ratePct)
              : formatWeeklyCount(data.noShows.count)
          }
          icon={RouteOff}
          rows={[
            {
              label: t('dashboard.weekly.countLabel'),
              value: formatWeeklyCount(data.noShows.count),
            },
            {
              label: t('dashboard.weekly.heldRevenue'),
              value: formatWeeklyMoney(data.noShows.lostRevenue, data.currency),
            },
          ]}
          gauge={{
            percent: gaugeWidthFromRate(data.noShows.rate, data.noShows.ratePct),
            tone: 'warn',
          }}
        />
      ) : null}
    </div>
  )
}
