import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  Ban,
  CalendarClock,
  ClipboardList,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import type { TripsRecentRow, TripsStatVariant } from '@/modules/trips/types'
import { CancelTripDialog } from '@/modules/trips/components/CancelTripDialog'
import { useTripsManagement } from '@/modules/trips/hooks/useTripsManagement'
import { useCompanyLookups } from '@/modules/lookups/hooks/useCompanyLookups'
import {
  applyLocalTripFilters,
  defaultTripListFilters,
  hasActiveTripFilters,
  tripListFiltersToQuery,
  type TripListFilters,
} from '@/modules/trips/utils/filterTrips'
import { mapTripToRecentRow } from '@/modules/trips/services/tripsManagementService'
import { CountUp } from '@/shared/ui/CountUp'
import type { TripStatFilterId } from '@/modules/trips/utils/buildTripsStats'
import { isArchivedTrip } from '@/modules/trips/utils/tripStatus'
import { isScheduledTripOverdue } from '@/modules/trips/utils/tripTiming'

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
  if (status === 'interrupted') return 'bg-orange-100 text-orange-800'
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
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<TripListFilters>(defaultTripListFilters)
  const [searchInput, setSearchInput] = useState('')
  const [statFilter, setStatFilter] = useState<TripStatFilterId>('all')
  const [cancelTripId, setCancelTripId] = useState<number | null>(null)
  const [cancelTripLabel, setCancelTripLabel] = useState<string>('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const { data: lookups } = useCompanyLookups({
    routes: true,
    drivers: true,
    cities: true,
    stations: true,
  })

  const serverFilters = useMemo(() => {
    const base = tripListFiltersToQuery(filters)
    if (showOverdueOnly) {
      return { ...base, resolutionStatus: 'pending_review' as const }
    }
    if (
      (statFilter === 'scheduled' || statFilter === 'active') &&
      filters.status === 'all'
    ) {
      return { ...base, status: statFilter }
    }
    return base
  }, [filters, showOverdueOnly, statFilter])

  const serverFiltersKey = useMemo(() => JSON.stringify(serverFilters), [serverFilters])

  useEffect(() => {
    setPage(1)
  }, [serverFiltersKey])

  const { data, isLoading, isFetching, error, reload } = useTripsManagement({
    page,
    filters: serverFilters,
  })

  const originStations = useMemo(() => {
    if (filters.originCityId === 'all') return lookups.stations
    const cityId = Number(filters.originCityId)
    return lookups.stations.filter(
      (station) => station.city_id == null || station.city_id === cityId,
    )
  }, [lookups.stations, filters.originCityId])

  const destinationStations = useMemo(() => {
    if (filters.destinationCityId === 'all') return lookups.stations
    const cityId = Number(filters.destinationCityId)
    return lookups.stations.filter(
      (station) => station.city_id == null || station.city_id === cityId,
    )
  }, [lookups.stations, filters.destinationCityId])

  const pagination = data?.pagination
  const visiblePages = useMemo(() => {
    if (!pagination) return [] as number[]
    const start = Math.max(1, Math.min(pagination.currentPage - 2, pagination.lastPage - 4))
    const end = Math.min(pagination.lastPage, start + 4)
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
  }, [pagination])

  useEffect(() => {
    if (!pagination) return
    if (page > pagination.lastPage) {
      setPage(pagination.lastPage)
    }
  }, [page, pagination])

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const overdueTrips = useMemo(
    () =>
      data?.trips.filter(
        (trip) =>
          trip.resolution_status === 'pending_review' ||
          trip.flagged === true ||
          isScheduledTripOverdue(trip, nowMs),
      ) ?? [],
    [data, nowMs],
  )

  const overdueTripIds = useMemo(
    () => new Set(overdueTrips.map((trip) => trip.id)),
    [overdueTrips],
  )

  const activeTrips = useMemo(() => {
    if (!data) return []
    const operational = data.trips.filter((trip) => !isArchivedTrip(trip.status))
    return applyLocalTripFilters(operational, filters)
  }, [data, filters])

  const tableRows = useMemo(
    () => activeTrips.map((trip) => mapTripToRecentRow(trip, locale === 'ar' ? 'ar-SY' : 'en-US')),
    [activeTrips, locale],
  )

  const hasActiveFilters =
    hasActiveTripFilters(filters) || statFilter !== 'all' || showOverdueOnly

  const handleResetFilters = () => {
    setFilters(defaultTripListFilters)
    setSearchInput('')
    setStatFilter('all')
    setShowOverdueOnly(false)
    setPage(1)
  }

  const patchFilters = (patch: Partial<TripListFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  const applySearch = () => {
    patchFilters({ search: searchInput.trim() })
  }

  const handleStatClick = (filterId: TripStatFilterId) => {
    if (filterId === 'archive') {
      navigate(paths.company.tripArchive)
      return
    }
    setShowOverdueOnly(false)
    setStatFilter((prev) => (prev === filterId ? 'all' : filterId))
    if (filterId === 'scheduled' || filterId === 'active') {
      setFilters((prev) => ({ ...prev, status: 'all', resolutionStatus: 'all' }))
    }
    setPage(1)
  }

  const openCancelDialog = (row: TripsRecentRow) => {
    setCancelTripId(row.numericId)
    setCancelTripLabel(`${row.id} · ${row.route}`)
  }

  const closeCancelDialog = () => {
    setCancelTripId(null)
    setCancelTripLabel('')
  }

  const toggleOverdueFilter = () => {
    setShowOverdueOnly((current) => !current)
    setStatFilter('all')
    setFilters((current) => ({
      ...current,
      status: 'all',
      resolutionStatus: 'all',
    }))
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
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--title-h1)] sm:text-3xl">
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
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--title-h1)] sm:text-3xl">
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

      {overdueTrips.length > 0 ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
            <div>
              <p className="font-semibold">
                {t('trips.overdue.title', { count: overdueTrips.length })}
              </p>
              <p className="mt-0.5 text-sm text-amber-800">
                {t('trips.overdue.description')}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
            onClick={toggleOverdueFilter}
            aria-pressed={showOverdueOnly}
          >
            {showOverdueOnly ? t('trips.overdue.showAll') : t('trips.overdue.review')}
          </Button>
        </div>
      ) : null}

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
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <label htmlFor="trip-search" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('trips.searchLabel')}
              </label>
              <div className="relative">
                <Input
                  id="trip-search"
                  name="trip-search"
                  placeholder={t('trips.searchPlaceholder')}
                  aria-label={t('trips.searchLabel')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applySearch()
                    }
                  }}
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={applySearch}
                  className="absolute inset-y-0 end-0 z-10 flex items-center px-3 text-text-muted transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-label={t('common.search')}
                >
                  <Search className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="trip-route-filter" className="text-sm font-medium text-text-secondary">
                  {t('trips.route')}
                </label>
                <select
                  id="trip-route-filter"
                  className={selectClass}
                  value={filters.routeId}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === 'all' || /^\d+$/.test(value)) {
                      patchFilters({ routeId: value })
                      return
                    }
                    const match = lookups.routes.find(
                      (route) =>
                        route.name === value ||
                        route.name_en === value ||
                        route.name_ar === value,
                    )
                    patchFilters({ routeId: match ? String(match.id) : 'all' })
                  }}
                >
                  <option value="all">{t('trips.allRoutes')}</option>
                  {lookups.routes.map((route) => (
                    <option key={route.id} value={String(route.id)}>
                      {locale === 'ar' && route.name_ar ? route.name_ar : route.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="trip-driver-filter" className="text-sm font-medium text-text-secondary">
                  {t('trips.driver')}
                </label>
                <select
                  id="trip-driver-filter"
                  className={selectClass}
                  value={filters.driverId}
                  onChange={(e) => patchFilters({ driverId: e.target.value })}
                >
                  <option value="all">{t('trips.allDrivers')}</option>
                  {lookups.drivers.map((driver) => (
                    <option key={driver.id} value={String(driver.id)}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="trip-origin-city-filter" className="text-sm font-medium text-text-secondary">
                  {t('trips.originCity')}
                </label>
                <select
                  id="trip-origin-city-filter"
                  className={selectClass}
                  value={filters.originCityId}
                  onChange={(e) =>
                    patchFilters({
                      originCityId: e.target.value,
                      originStationId: 'all',
                    })
                  }
                >
                  <option value="all">{t('trips.allCities')}</option>
                  {lookups.cities.map((city) => (
                    <option key={city.id} value={String(city.id)}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trip-destination-city-filter"
                  className="text-sm font-medium text-text-secondary"
                >
                  {t('trips.destinationCity')}
                </label>
                <select
                  id="trip-destination-city-filter"
                  className={selectClass}
                  value={filters.destinationCityId}
                  onChange={(e) =>
                    patchFilters({
                      destinationCityId: e.target.value,
                      destinationStationId: 'all',
                    })
                  }
                >
                  <option value="all">{t('trips.allCities')}</option>
                  {lookups.cities.map((city) => (
                    <option key={`dest-city-${city.id}`} value={String(city.id)}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trip-origin-station-filter"
                  className="text-sm font-medium text-text-secondary"
                >
                  {t('trips.originStation')}
                </label>
                <select
                  id="trip-origin-station-filter"
                  className={selectClass}
                  value={filters.originStationId}
                  onChange={(e) => patchFilters({ originStationId: e.target.value })}
                >
                  <option value="all">{t('trips.allStations')}</option>
                  {originStations.map((station) => (
                    <option key={station.id} value={String(station.id)}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trip-destination-station-filter"
                  className="text-sm font-medium text-text-secondary"
                >
                  {t('trips.destinationStation')}
                </label>
                <select
                  id="trip-destination-station-filter"
                  className={selectClass}
                  value={filters.destinationStationId}
                  onChange={(e) => patchFilters({ destinationStationId: e.target.value })}
                >
                  <option value="all">{t('trips.allStations')}</option>
                  {destinationStations.map((station) => (
                    <option key={`dest-station-${station.id}`} value={String(station.id)}>
                      {station.name}
                    </option>
                  ))}
                </select>
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
                    patchFilters({ status: next })
                    setShowOverdueOnly(false)
                    if (next === 'scheduled' || next === 'active') {
                      setStatFilter(next)
                    } else {
                      setStatFilter('all')
                    }
                  }}
                >
                  <option value="all">{t('trips.allStatus')}</option>
                  <option value="scheduled">{t('trips.tripStatus.scheduled')}</option>
                  <option value="active">{t('trips.tripStatus.active')}</option>
                  <option value="interrupted">{t('trips.tripStatus.interrupted')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trip-resolution-filter"
                  className="text-sm font-medium text-text-secondary"
                >
                  {t('trips.resolutionStatus')}
                </label>
                <select
                  id="trip-resolution-filter"
                  className={selectClass}
                  value={filters.resolutionStatus}
                  onChange={(e) => {
                    patchFilters({
                      resolutionStatus: e.target.value as TripListFilters['resolutionStatus'],
                    })
                    setShowOverdueOnly(false)
                  }}
                >
                  <option value="all">{t('trips.allResolutionStatus')}</option>
                  <option value="pending_review">
                    {t('trips.resolution.pending_review')}
                  </option>
                  <option value="auto_completed">{t('trips.resolution.auto_completed')}</option>
                  <option value="auto_cancelled">{t('trips.resolution.auto_cancelled')}</option>
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
                  onChange={(e) => patchFilters({ departureDate: e.target.value })}
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
                  onChange={(e) => patchFilters({ departureTime: e.target.value })}
                />
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
            {pagination
              ? t('trips.pagination.showing', {
                  from: pagination.from,
                  to: pagination.to,
                  total: pagination.total,
                })
              : t('trips.listCount', { count: tableRows.length })}
            {isFetching ? ' …' : null}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {data.trips.filter((trip) => !isArchivedTrip(trip.status)).length === 0 ? (
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
            <>
            <div className={cn('overflow-x-auto', isFetching && 'opacity-70')}>
              <table className="app-table w-full min-w-[980px] text-left text-sm">
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
                      className={cn(
                        'border-b border-border text-text-secondary',
                        overdueTripIds.has(trip.numericId) && 'bg-amber-50/70',
                      )}
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
                        {overdueTripIds.has(trip.numericId) ? (
                          <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-200 px-2.5 py-1 text-xs font-medium text-amber-900">
                            <AlertTriangle className="h-3 w-3" aria-hidden />
                            {t('trips.overdue.badge')}
                          </span>
                        ) : null}
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
                            aria-label={t('trips.aria.cancel')}
                            onClick={() => openCancelDialog(trip)}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.lastPage > 1 ? (
              <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-text-muted">
                  {t('trips.pagination.showing', {
                    from: pagination.from,
                    to: pagination.to,
                    total: pagination.total,
                  })}
                </p>
                <nav
                  className="flex flex-wrap items-center gap-1"
                  aria-label={t('trips.pagination.label')}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    disabled={isFetching || pagination.currentPage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    {t('common.previous')}
                  </Button>
                  {visiblePages.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={pageNumber === pagination.currentPage ? 'primary' : 'outline'}
                      className="h-8 min-w-8 px-2 text-xs"
                      aria-current={
                        pageNumber === pagination.currentPage ? 'page' : undefined
                      }
                      disabled={isFetching}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    disabled={isFetching || pagination.currentPage >= pagination.lastPage}
                    onClick={() =>
                      setPage((current) => Math.min(pagination.lastPage, current + 1))
                    }
                  >
                    {t('common.next')}
                  </Button>
                </nav>
              </div>
            ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <CancelTripDialog
        open={cancelTripId != null}
        tripId={cancelTripId}
        tripLabel={cancelTripLabel}
        onClose={closeCancelDialog}
        onCancelled={() => {
          void reload()
        }}
      />
    </div>
  )
}
