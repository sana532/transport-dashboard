import { type ClipboardEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Clock3,
  ChevronDown,
  DollarSign,
  MapPin,
  Save,
  Sparkles,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { routesService } from '@/modules/routes/services/routesService'
import type { CompanyRoute } from '@/modules/routes/types'
import { routeDisplayName } from '@/modules/routes/utils/routeDisplay'
import { driversService } from '@/modules/drivers/services/driversService'
import { mapCompanyDriverToDriver } from '@/modules/drivers/utils/mapCompanyDriver'
import type { Driver } from '@/modules/drivers/types'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'
import { mapCompanyVehicleToVehicle } from '@/modules/vehicles/utils/mapCompanyVehicle'
import type { Vehicle } from '@/modules/vehicles/types'
import type { CompanyTripStatus } from '@/modules/trips/types/companyTrip'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import {
  applyCompanyTripToFormState,
  buildTripMutationPayload,
  combineDateTimeToIso,
  defaultArrivalFromDeparture,
  splitIsoToFormFields,
  type TripFormState,
} from '@/modules/trips/utils/buildTripFormPayload'
import { isArchivedTrip } from '@/modules/trips/services/tripsManagementService'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const emptyForm: TripFormState = {
  routeId: '',
  vehicleId: '',
  driverId: '',
  departureDate: '',
  departureTime: '',
  arrivalDate: '',
  arrivalTime: '',
  baseFare: '',
  availableSeats: '',
  status: 'scheduled',
}

function TripFormLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-surface-muted" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-surface-muted" />
      </div>
    </div>
  )
}

