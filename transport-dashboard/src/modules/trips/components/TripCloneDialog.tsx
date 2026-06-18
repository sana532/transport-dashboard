import { useEffect, useId, useState } from 'react'
import { Calendar, Clock3, Copy, MapPin, X } from 'lucide-react'
import { driversService } from '@/modules/drivers/services/driversService'
import { mapCompanyDriverToDriver } from '@/modules/drivers/utils/mapCompanyDriver'
import type { Driver } from '@/modules/drivers/types'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'
import { mapCompanyVehicleToVehicle } from '@/modules/vehicles/utils/mapCompanyVehicle'
import type { Vehicle } from '@/modules/vehicles/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import {
  combineDateTimeToIso,
  splitIsoToFormFields,
} from '@/modules/trips/utils/buildTripFormPayload'
import { formatTripRouteLabel } from '@/modules/trips/utils/mapCompanyTrip'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

type TripCloneDialogProps = {
  open: boolean
  sourceTripId: number | null
  onClose: () => void
  onCloned?: (trip: CompanyTrip) => void
}

export function TripCloneDialog({
  open,
  sourceTripId,
  onClose,
  onCloned,
}: TripCloneDialogProps) {
  const { t, locale } = useTranslation()
  const titleId = useId()

  const [sourceTrip, setSourceTrip] = useState<CompanyTrip | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [departureDate, setDepartureDate] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [driverId, setDriverId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open || sourceTripId === null) return

    const tripId = sourceTripId
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError(null)
      setSaveError(null)
      setErrors({})

      try {
        const [trip, driverRows, vehicleRows] = await Promise.all([
          companyTripsService.getTrip(tripId),
          driversService.listDrivers(),
          vehiclesService.listVehicles(),
        ])
        if (cancelled) return

        const departure = splitIsoToFormFields(trip.departure_time)
        setSourceTrip(trip)
        setDrivers(driverRows.map(mapCompanyDriverToDriver))
        setVehicles(vehicleRows.map(mapCompanyVehicleToVehicle))
        setDepartureDate('')
        setDepartureTime(departure.time)
        setDriverId(String(trip.driver_id))
        setVehicleId(String(trip.vehicle_id))
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : t('trips.cloneDialog.error.loadFailed'),
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, sourceTripId, t])

  function resetAndClose() {
    setSourceTrip(null)
    setDepartureDate('')
    setDepartureTime('')
    setDriverId('')
    setVehicleId('')
    setLoadError(null)
    setSaveError(null)
    setErrors({})
    onClose()
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}
    if (!departureDate) nextErrors.departureDate = t('tripForm.error.departureDateRequired')
    if (!departureTime) nextErrors.departureTime = t('tripForm.error.departureTimeRequired')
    if (!driverId) nextErrors.driverId = t('tripForm.error.driverRequired')
    if (!vehicleId) nextErrors.vehicleId = t('tripForm.error.vehicleRequired')
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit() {
    if (!sourceTripId || !validate()) return

    const departure_time = combineDateTimeToIso(departureDate, departureTime)
    if (!departure_time) {
      setSaveError(t('tripForm.error.validation'))
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const cloned = await companyTripsService.cloneTrip(sourceTripId, {
        departure_time,
        vehicle_id: Number(vehicleId),
        driver_id: Number(driverId),
      })
      onCloned?.(cloned)
      resetAndClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('trips.cloneDialog.error.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const routeLabel = sourceTrip ? formatTripRouteLabel(sourceTrip, locale) : ''
  const sourceDeparture = sourceTrip
    ? splitIsoToFormFields(sourceTrip.departure_time)
    : { date: '', time: '' }

  return (
    <Modal open={open} onClose={resetAndClose} className="max-w-lg">
      <Card className="border-0 shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-surface-muted pb-4">
          <div className="min-w-0">
            <CardTitle id={titleId} className="flex items-center gap-2 text-xl">
              <span className="rounded-md bg-brand-primary p-2 text-white">
                <Copy className="h-4 w-4" aria-hidden />
              </span>
              {t('trips.cloneDialog.title')}
            </CardTitle>
            <p className="mt-1 text-sm text-text-muted">{t('trips.cloneDialog.subtitle')}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-9 shrink-0 px-0"
            onClick={resetAndClose}
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-surface-muted" />
          ) : loadError ? (
            <div className="space-y-3">
              <p className="text-sm text-red-700" role="alert">
                {loadError}
              </p>
              <Button variant="outline" onClick={resetAndClose}>
                {t('trips.cloneDialog.cancel')}
              </Button>
            </div>
          ) : sourceTrip ? (
            <>
              <div className="rounded-lg border border-surface-muted bg-background px-4 py-3 text-sm">
                <p className="font-medium text-text-primary">
                  {t('trips.cloneDialog.sourceTrip', { id: sourceTrip.id })}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-text-secondary">
                  <MapPin className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                  {routeLabel}
                </p>
                <p className="mt-1 text-text-muted">
                  {t('trips.cloneDialog.sourceDeparture', {
                    date: sourceDeparture.date,
                    time: sourceDeparture.time,
                  })}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Input
                    label={t('tripForm.departureDate')}
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    error={errors.departureDate}
                    required
                  />
                  <Calendar className="pointer-events-none absolute end-3 top-9 h-4 w-4 text-text-muted" />
                </div>
                <div className="relative">
                  <Input
                    label={t('tripForm.departureTime')}
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    error={errors.departureTime}
                    required
                  />
                  <Clock3 className="pointer-events-none absolute end-3 top-9 h-4 w-4 text-text-muted" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  {t('tripForm.selectDriver')}
                </label>
                <select
                  className={selectClass}
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  required
                >
                  <option value="">{t('tripForm.chooseDriver')}</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
                {errors.driverId ? <p className="text-xs text-red-600">{errors.driverId}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  {t('tripForm.selectVehicle')}
                </label>
                <select
                  className={selectClass}
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                >
                  <option value="">{t('tripForm.chooseVehicle')}</option>
                  {vehicles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.plateNumber} ({item.seats} {t('tripForm.seats')})
                    </option>
                  ))}
                </select>
                {errors.vehicleId ? (
                  <p className="text-xs text-red-600">{errors.vehicleId}</p>
                ) : null}
              </div>

              {saveError ? (
                <p className="text-sm text-red-700" role="alert">
                  {saveError}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={resetAndClose} disabled={isSaving}>
                  {t('trips.cloneDialog.cancel')}
                </Button>
                <Button type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
                  {isSaving ? t('common.saving') : t('trips.cloneDialog.submit')}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </Modal>
  )
}
