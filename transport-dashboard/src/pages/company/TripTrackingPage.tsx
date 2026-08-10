import { useMemo } from 'react'
import { ArrowLeft, MapPin, Radio, Wifi, WifiOff } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { TripTrackingMap } from '@/modules/trips/components/TripTrackingMap'
import { usePredictedTripLocation } from '@/modules/trips/hooks/usePredictedTripLocation'
import { useTripDetails } from '@/modules/trips/hooks/useTripDetails'
import { useTripLocationTracking } from '@/modules/trips/hooks/useTripLocationTracking'
import type {
  TripLocationMode,
  TripLocationUpdate,
} from '@/modules/trips/types/tripTracking'
import { formatTripRouteLabel } from '@/modules/trips/utils/mapCompanyTrip'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

function connectionBadgeClass(
  status: ReturnType<typeof useTripLocationTracking>['connectionStatus'],
): string {
  if (status === 'connected') return 'bg-green-100 text-green-700'
  if (status === 'connecting') return 'bg-amber-100 text-amber-800'
  if (status === 'disconnected') return 'bg-red-100 text-red-700'
  if (status === 'error' || status === 'unconfigured') return 'bg-red-100 text-red-700'
  return 'bg-surface-muted text-text-muted'
}

function freshnessBadgeClass(mode: TripLocationMode | null): string {
  if (mode === 'live') return 'bg-green-100 text-green-700'
  if (mode === 'estimated') return 'bg-amber-100 text-amber-800'
  if (mode === 'stale_frozen') return 'bg-orange-100 text-orange-800'
  return 'bg-surface-muted text-text-muted'
}

function ConnectionIcon({
  status,
}: {
  status: ReturnType<typeof useTripLocationTracking>['connectionStatus']
}) {
  if (status === 'connected' || status === 'connecting') {
    return <Wifi className="h-4 w-4" aria-hidden />
  }
  return <WifiOff className="h-4 w-4" aria-hidden />
}

function buildInitialLocation(
  tripId: number,
  latitude: number,
  longitude: number,
  timestamp?: string | null,
): TripLocationUpdate {
  return {
    trip_id: tripId,
    lat: latitude,
    lng: longitude,
    timestamp: timestamp ?? new Date().toISOString(),
  }
}

export function TripTrackingPage() {
  const { t, locale } = useTranslation()
  const { tripId } = useParams()
  const { trip, isLoading, error: tripError } = useTripDetails(tripId)
  const { location: liveLocation, connectionStatus, error: trackingError } =
    useTripLocationTracking(tripId)

  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'
  const routeLabel = trip ? formatTripRouteLabel(trip, locale) : '—'

  const savedLocation = useMemo(() => {
    if (!trip?.current_location) return null
    return buildInitialLocation(
      trip.id,
      trip.current_location.latitude,
      trip.current_location.longitude,
      trip.last_location_updated_at ?? trip.updated_at,
    )
  }, [trip])

  const realLocation = liveLocation ?? savedLocation
  const { displayLocation, locationMode, lastRealLocation } =
    usePredictedTripLocation(realLocation)

  const isLiveGps = locationMode === 'live' && liveLocation != null
  const isEstimated = locationMode === 'estimated'
  const isFrozen = locationMode === 'stale_frozen'

  const lastUpdateLabel =
    lastRealLocation?.timestamp != null
      ? new Date(lastRealLocation.timestamp).toLocaleString(dateLocale, {
          dateStyle: 'medium',
          timeStyle: 'medium',
        })
      : null

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={tripId ? paths.company.tripDetails(tripId) : paths.company.trips}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('tripTracking.backToDetails')}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
          {t('tripTracking.title')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {trip ? routeLabel : `${t('tripDetails.idLabel')}: ${tripId ?? '—'}`}
        </p>
        <p className="mt-1 font-mono text-xs text-text-muted">
          {t('tripDetails.idLabel')}: {tripId ?? '—'}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-primary" aria-hidden />
            {t('tripTracking.mapTitle')}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                connectionBadgeClass(connectionStatus),
              )}
            >
              <ConnectionIcon status={connectionStatus} />
              <Radio className="h-3.5 w-3.5" aria-hidden />
              {t(`tripTracking.connection.${connectionStatus}`)}
            </div>
            {locationMode ? (
              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                  freshnessBadgeClass(locationMode),
                )}
              >
                {t(`tripTracking.freshness.${locationMode}`)}
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(tripError || trackingError) && (
            <p className="text-sm text-red-700" role="alert">
              {tripError ?? trackingError}
            </p>
          )}

          {isLoading ? (
            <div className="h-[min(70vh,520px)] animate-pulse rounded-lg bg-surface-muted" />
          ) : (
            <>
              <TripTrackingMap
                location={displayLocation}
                isEstimated={isEstimated || isFrozen}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
                <p>
                  {displayLocation
                    ? t('tripTracking.coords', {
                        lat: displayLocation.lat.toFixed(5),
                        lng: displayLocation.lng.toFixed(5),
                      })
                    : t('tripTracking.waitingForLocation')}
                </p>
                {lastUpdateLabel ? (
                  <p>
                    {isLiveGps
                      ? t('tripTracking.lastUpdate', { time: lastUpdateLabel })
                      : t('tripTracking.lastKnownUpdate', { time: lastUpdateLabel })}
                  </p>
                ) : null}
              </div>
              {isEstimated ? (
                <p className="text-xs text-amber-800">{t('tripTracking.estimatedHint')}</p>
              ) : null}
              {isFrozen ? (
                <p className="text-xs text-amber-800">{t('tripTracking.frozenHint')}</p>
              ) : null}
              {!liveLocation && savedLocation && connectionStatus !== 'connected' && locationMode === 'live' ? (
                <p className="text-xs text-amber-800">{t('tripTracking.savedLocationHint')}</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Link to={tripId ? paths.company.tripDetails(tripId) : paths.company.trips}>
          <Button variant="outline">{t('tripTracking.backToDetails')}</Button>
        </Link>
      </div>
    </div>
  )
}
