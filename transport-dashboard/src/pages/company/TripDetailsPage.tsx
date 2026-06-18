import { ArrowLeft, Bus, Calendar, MapPin } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { TripBookingsTable } from '@/modules/trips/components/TripBookingsTable'
import { TripCrewSummary } from '@/modules/trips/components/TripCrewSummary'
import { TripSeatMap } from '@/modules/trips/components/TripSeatMap'
import { useTripDetails } from '@/modules/trips/hooks/useTripDetails'
import {
  formatTripDateTime,
  formatTripRouteLabel,
} from '@/modules/trips/utils/mapCompanyTrip'
import type { CompanyTripStatus } from '@/modules/trips/types/companyTrip'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

type TripTab = 'overview' | 'bookings'

function tripStatusBadgeClass(status: CompanyTripStatus): string {
  if (status === 'completed') return 'bg-green-100 text-green-700'
  if (status === 'cancelled') return 'bg-red-100 text-red-700'
  if (status === 'active') return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-800'
}

function OverviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  )
}

function TripDetailsLoading() {
  return (
    <div className="space-y-5">
      <div className="h-16 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-10 w-64 animate-pulse rounded-lg bg-surface-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
      </div>
    </div>
  )
}

export function TripDetailsPage() {
  const { t, locale } = useTranslation()
  const { tripId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { trip, bookings, isLoading, error, reload } = useTripDetails(tripId)

  const tab: TripTab = searchParams.get('tab') === 'bookings' ? 'bookings' : 'overview'
  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'

  const setTab = (next: TripTab) => {
    if (next === 'overview') {
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ tab: next }, { replace: true })
    }
  }

  if (isLoading) return <TripDetailsLoading />

  if (error || !trip) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-red-700" role="alert">
            {error ?? t('tripDetails.notFound')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void reload()}
              className="bg-brand-primary text-white hover:bg-brand-primary-dark"
            >
              {t('common.retry')}
            </Button>
            <Link to={paths.company.trips}>
              <Button variant="outline">{t('tripDetails.backToTrips')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const routeLabel = formatTripRouteLabel(trip, locale)
  const driverName = trip.driver?.name ?? `#${trip.driver_id}`
  const vehicleLabel = trip.vehicle?.plate_number ?? trip.vehicle?.name ?? `#${trip.vehicle_id}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={paths.company.trips}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('tripDetails.backToTrips')}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {t('tripDetails.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {routeLabel} · {t('tripDetails.idLabel')} {trip.id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              tripStatusBadgeClass(trip.status),
            )}
          >
            {t(`trips.tripStatus.${trip.status}`)}
          </span>
          {tripId ? (
            <Link to={paths.company.tripTracking(tripId)}>
              <Button variant="outline" type="button">
                <MapPin className="h-4 w-4" aria-hidden />
                {t('trips.actions.track')}
              </Button>
            </Link>
          ) : null}
          <Link to={paths.company.tripEdit(String(trip.id))}>
            <Button variant="outline">{t('tripDetails.editTrip')}</Button>
          </Link>
        </div>
      </div>

      <div
        className="inline-flex rounded-lg border border-surface-muted bg-surface p-1"
        role="tablist"
        aria-label={t('tripDetails.tabsLabel')}
      >
        {(['overview', 'bookings'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              tab === key
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-text-secondary hover:bg-surface-muted',
            )}
            onClick={() => setTab(key)}
          >
            {key === 'overview' ? t('tripDetails.tab.overview') : t('tripDetails.tab.bookings')}
            {key === 'bookings' ? (
              <span className="ms-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {bookings.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-brand-primary" aria-hidden />
                  {t('tripDetails.section.route')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <OverviewField label={t('trips.col.route')} value={routeLabel} />
                <OverviewField
                  label={t('tripDetails.field.baseFare')}
                  value={trip.base_fare.toLocaleString(dateLocale)}
                />
                <OverviewField
                  label={t('tripDetails.field.availableSeats')}
                  value={String(trip.stats?.available_seats ?? trip.available_seats)}
                />
                <OverviewField label={t('trips.col.status')} value={t(`trips.tripStatus.${trip.status}`)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-brand-primary" aria-hidden />
                  {t('tripDetails.section.schedule')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <OverviewField
                  label={t('tripDetails.field.departure')}
                  value={formatTripDateTime(trip.departure_time, dateLocale)}
                />
                <OverviewField
                  label={t('tripDetails.field.arrival')}
                  value={formatTripDateTime(trip.estimated_arrival_time, dateLocale)}
                />
              </CardContent>
            </Card>
          </div>

          <TripCrewSummary
            title={t('tripDetails.section.crew')}
            driverLabel={t('trips.col.driver')}
            driverName={driverName}
            vehicleLabel={t('trips.col.vehicle')}
            vehicleName={vehicleLabel}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bus className="h-5 w-5 text-brand-primary" aria-hidden />
                {t('tripDetails.seatAvailability')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TripSeatMap
                vehicleLayout={trip.vehicle_layout}
                seatMap={trip.seat_map}
                stats={trip.stats}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('tripDetails.seatAvailability')}</CardTitle>
            </CardHeader>
            <CardContent>
              <TripSeatMap
                vehicleLayout={trip.vehicle_layout}
                seatMap={trip.seat_map}
                stats={trip.stats}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-surface-muted">
              <CardTitle className="text-lg">
                {t('tripDetails.bookingsTitle')}
                <span className="ms-2 text-sm font-normal text-text-muted">
                  ({bookings.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-0">
              <TripBookingsTable bookings={bookings} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
