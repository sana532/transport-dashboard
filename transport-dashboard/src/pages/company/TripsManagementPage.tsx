import { useMemo, useState } from 'react'
import {
  Archive,
  CircleGauge,
  Download,
  MapPin,
  Navigation,
  ClipboardList,
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
import {
  defaultTripListFilters,
  filterTrips,
  type TripListFilters,
} from '@/modules/trips/utils/filterTrips'
import { mapTripToRecentRow } from '@/modules/trips/services/tripsManagementService'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function statusBadgeClass(status: TripsRecentRow['status']): string {
  if (status === 'completed') return 'bg-green-100 text-green-700'
  if (status === 'cancelled') return 'bg-red-100 text-red-700'
  if (status === 'active') return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-800'
}

function statCardClass(variant: TripsStatVariant): string {
  if (variant === 'primary') return 'bg-[#2F3E1F] text-white border-[#2F3E1F]'
  if (variant === 'info') return 'border-l-4 border-l-blue-500'
  if (variant === 'success') return 'border-l-4 border-l-green-500'
  return 'border-l-4 border-l-red-500'
}

function TripsLoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-12 w-72 animate-pulse rounded-lg bg-surface-muted" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-36 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
      <div className="h-44 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-[420px] animate-pulse rounded-xl bg-surface-muted" />
    </div>
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

  const activeTrips = useMemo(() => {
    if (!data) return []
    return filterTrips(data.trips.filter((trip) => trip.status !== 'completed' && trip.status !== 'cancelled'), filters)
  }, [data, filters])

  const tableRows = useMemo(
    () => activeTrips.map((trip) => mapTripToRecentRow(trip, locale === 'ar' ? 'ar-SY' : 'en-US')),
    [activeTrips, locale],
  )

  const hasActiveFilters = filters.search.trim() !== '' || filters.status !== 'all'

  const handleResetFilters = () => setFilters(defaultTripListFilters)

  const handleDelete = async (row: TripsRecentRow) => {
    if (!window.confirm(t('trips.confirmDelete', { id: row.id }))) return
    try {
      await deleteTrip(row.numericId)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('tripForm.error.saveFailed'))
    }
  }

  if (isLoading) return <TripsLoadingState />
  if (error || !data) {
    return (
      <TripsErrorState
        message={error ?? t('trips.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight text-text-primary">{t('trips.title')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('trips.subtitle')}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:items-end">
          <Button
            type="button"
            onClick={() => navigate(paths.company.tripNew)}
            className="w-full bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[var(--brand-primary-dark)] focus-visible:ring-[var(--brand-primary)] sm:w-auto sm:min-w-[200px]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('trips.addNew')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(paths.company.tripArchive)}
            className="w-full border-brand-primary/35 bg-surface py-2.5 text-sm font-semibold text-brand-primary shadow-sm hover:bg-brand-primary/10 sm:w-auto sm:min-w-[200px]"
            aria-label={t('trips.archiveCtaAria')}
          >
            <Archive className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 text-left leading-snug">
              <span className="hidden sm:inline">{t('trips.archiveCta')}</span>
              <span className="sm:hidden">{t('trips.archiveCtaShort')}</span>
            </span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map(({ id, title, value, note, trend, Icon, variant }) => (
          <Card key={id} className={cn('shadow-md', statCardClass(variant))}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    'rounded-xl p-2',
                    variant === 'primary' ? 'bg-white/10' : 'bg-background',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      variant === 'primary' ? 'text-white' : 'text-brand-primary',
                    )}
                  />
                </div>
                <p
                  className={cn(
                    'text-sm',
                    variant === 'primary' ? 'text-white/90' : 'text-text-muted',
                  )}
                >
                  {title}
                </p>
              </div>

              <p
                className={cn(
                  'mt-3 text-4xl font-semibold leading-none',
                  variant === 'primary' ? 'text-white' : 'text-text-primary',
                )}
              >
                {value}
              </p>
              <p
                className={cn(
                  'mt-2 text-xs',
                  variant === 'primary' ? 'text-white/80' : 'text-text-muted',
                )}
              >
                {note}
              </p>
              <p className="mt-1 text-xs font-medium text-green-700">{trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-xl">
        <Input
          name="trip-search-header"
          placeholder={t('trips.searchPlaceholder')}
          aria-label={t('trips.searchLabel')}
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
        />
      </div>

      <Card className="shadow-md">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="trip-status-filter" className="text-sm font-medium text-text-secondary">
                {t('trips.status')}
              </label>
              <select
                id="trip-status-filter"
                className={selectClass}
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value as TripListFilters['status'],
                  }))
                }
              >
                <option value="all">{t('trips.allStatus')}</option>
                <option value="scheduled">{t('trips.tripStatus.scheduled')}</option>
                <option value="active">{t('trips.tripStatus.active')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="border-border"
            >
              {t('common.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">{t('trips.recentTitle')}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-text-muted">
              <Download className="h-4 w-4" />
              {t('common.export')}
            </Button>
            <Button variant="ghost" className="text-text-muted">
              <CircleGauge className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.trips.length === 0 ? (
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
                {t('common.reset')}
              </Button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-y border-surface-muted bg-background text-text-muted">
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
                    className="border-b border-surface-muted text-text-secondary"
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
