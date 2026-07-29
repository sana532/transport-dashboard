import { ChevronDown } from 'lucide-react'
import type { RestArea } from '@/modules/geography/types'
import type { RouteRestAreaStop } from '@/modules/geography/types'
import { restAreaLabelForStop } from '@/modules/routes/utils/routeRestAreas'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'

type RouteRestAreasCellProps = {
  stops: RouteRestAreaStop[] | undefined
  catalog: RestArea[]
  className?: string
}

type StopView = {
  order: number
  label: string
  duration: number
}

function buildStopViews(stops: RouteRestAreaStop[], catalog: RestArea[]): StopView[] {
  return [...stops]
    .sort((a, b) => a.stop_order - b.stop_order)
    .map((stop) => ({
      order: stop.stop_order,
      label: restAreaLabelForStop(stop, catalog),
      duration: stop.duration_minutes,
    }))
}

function StopChip({ stop, compact = false }: { stop: StopView; compact?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border border-border/80 bg-surface-muted/80',
        compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
      )}
      title={stop.label}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/12 font-semibold text-[var(--brand-primary)]',
          compact ? 'h-4 w-4 text-[9px]' : 'h-5 w-5 text-[10px]',
        )}
        aria-hidden
      >
        {stop.order}
      </span>
      <span className="min-w-0 truncate text-text-secondary">{stop.label}</span>
      {stop.duration > 0 ? (
        <span className="shrink-0 text-[10px] text-text-muted">{stop.duration}m</span>
      ) : null}
    </span>
  )
}

function StopList({ stops, compact = false }: { stops: StopView[]; compact?: boolean }) {
  return (
    <ul className={cn('flex flex-col gap-1', compact && 'gap-0.5')}>
      {stops.map((stop) => (
        <li key={`${stop.order}-${stop.label}`}>
          <StopChip stop={stop} compact={compact} />
        </li>
      ))}
    </ul>
  )
}

const INLINE_CHIP_LIMIT = 2

export function RouteRestAreasCell({ stops, catalog, className }: RouteRestAreasCellProps) {
  const { t } = useTranslation()

  if (!stops?.length) {
    return <span className="text-text-muted">{t('routes.restStopsNone')}</span>
  }

  const views = buildStopViews(stops, catalog)

  if (views.length <= INLINE_CHIP_LIMIT) {
    return (
      <div className={cn('flex max-w-[15rem] flex-wrap gap-1', className)}>
        {views.map((stop) => (
          <StopChip key={`${stop.order}-${stop.label}`} stop={stop} />
        ))}
      </div>
    )
  }

  const preview = views.slice(0, INLINE_CHIP_LIMIT)
  const extra = views.slice(INLINE_CHIP_LIMIT)

  return (
    <details className={cn('group max-w-[15rem]', className)}>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-transparent py-0.5 transition-colors hover:border-border hover:bg-surface-muted/50 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {preview.map((stop) => (
            <StopChip key={`${stop.order}-${stop.label}`} stop={stop} compact />
          ))}
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--brand-primary)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand-primary)]">
          +{extra.length}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-text-muted transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      {extra.length > 0 ? (
        <div className="mt-1.5 border-s border-surface-muted ps-2">
          <StopList stops={extra} compact />
        </div>
      ) : null}
    </details>
  )
}
