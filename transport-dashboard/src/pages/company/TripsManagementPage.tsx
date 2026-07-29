import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  CalendarClock,
  ClipboardList,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import type { TripsRecentRow, TripsStatVariant } from '@/modules/trips/types'
import { useTripsManagement } from '@/modules/trips/hooks/useTripsManagement'
import type { CompanyRoute } from '@/modules/routes/types'
import { routesService } from '@/modules/routes/services/routesService'
import { routeDisplayName } from '@/modules/routes/utils/routeDisplay'
import {
  defaultTripListFilters,
  filterTrips,
  hasActiveTripFilters,
  type TripListFilters,
} from '@/modules/trips/utils/filterTrips'
import { mapTripToRecentRow } from '@/modules/trips/services/tripsManagementService'
import { CountUp } from '@/shared/ui/CountUp'
import type { TripStatFilterId } from '@/modules/trips/utils/buildTripsStats'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const tripsSurfaceCardClass =
  'border border-border shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md'

function statCardClass(variant: TripsStatVariant, selected: boolean): string {
  if (variant === 'primary') {
    return selected
      ? 'bg-[#2F3E1F] text-white border-[#2F3E1F] ring-2 ring-[#2F3E1F]/40'
      : 'bg-[#2F3E1F] text-white border-[#2F3E1F]'
  }
  return selected
    ? 'bg-surface border-[#2F3E1F] ring-2 ring-[#2F3E1F]/25'
    : 'bg-surface'
}

function statIconWrapClass(variant: TripsStatVariant): string {
  if (variant === 'primary') return 'bg-white/10 text-white'
  if (variant === 'info') return 'bg-blue-50 text-blue-600'
  if (variant === 'success') return 'bg-green-50 text-green-600'
  return 'bg-slate-100 text-slate-600'
}

function statusBadgeClass(status: TripsRecentRow['status']): string {
  if (status === 'completed') return 'bg-green-100 text-green-700'
  if (status === 'cancelled') return 'bg-red-100 text-red-700'
  if (status === 'active') return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-800'
}

function TripsLoadingBody({ message }: { message: string }) {
  return (
    <>
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-text-muted">{message}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 animate-pulse rounded-xl border border-border bg-surface shadow-sm"
          />
        ))}
      </div>
      <div className="animate-pulse rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
        <div className="h-10 rounded-lg bg-slate-100" />
      </div>
      <div className="animate-pulse rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-4">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-10 rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </>
  )
}

function TripsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm text-red-700">{message}</p>
        <Button onClick={onRetry} className="bg-brand-primary text-white hover:bg-brand-primary-dark">
          {t('common.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function TripsManagementPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading, error, reload, deleteTrip } = useTripsManagement()
  const [filters, setFilters] = useState<TripListFilters>(defaultTripListFilters)
  const [routes, setRoutes] = useState<CompanyRoute[]>([])
  const [statFilter, setStatFilter] = useState<TripStatFilterId>('all')

  useEffect(() => {
    void routesService
      .listRoutes()
      .then(setRoutes)
      .catch(() => setRoutes([]))
  }, [])

  const activeTrips = useMemo(() => {
    if (!data) return []
    const operational = data.trips.filter(
      (trip) => trip.status !== 'completed' && trip.status !== 'cancelled',
    )
    const statusScoped =
      statFilter === 'scheduled' || statFilter === 'active'
        ? operational.filter((trip) => trip.status === statFilter)
        : operational
    return filterTrips(statusScoped, filters)
  }, [data, filters, statFilter])

  const tableRows = useMemo(
    () => activeTrips.map((trip) => mapTripToRecentRow(trip, locale === 'ar' ? 'ar-SY' : 'en-US')),
    [activeTrips, locale],
  )

  const hasActiveFilters = hasActiveTripFilters(filters) || statFilter !== 'all'

  const handleResetFilters = () => {
    setFilters(defaultTripListFilters)
    setStatFilter('all')
  }

  const handleStatClick = (filterId: TripStatFilterId) => {
    if (filterId === 'archive') {
      navigate(paths.company.tripArchive)
      return
    }
    setStatFilter((prev) => (prev === filterId ? 'all' : filterId))
    if (filterId === 'scheduled' || filterId === 'active') {
      setFilters((prev) => ({ ...prev, status: 'all' }))
    }
  }

  const handleDelete = async (row: TripsRecentRow) => {
    if (!window.confirm(t('trips.confirmDelete', { id: row.id }))) return
    try {
      await deleteTrip(row.numericId)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('tripForm.error.saveFailed'))
    }
  }

  if (error && !data) {
    return (
      <TripsErrorState
        message={error ?? t('trips.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            {t('trips.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t('trips.subtitle')}</p>
        </div>
        <TripsLoadingBody message={t('common.loading')} />
      </div>
    )
  }

  if (!data) {
    return (
      <TripsErrorState
        message={t('trips.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            {t('trips.title')}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-text-muted">{t('trips.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(paths.company.tripArchive)}
            className="border-border bg-surface text-text-secondary hover:bg-surface-muted"
            aria-label={t('trips.archiveCtaAria')}
          >
            <Archive className="h-4 w-4 shrink-0" aria-hidden />
            {t('trips.archiveCtaShort')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(paths.company.tripSchedules)}
            className="border-border bg-surface text-text-secondary hover:bg-surface-muted"
            aria-label={t('trips.schedulesCtaAria')}
          >
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
            {t('trips.schedulesCtaShort')}
          </Button>
          <Button
            type="button"
            onClick={() => navigate(paths.company.tripNew)}
            className="bg-[var(--brand-primary)] text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)] focus-visible:ring-[var(--brand-primary)]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('trips.addNew')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => {
          const filterId = (stat.id as TripStatFilterId) || 'all'
          const selected = filterId !== 'archive' && statFilter === filterId
          return (
            <button
              key={stat.id}
              type="button"
              onClick={() => handleStatClick(filterId)}
              className={cn(
                'rounded-xl text-start',
                tripsSurfaceCardClass,
                statCardClass(stat.variant, selected),
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F3E1F]/40',
              )}
              aria-pressed={selected}
              aria-label={
                filterId === 'archive'
                  ? t('trips.stats.archive.action')
                  : t('trips.stats.filterAria', { title: stat.title })
              }
            >
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        statIconWrapClass(stat.variant),
                      )}
                    >
                      <stat.Icon className="h-5 w-5 shrink-0" aria-hidden />
                    </div>
                    <p
                      className={cn(
                        'min-w-0 flex-1 text-sm font-medium leading-snug',
                        stat.variant === 'primary' ? 'text-white/90' : 'text-text-secondary',
                      )}
                    >
                      {stat.title}
                    </p>
                  </div>
                  <CountUp
                    value={stat.value}
                    className={cn(
                      'mt-3 block text-3xl font-semibold leading-none tabular-nums',
                      stat.variant === 'primary' ? 'text-white' : 'text-text-primary',
                    )}
                  />
                  <p
                    className={cn(
                      'mt-2 text-xs',
                      stat.variant === 'primary' ? 'text-white/75' : 'text-text-muted',
                    )}
                  >
                    {stat.note}
                  </p>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      <Card className={tripsSurfaceCardClass}>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="trip-search" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('trips.searchLabel')}
              </label>
              <Input
                id="trip-search"
                name="trip-search"
                placeholder={t('trips.searchPlaceholder')}
                aria-label={t('trips.searchLabel')}
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="trip-route-filter" className="text-sm font-medium text-text-secondary">
                  {t('trips.route')}
                </label>
                <select
                  id="trip-route-filter"
                  className={selectClass}
                  value={filters.routeId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      routeId: e.target.value,
                    }))
                  }
                >
                  <option value="all">{t('trips.allRoutes')}</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {routeDisplayName(route, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="trip-date-filter" className="text-sm font-medium text-text-secondary">
                  {t('trips.filterDate')}
                </label>
                <input
                  id="trip-date-filter"
                  type="date"
                  className={selectClass}
                  value={filters.departureDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      departureDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="trip-time-filter" className="text-sm font-medium text-text-secondary">
                  {t('trips.filterTime')}
                </label>
                <input
                  id="trip-time-filter"
                  type="time"
                  className={selectClass}
                  value={filters.departureTime}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      departureTime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="trip-status-filter" className="text-sm font-medium text-text-secondary">
                  {t('trips.status')}
                </label>
                <select
                  id="trip-status-filter"
                  className={selectClass}
                  value={filters.status}
                  onChange={(e) => {
                    const next = e.target.value as TripListFilters['status']
                    setFilters((prev) => ({ ...prev, status: next }))
                    if (next === 'scheduled' || next === 'active') {
                      setStatFilter(next)
                    } else if (next === 'all') {
                      setStatFilter('all')
                    }
                  }}
                >
                  <option value="all">{t('trips.allStatus')}</option>
                  <option value="scheduled">{t('trips.tripStatus.scheduled')}</option>
                  <option value="active">{t('trips.tripStatus.active')}</option>
                </select>
              </div>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <p className="text-xs text-text-muted">{t('trips.filtersActive')}</p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="border-border"
              >
                {t('trips.clearFilters')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className={tripsSurfaceCardClass}>
        <CardHeader className="border-border">
          <CardTitle className="text-lg font-semibold sm:text-xl">{t('trips.recentTitle')}</CardTitle>
          <p className="mt-1 text-sm text-text-muted">
            {t('trips.listCount', { count: tableRows.length })}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {data.trips.filter((trip) => trip.status !== 'completed' && trip.status !== 'cancelled')
            .length === 0 ? (
            <div className="p-6 text-center">
              <p className="font-medium text-text-primary">{t('trips.emptyTitle')}</p>
              <p className="mt-2 text-sm text-text-muted">{t('trips.emptyHint')}</p>
              <Button
                type="button"
                className="mt-4 bg-[var(--brand-primary)] text-white"
                onClick={() => navigate(paths.company.tripNew)}
              >
                {t('trips.addNew')}
              </Button>
            </div>
          ) : tableRows.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-text-muted">{t('trips.noFilterResults')}</p>
              <Button type="button" variant="ghost" className="mt-3" onClick={handleResetFilters}>
                {t('trips.clearFilters')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-y border-border bg-background text-text-muted">
                  <tr>
                    {(
                      [
                        'trips.col.tripId',
                        'trips.col.route',
                        'trips.col.driver',
                        'trips.col.vehicle',
                        'trips.col.dateTime',
                        'trips.col.status',
                        'trips.col.actions',
                      ] as const
                    ).map((key) => (
                      <th key={key} className="px-4 py-3 font-medium">
                        {t(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((trip) => (
                    <tr
                      key={trip.id}
                      className="border-b border-border text-text-secondary"
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {trip.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-text-muted" />
                          {trip.route}
                        </span>
                      </td>
                      <td className="px-4 py-3">{trip.driver}</td>
                      <td className="px-4 py-3">{trip.vehicle}</td>
                      <td className="px-4 py-3">{trip.dateTime}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            statusBadgeClass(trip.status),
                          )}
                        >
                          {t(`trips.tripStatus.${trip.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 gap-1 px-2.5 text-xs"
                            onClick={() =>
                              navigate(paths.company.tripDetailsBookings(String(trip.numericId)))
                            }
                          >
                            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                            {t('trips.actions.detailsBookings')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 gap-1 px-2.5 text-xs"
                            onClick={() =>
                              navigate(paths.company.tripTracking(String(trip.numericId)))
                            }
                          >
                            <Navigation className="h-3.5 w-3.5" aria-hidden />
                            {t('trips.actions.track')}
                          </Button>
                          <button
                            className="rounded p-1 hover:bg-surface-muted"
                            type="button"
                            aria-label={t('trips.aria.edit')}
                            onClick={() => navigate(paths.company.tripEdit(String(trip.numericId)))}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            type="button"
                            aria-label={t('trips.aria.delete')}
                            onClick={() => void handleDelete(trip)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
