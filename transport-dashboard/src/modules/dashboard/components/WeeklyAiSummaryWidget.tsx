import type { ReactNode } from 'react'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { WeeklySummaryKpis } from '@/modules/dashboard/components/WeeklySummaryKpis'
import { WeeklySummaryLists } from '@/modules/dashboard/components/WeeklySummaryLists'
import { useWeeklySummary } from '@/modules/dashboard/hooks/useWeeklySummary'
import { formatWeeklyDate } from '@/modules/dashboard/utils/formatWeeklySummary'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useTranslation } from '@/shared/i18n/useTranslation'

function WeeklySummarySkeleton() {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h2>
      {children}
    </section>
  )
}

export function WeeklyAiSummaryWidget() {
  const { t, locale } = useTranslation()
  const { data, isOpen, isLoading, error, load, reload, hide } = useWeeklySummary()

  if (!isOpen) {
    return (
      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-base font-semibold text-text-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2F3E1F]/10 text-[#2F3E1F]">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              {t('dashboard.weekly.title')}
            </p>
            <p className="mt-2 text-sm text-text-muted">{t('dashboard.weekly.ctaHint')}</p>
          </div>
          <Button
            onClick={() => void load()}
            className="shrink-0 bg-brand-primary text-white hover:bg-brand-primary-dark"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {t('dashboard.weekly.cta')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) return <WeeklySummarySkeleton />

  if (error || !data) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-red-700">{error ?? t('dashboard.weekly.error')}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={hide}>
              {t('dashboard.weekly.hide')}
            </Button>
            <Button onClick={() => void reload()} className="bg-brand-primary text-white hover:bg-brand-primary-dark">
              {t('common.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const periodRange =
    data.periodStart && data.periodEnd
      ? t('dashboard.weekly.periodRange', {
          start: formatWeeklyDate(data.periodStart, locale),
          end: formatWeeklyDate(data.periodEnd, locale),
        })
      : ''

  const showSummary = data.aiGenerated && Boolean(data.summaryAr)
  const showBriefing = showSummary || data.highlights.length > 0
  const hasNumbers = Boolean(data.revenue || data.passengers || data.trips || data.occupancy || data.noShows)
  const hasDetails =
    data.topRoutes.length > 0 ||
    data.worstRoutes.length > 0 ||
    data.busiestDay != null ||
    data.peakHours.length > 0 ||
    data.onTime != null ||
    data.topComplaints.length > 0

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 bg-gradient-to-br from-[#2F3E1F] to-[#3F5429] p-5 text-white">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-base font-semibold text-white">
            <Sparkles className="h-4 w-4" aria-hidden />
            {t('dashboard.weekly.title')}
          </p>
          <p className="mt-1 text-xs text-white/75">
            {t('dashboard.weekly.periodLabel')}
            {periodRange ? ` · ${periodRange}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium">
            {data.aiGenerated ? t('dashboard.weekly.aiBadge') : t('dashboard.weekly.autoBadge')}
          </span>
          <Button
            variant="ghost"
            onClick={() => void reload()}
            className="h-8 px-2.5 text-xs text-white hover:bg-white/10 hover:text-white"
          >
            {t('dashboard.weekly.refresh')}
          </Button>
          <Button
            variant="ghost"
            onClick={hide}
            className="h-8 px-2.5 text-xs text-white hover:bg-white/10 hover:text-white"
          >
            {t('dashboard.weekly.hide')}
          </Button>
        </div>
      </div>

      <div className="space-y-6 p-5">
        {showBriefing ? (
          <Section title={t('dashboard.weekly.sectionBriefing')}>
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="rounded-xl bg-surface-muted/40 p-4 lg:col-span-3">
                {showSummary ? (
                  <p className="text-sm leading-7 text-text-primary" dir="rtl">
                    {data.summaryAr}
                  </p>
                ) : (
                  <p className="text-sm text-text-muted">{t('dashboard.weekly.fallbackNote')}</p>
                )}
              </div>

              {data.highlights.length > 0 ? (
                <div className="rounded-xl border border-border p-4 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {t('dashboard.weekly.sectionHighlights')}
                  </h3>
                  <ol className="mt-3 list-decimal space-y-2 ps-5 text-sm leading-6 text-text-primary" dir="rtl">
                    {data.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {data.alerts.length > 0 ? (
          <Section title={t('dashboard.weekly.alerts')}>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <ul className="space-y-2">
                {data.alerts.map((alert) => (
                  <li key={alert} className="flex gap-2 text-sm leading-6 text-amber-950" dir="rtl">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        ) : null}

        {hasNumbers ? (
          <Section title={t('dashboard.weekly.sectionNumbers')}>
            <WeeklySummaryKpis data={data} />
          </Section>
        ) : null}

        {hasDetails ? (
          <Section title={t('dashboard.weekly.sectionDetails')}>
            <WeeklySummaryLists data={data} />
          </Section>
        ) : null}

        <p className="text-[11px] text-text-muted">{t('dashboard.weekly.cachedHint')}</p>
      </div>
    </Card>
  )
}
