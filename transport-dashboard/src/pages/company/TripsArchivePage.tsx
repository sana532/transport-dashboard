import { useState } from 'react'
import { ArrowLeft, Archive, Copy, MapPin } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { CompanyTripStatus } from '@/modules/trips/types/companyTrip'
import type { TripsRecentRow } from '@/modules/trips/types'
import { TripCloneDialog } from '@/modules/trips/components/TripCloneDialog'
import { useTripsManagement } from '@/modules/trips/hooks/useTripsManagement'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'

function statusBadgeClass(status: TripsRecentRow['status']): string {
  if (status === 'completed') return 'bg-green-100 text-green-700'
  if (status === 'cancelled') return 'bg-red-100 text-red-700'
  return 'bg-blue-100 text-blue-700'
}

function TripsArchiveLoading() {
  return <div className="h-64 animate-pulse rounded-xl bg-surface-muted" />
}

type ArchiveRedirectState = {
  archivedTripId?: number
  status?: CompanyTripStatus
}

export function TripsArchivePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectState = (location.state as ArchiveRedirectState | null) ?? null
  const { data, isLoading, error, reload } = useTripsManagement()
  const rows = data?.archivedTrips ?? []
  const [cloneTripId, setCloneTripId] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-5">
        <TripsArchiveLoading />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-red-700">{error ?? t('trips.errorUnavailable')}</p>
          <Button onClick={() => void reload()}>{t('common.retry')}</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {redirectState?.archivedTripId ? (
        <div
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          {t('trips.archive.movedHere', {
            id: redirectState.archivedTripId,
            status: t(`trips.tripStatus.${redirectState.status ?? 'completed'}`),
          })}
        </div>
      ) : null}

      <div>
        <Link
          to={paths.company.trips}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {t('trips.archive.backToTrips')}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
              {t('trips.archive.title')}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('trips.archive.subtitle')}</p>
          </div>
        </div>
      </div>

      <Card className="border border-surface-muted shadow-md">
        <CardHeader className="flex flex-row items-start gap-3 border-b border-surface-muted pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand-primary">
            <Archive className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg">{t('trips.archive.infoTitle')}</CardTitle>
            <p className="mt-1 text-sm text-text-muted">{t('trips.archive.infoBody')}</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-text-muted">{t('trips.archive.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="app-table w-full min-w-[920px] text-left text-sm">
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
                        'trips.archive.col.clone',
                      ] as const
                    ).map((key) => (
                      <th key={key} className="px-4 py-3 font-medium">
                        {t(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((trip) => (
                    <tr key={trip.id} className="border-b border-surface-muted text-text-secondary">
                      <td className="px-4 py-3 font-medium text-text-primary">{trip.id}</td>
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
                        <Button
                          type="button"
                          variant="outline"
                          className="border-brand-primary/35 text-brand-primary"
                          onClick={() => setCloneTripId(trip.numericId)}
                        >
                          <Copy className="h-4 w-4" aria-hidden />
                          {t('trips.archive.clone')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <TripCloneDialog
        open={cloneTripId !== null}
        sourceTripId={cloneTripId}
        onClose={() => setCloneTripId(null)}
        onCloned={(trip) => {
          void reload()
          navigate(paths.company.tripDetails(String(trip.id)))
        }}
      />
    </div>
  )
}