export function TripFormPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const { tripId } = useParams()
  const isEdit = Boolean(tripId)
  const editNumericId = tripId ? Number(tripId) : NaN

  const [routes, setRoutes] = useState<CompanyRoute[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [form, setForm] = useState<TripFormState>(emptyForm)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [initialStatus, setInitialStatus] = useState<CompanyTripStatus | null>(null)

  const selectedRoute = useMemo(
    () => routes.find((r) => String(r.id) === form.routeId) ?? null,
    [routes, form.routeId],
  )

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === form.vehicleId) ?? null,
    [vehicles, form.vehicleId],
  )

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === form.driverId) ?? null,
    [drivers, form.driverId],
  )

  const routeSummaryLabel = useMemo(() => {
    if (!selectedRoute) return ''
    return selectedRoute.name
  }, [selectedRoute])

  const loadCatalogs = useCallback(async () => {
    const [routeList, vehicleRows, driverRows] = await Promise.all([
      routesService.listRoutes(),
      vehiclesService.listVehicles(),
      driversService.listDrivers(),
    ])
    setRoutes(routeList)
    setVehicles(vehicleRows.map(mapCompanyVehicleToVehicle))
    setDrivers(driverRows.map(mapCompanyDriverToDriver))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setIsLoading(true)
      setLoadError(null)
      try {
        await loadCatalogs()
        if (cancelled) return

        if (isEdit && Number.isFinite(editNumericId)) {
          const trip = await companyTripsService.getTrip(editNumericId)
          if (cancelled) return
          setForm(applyCompanyTripToFormState(trip))
          setInitialStatus(trip.status)
          setShowAdvanced(true)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t('trips.errorUnavailable'))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [isEdit, editNumericId, loadCatalogs, t])

  useEffect(() => {
    if (!form.vehicleId || form.availableSeats) return
    const vehicle = vehicles.find((v) => String(v.id) === form.vehicleId)
    if (!vehicle) return
    setForm((prev) => ({ ...prev, availableSeats: String(vehicle.seats) }))
  }, [form.vehicleId, form.availableSeats, vehicles])

  useEffect(() => {
    if (!form.departureDate || !form.departureTime) return
    if (form.arrivalDate && form.arrivalTime) return
    const departureIso = combineDateTimeToIso(form.departureDate, form.departureTime)
    if (!departureIso) return
    const arrival = splitIsoToFormFields(defaultArrivalFromDeparture(departureIso))
    setForm((prev) => ({
      ...prev,
      arrivalDate: prev.arrivalDate || arrival.date,
      arrivalTime: prev.arrivalTime || arrival.time,
    }))
  }, [form.departureDate, form.departureTime, form.arrivalDate, form.arrivalTime])

  function sanitizeDecimalInput(value: string): string {
    const cleaned = value.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length <= 1) return cleaned
    return `${parts[0]}.${parts.slice(1).join('')}`
  }

  function handlePricePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text')
    if (!/^\d*\.?\d*$/.test(pasted.trim())) {
      e.preventDefault()
    }
  }

  function validateForm(): boolean {
    const nextErrors: Record<string, string> = {}

    if (!form.routeId) nextErrors.routeId = t('tripForm.error.routeRequired')
    if (!form.driverId) nextErrors.driverId = t('tripForm.error.driverRequired')
    if (!form.departureDate) nextErrors.departureDate = t('tripForm.error.departureDateRequired')
    if (!form.departureTime) nextErrors.departureTime = t('tripForm.error.departureTimeRequired')
    if (!form.vehicleId) nextErrors.vehicleId = t('tripForm.error.vehicleRequired')

    if (!form.baseFare) {
      nextErrors.baseFare = t('tripForm.error.ticketPriceRequired')
    } else if (Number(form.baseFare) <= 0) {
      nextErrors.baseFare = t('tripForm.error.ticketPricePositive')
    }

    if (!form.availableSeats) {
      nextErrors.availableSeats = t('tripForm.error.seatsRequired')
    } else if (!Number.isInteger(Number(form.availableSeats)) || Number(form.availableSeats) <= 0) {
      nextErrors.availableSeats = t('tripForm.error.seatsPositiveInteger')
    }

    if (!form.status) nextErrors.status = t('tripForm.error.statusRequired')

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSaveTrip() {
    if (!validateForm()) return
    const payload = buildTripMutationPayload(form)
    if (!payload) {
      setSaveError(t('tripForm.error.validation'))
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      if (isEdit && Number.isFinite(editNumericId)) {
        await companyTripsService.updateTrip(editNumericId, payload)

        if (form.status !== initialStatus) {
          await companyTripsService.updateTripStatus(editNumericId, { status: form.status })
        }

        const verified = await companyTripsService.getTrip(editNumericId)
        if (verified.status !== form.status) {
          setSaveError(t('tripForm.error.statusNotSaved'))
          return
        }

        if (isArchivedTrip(form.status)) {
          navigate(paths.company.tripArchive, {
            state: { archivedTripId: editNumericId, status: form.status },
          })
          return
        }
      } else {
        await companyTripsService.createTrip(payload)
      }
      navigate(paths.company.trips)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('tripForm.error.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <TripFormLoading />

  if (loadError) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-red-700" role="alert">
            {loadError}
          </p>
          <Button variant="outline" onClick={() => navigate(paths.company.trips)}>
            {t('tripForm.backToTrips')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {saveError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {saveError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-text-primary">
            {isEdit ? t('tripForm.editTitle') : t('tripForm.addTitle')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t('tripForm.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(paths.company.trips)}>
          <ArrowLeft className="h-4 w-4" />
          {t('tripForm.backToTrips')}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[28px]">
              <span className="rounded-md bg-brand-primary p-2 text-white">
                <MapPin className="h-4 w-4" />
              </span>
              {t('tripForm.quickSetupTitle')}
            </CardTitle>
            <p className="text-sm text-text-muted">{t('tripForm.quickSetupHint')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">{t('tripForm.routeTemplate')}</label>
              <select
                className={selectClass}
                value={form.routeId}
                onChange={(e) => setForm((prev) => ({ ...prev, routeId: e.target.value }))}
                required
              >
                <option value="">{t('tripForm.chooseRouteTemplate')}</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {routeDisplayName(route, locale)}
                  </option>
                ))}
              </select>
              {routes.length === 0 ? (
                <p className="text-xs text-text-muted">{t('tripForm.noRoutes')}</p>
              ) : null}
              {errors.routeId ? <p className="text-xs text-red-600">{errors.routeId}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">{t('tripForm.selectDriver')}</label>
              <select
                className={selectClass}
                value={form.driverId}
                onChange={(e) => setForm((prev) => ({ ...prev, driverId: e.target.value }))}
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative">
                <Input
                  label={t('tripForm.departureDate')}
                  type="date"
                  value={form.departureDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, departureDate: e.target.value }))}
                  error={errors.departureDate}
                  required
                />
                <Calendar className="pointer-events-none absolute end-3 top-9 h-4 w-4 text-text-muted" />
              </div>
              <div className="relative">
                <Input
                  label={t('tripForm.departureTime')}
                  type="time"
                  value={form.departureTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, departureTime: e.target.value }))}
                  error={errors.departureTime}
                  required
                />
                <Clock3 className="pointer-events-none absolute end-3 top-9 h-4 w-4 text-text-muted" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">{t('tripForm.selectVehicle')}</label>
                <select
                  className={selectClass}
                  value={form.vehicleId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      vehicleId: e.target.value,
                      availableSeats: '',
                    }))
                  }
                  required
                >
                  <option value="">{t('tripForm.chooseVehicle')}</option>
                  {vehicles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.plateNumber} ({item.seats} {t('tripForm.seats')})
                    </option>
                  ))}
                </select>
                {errors.vehicleId ? <p className="text-xs text-red-600">{errors.vehicleId}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">{t('tripForm.status')}</label>
                <select
                  className={selectClass}
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as CompanyTripStatus,
                    }))
                  }
                  required
                >
                  <option value="scheduled">{t('tripForm.statusScheduled')}</option>
                  <option value="active">{t('tripForm.statusActive')}</option>
                  <option value="completed">{t('tripForm.statusCompleted')}</option>
                  <option value="cancelled">{t('tripForm.statusCancelled')}</option>
                </select>
                {errors.status ? <p className="text-xs text-red-600">{errors.status}</p> : null}
                {isEdit ? (
                  <p className="text-xs text-text-muted">{t('tripForm.statusSaveHint')}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative">
                <Input
                  label={t('tripForm.baseFare')}
                  type="text"
                  inputMode="decimal"
                  value={form.baseFare}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, baseFare: sanitizeDecimalInput(e.target.value) }))
                  }
                  onPaste={handlePricePaste}
                  error={errors.baseFare}
                  required
                />
                <DollarSign className="pointer-events-none absolute start-2 top-9 h-4 w-4 text-text-muted" />
              </div>
              <Input
                label={t('tripForm.availableSeats')}
                type="number"
                min={1}
                value={form.availableSeats}
                onChange={(e) => setForm((prev) => ({ ...prev, availableSeats: e.target.value }))}
                error={errors.availableSeats}
                required
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
              {t('tripForm.advancedOptions')}
            </button>

            {showAdvanced ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label={t('tripForm.arrivalDate')}
                  type="date"
                  value={form.arrivalDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, arrivalDate: e.target.value }))}
                />
                <Input
                  label={t('tripForm.arrivalTime')}
                  type="time"
                  value={form.arrivalTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, arrivalTime: e.target.value }))}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid h-full gap-4 xl:[grid-template-rows:1.5fr_1fr]">
          <Card className="h-full border-none bg-gradient-to-r from-[#2F3E1F] to-[#243217] text-white">
            <CardHeader className="border-none pb-2">
              <CardTitle className="flex items-center gap-2 text-[22px] text-white">
                <Sparkles className="h-5 w-5" />
                {t('tripForm.autoSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-white/75">{t('tripForm.summary.route')}</dt>
                <dd className="text-end">{routeSummaryLabel || t('tripForm.notSet')}</dd>
                <dt className="text-white/75">{t('tripForm.summary.driver')}</dt>
                <dd className="text-end">{selectedDriver?.name ?? t('tripForm.notAssigned')}</dd>
                <dt className="text-white/75">{t('tripForm.summary.dateTime')}</dt>
                <dd className="text-end">
                  {form.departureDate || form.departureTime
                    ? `${form.departureDate || '--'} ${form.departureTime || '--'}`
                    : t('tripForm.notSet')}
                </dd>
                <dt className="text-white/75">{t('tripForm.summary.vehicle')}</dt>
                <dd className="text-end">
                  {selectedVehicle?.plateNumber ?? t('tripForm.notAssigned')}
                </dd>
                <dt className="text-white/75">{t('tripForm.summary.seats')}</dt>
                <dd className="text-end">{form.availableSeats || '--'}</dd>
                <dt className="text-white/75">{t('tripForm.summary.price')}</dt>
                <dd className="text-end">{form.baseFare ? form.baseFare : '—'}</dd>
                <dt className="text-white/75">{t('tripForm.summary.status')}</dt>
                <dd className="text-end">{t(`trips.tripStatus.${form.status}`)}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card className="flex h-full min-h-[190px] flex-col">
            <CardHeader>
              <CardTitle className="text-[22px]">{t('tripForm.actionsTitle')}</CardTitle>
              <p className="text-sm text-text-muted">{t('tripForm.actionsHint')}</p>
            </CardHeader>
            <CardContent className="mt-auto border-t border-surface-muted px-4 py-3">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  className="h-10 min-w-[120px] border-border bg-surface text-text-secondary"
                  onClick={() => navigate(paths.company.trips)}
                  disabled={isSaving}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="h-10 min-w-[140px] !bg-[var(--brand-primary)] !text-white shadow-md hover:!bg-[var(--brand-primary-dark)]"
                  onClick={() => void handleSaveTrip()}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? t('common.saving') : t('tripForm.saveTrip')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
