import { type ClipboardEvent, useEffect, useMemo, useRef, useState } from 'react'
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
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { routeDisplayName } from '@/modules/routes/utils/routeDisplay'
import type { CompanyTripStatus } from '@/modules/trips/types/companyTrip'
import {
  applyCompanyTripToFormState,
  arrivalFromDepartureAndDuration,
  buildTripMutationPayload,
  combineDateTimeToIso,
  splitIsoToFormFields,
  type TripFormState,
} from '@/modules/trips/utils/buildTripFormPayload'
import { CancelTripDialog } from '@/modules/trips/components/CancelTripDialog'
import { TripResourceSelect } from '@/modules/trips/components/TripResourceSelect'
import { useSaveTrip, useTripFormCatalog, useTripFormTrip } from '@/modules/trips/hooks/useTripForm'
import { useTripResourceAvailability } from '@/modules/trips/hooks/useTripResourceAvailability'
import { availabilityReasonLabel } from '@/modules/trips/utils/mapResourceAvailability'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted'

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

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  const queryClient = useQueryClient()
  const { tripId } = useParams()
  const isEdit = Boolean(tripId)
  const editNumericId = tripId ? Number(tripId) : NaN
  const editTripId = isEdit && Number.isFinite(editNumericId) ? editNumericId : null

  const {
    routes,
    vehicles,
    drivers,
    isLoading: isCatalogLoading,
    error: catalogError,
  } = useTripFormCatalog()
  const {
    trip: loadedTrip,
    bookedCount,
    isLoading: isTripLoading,
    error: tripError,
  } = useTripFormTrip(editTripId)
  const saveTrip = useSaveTrip()

  const [form, setForm] = useState<TripFormState>(emptyForm)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [initialStatus, setInitialStatus] = useState<CompanyTripStatus | null>(null)
  const [lockedRouteId, setLockedRouteId] = useState<string | null>(null)
  const [lockedBaseFare, setLockedBaseFare] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const appliedTripIdRef = useRef<number | null>(null)

  const isLoading = isCatalogLoading || isTripLoading
  const loadError = catalogError ?? tripError
  const isSaving = saveTrip.isPending
  const hasBookings = isEdit && bookedCount > 0

  const selectedRoute = useMemo(
    () => routes.find((r) => String(r.id) === form.routeId) ?? null,
    [routes, form.routeId],
  )

  const {
    availability,
    isQueryReady: isAvailabilityQueryReady,
    isLoading: isAvailabilityLoading,
    error: availabilityError,
  } = useTripResourceAvailability({
    routeId: form.routeId,
    departureDate: form.departureDate,
    departureTime: form.departureTime,
    arrivalDate: form.arrivalDate,
    arrivalTime: form.arrivalTime,
    excludeTripId: isEdit && Number.isFinite(editNumericId) ? editNumericId : null,
  })

  const selectedAvailabilityDriver = useMemo(() => {
    if (!form.driverId || !availability) return null
    const id = Number(form.driverId)
    return (
      availability.drivers.available.find((row) => row.id === id) ??
      availability.drivers.unavailable.find((row) => row.id === id) ??
      null
    )
  }, [availability, form.driverId])

  const selectedAvailabilityVehicle = useMemo(() => {
    if (!form.vehicleId || !availability) return null
    const id = Number(form.vehicleId)
    return (
      availability.vehicles.available.find((row) => row.id === id) ??
      availability.vehicles.unavailable.find((row) => row.id === id) ??
      null
    )
  }, [availability, form.vehicleId])

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === form.vehicleId) ?? null,
    [vehicles, form.vehicleId],
  )

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === form.driverId) ?? null,
    [drivers, form.driverId],
  )

  const selectedDriverName =
    selectedAvailabilityDriver?.name ?? selectedDriver?.name ?? null
  const selectedVehiclePlate =
    selectedAvailabilityVehicle?.plate_number ?? selectedVehicle?.plateNumber ?? null
  const selectedVehicleSeats =
    selectedAvailabilityVehicle?.seat_count ?? selectedVehicle?.seats ?? 0

  const driverOptions = useMemo(() => {
    if (availability) {
      return {
        available: availability.drivers.available.map((row) => ({
          id: String(row.id),
          label: row.name,
        })),
        unavailable: availability.drivers.unavailable.map((row) => ({
          id: String(row.id),
          label: row.name,
          hint: row.message || availabilityReasonLabel(row.reasons, t),
        })),
      }
    }
    return {
      available: drivers.map((driver) => ({ id: driver.id, label: driver.name })),
      unavailable: [],
    }
  }, [availability, drivers, t])

  const vehicleOptions = useMemo(() => {
    if (availability) {
      return {
        available: availability.vehicles.available.map((row) => ({
          id: String(row.id),
          label: `${row.plate_number} (${row.seat_count} ${t('tripForm.seats')})`,
        })),
        unavailable: availability.vehicles.unavailable.map((row) => ({
          id: String(row.id),
          label: `${row.plate_number} (${row.seat_count} ${t('tripForm.seats')})`,
          hint: row.message || availabilityReasonLabel(row.reasons, t),
        })),
      }
    }
    return {
      available: vehicles.map((item) => ({
        id: item.id,
        label: `${item.plateNumber} (${item.seats} ${t('tripForm.seats')})`,
      })),
      unavailable: [],
    }
  }, [availability, t, vehicles])

  const resourceSelectDisabled = !isAvailabilityQueryReady || isAvailabilityLoading
  const driverSelectHint = !isAvailabilityQueryReady
    ? t('tripForm.availability.waitHint')
    : availabilityError
      ? `${t('tripForm.availability.failed')} ${availabilityError}`
      : availability
        ? t('tripForm.availability.counts', {
            available: availability.drivers.counts.available,
            unavailable: availability.drivers.counts.unavailable,
          })
        : undefined
  const vehicleSelectHint = !isAvailabilityQueryReady
    ? t('tripForm.availability.waitHint')
    : availabilityError
      ? `${t('tripForm.availability.failed')} ${availabilityError}`
      : availability
        ? t('tripForm.availability.counts', {
            available: availability.vehicles.counts.available,
            unavailable: availability.vehicles.counts.unavailable,
          })
        : undefined

  const routeSummaryLabel = useMemo(() => {
    if (!selectedRoute) return ''
    return selectedRoute.name
  }, [selectedRoute])

  useEffect(() => {
    if (!isEdit) {
      appliedTripIdRef.current = null
      setForm(emptyForm)
      setInitialStatus(null)
      setLockedRouteId(null)
      setLockedBaseFare(null)
      setShowAdvanced(false)
      return
    }
    if (!loadedTrip) return
    if (appliedTripIdRef.current === loadedTrip.id) return

    appliedTripIdRef.current = loadedTrip.id
    const formState = applyCompanyTripToFormState(loadedTrip)
    setForm(formState)
    setInitialStatus(loadedTrip.status)
    setLockedRouteId(formState.routeId)
    setLockedBaseFare(formState.baseFare)
    setShowAdvanced(true)
  }, [isEdit, loadedTrip])

  useEffect(() => {
    if (hasBookings) return
    if (!selectedRoute) return
    const fare = selectedRoute.base_fare
    if (fare == null || !Number.isFinite(fare) || fare <= 0) return
    const nextFare = String(fare)
    setForm((prev) => (prev.baseFare === nextFare ? prev : { ...prev, baseFare: nextFare }))
  }, [hasBookings, selectedRoute])

  useEffect(() => {
    if (!availability) return
    setForm((prev) => {
      const driverId = Number(prev.driverId)
      const vehicleId = Number(prev.vehicleId)
      const driverOk =
        !prev.driverId || availability.drivers.available_ids.includes(driverId)
      const vehicleOk =
        !prev.vehicleId || availability.vehicles.available_ids.includes(vehicleId)
      if (driverOk && vehicleOk) return prev
      return {
        ...prev,
        driverId: driverOk ? prev.driverId : '',
        vehicleId: vehicleOk ? prev.vehicleId : '',
        availableSeats: vehicleOk ? prev.availableSeats : '',
      }
    })
  }, [availability])

  useEffect(() => {
    if (selectedVehicleSeats <= 0) return
    const nextSeats = String(selectedVehicleSeats)
    setForm((prev) =>
      prev.availableSeats === nextSeats ? prev : { ...prev, availableSeats: nextSeats },
    )
  }, [selectedVehicleSeats])

  useEffect(() => {
    if (!form.departureTime) return
    const departureDate = form.departureDate || toDateInputValue(new Date())
    const departureIso = combineDateTimeToIso(departureDate, form.departureTime)
    if (!departureIso) return
    const arrival = splitIsoToFormFields(
      arrivalFromDepartureAndDuration(departureIso, selectedRoute?.estimated_duration_hhmm),
    )
    setForm((prev) => {
      const nextDate = prev.departureDate || departureDate
      if (
        prev.departureDate === nextDate &&
        prev.arrivalDate === arrival.date &&
        prev.arrivalTime === arrival.time
      ) {
        return prev
      }
      return {
        ...prev,
        departureDate: nextDate,
        arrivalDate: arrival.date,
        arrivalTime: arrival.time,
      }
    })
  }, [form.departureDate, form.departureTime, selectedRoute?.estimated_duration_hhmm])

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

    if (availability) {
      const driverId = Number(form.driverId)
      const vehicleId = Number(form.vehicleId)
      if (form.driverId && !availability.drivers.available_ids.includes(driverId)) {
        const unavailable = availability.drivers.unavailable.find((row) => row.id === driverId)
        nextErrors.driverId = unavailable?.message || t('tripForm.error.driverUnavailable')
      }
      if (form.vehicleId && !availability.vehicles.available_ids.includes(vehicleId)) {
        const unavailable = availability.vehicles.unavailable.find((row) => row.id === vehicleId)
        nextErrors.vehicleId = unavailable?.message || t('tripForm.error.vehicleUnavailable')
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSaveTrip() {
    if (!validateForm()) return

    if (
      hasBookings &&
      lockedRouteId != null &&
      lockedBaseFare != null &&
      (form.routeId !== lockedRouteId || form.baseFare !== lockedBaseFare)
    ) {
      setSaveError(t('tripForm.error.lockedFieldsChanged', { count: bookedCount }))
      return
    }

    const payload = buildTripMutationPayload(form)
    if (!payload) {
      setSaveError(t('tripForm.error.validation'))
      return
    }

    setSaveError(null)
    try {
      await saveTrip.mutateAsync({
        isEdit,
        tripId: editTripId,
        payload,
        status: form.status,
        initialStatus,
      })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('tripForm.error.saveFailed'))
    }
  }

  function handleStatusChange(next: CompanyTripStatus) {
    if (next === 'cancelled' && isEdit && Number.isFinite(editNumericId)) {
      setCancelDialogOpen(true)
      return
    }
    setForm((prev) => ({ ...prev, status: next }))
  }

  function handleTripRemoved() {
    setCancelDialogOpen(false)
    void queryClient.invalidateQueries({ queryKey: ['trips'] })
    navigate(paths.company.trips)
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

      {hasBookings ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          {t('tripForm.bookingsLockNotice', { count: bookedCount })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-[var(--title-h1)]">
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
                disabled={hasBookings}
                title={hasBookings ? t('tripForm.bookingsLockFieldHint') : undefined}
              >
                <option value="">{t('tripForm.chooseRouteTemplate')}</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {routeDisplayName(route, locale)}
                  </option>
                ))}
              </select>
              {hasBookings ? (
                <p className="text-xs text-amber-800">{t('tripForm.bookingsLockFieldHint')}</p>
              ) : null}
              {routes.length === 0 ? (
                <p className="text-xs text-text-muted">{t('tripForm.noRoutes')}</p>
              ) : null}
              {errors.routeId ? <p className="text-xs text-red-600">{errors.routeId}</p> : null}
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

            <TripResourceSelect
              label={t('tripForm.selectDriver')}
              value={form.driverId}
              onChange={(driverId) => setForm((prev) => ({ ...prev, driverId }))}
              placeholder={t('tripForm.chooseDriver')}
              available={driverOptions.available}
              unavailable={driverOptions.unavailable}
              disabled={resourceSelectDisabled}
              loading={isAvailabilityLoading}
              hint={driverSelectHint}
              error={errors.driverId}
              emptyAvailableHint={
                availability ? t('tripForm.availability.noDrivers') : undefined
              }
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <TripResourceSelect
                label={t('tripForm.selectVehicle')}
                value={form.vehicleId}
                onChange={(vehicleId) =>
                  setForm((prev) => ({
                    ...prev,
                    vehicleId,
                    availableSeats: '',
                  }))
                }
                placeholder={t('tripForm.chooseVehicle')}
                available={vehicleOptions.available}
                unavailable={vehicleOptions.unavailable}
                disabled={resourceSelectDisabled}
                loading={isAvailabilityLoading}
                hint={vehicleSelectHint}
                error={errors.vehicleId}
                emptyAvailableHint={
                  availability ? t('tripForm.availability.noVehicles') : undefined
                }
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">{t('tripForm.status')}</label>
                <select
                  className={selectClass}
                  value={form.status}
                  onChange={(e) => handleStatusChange(e.target.value as CompanyTripStatus)}
                  required
                >
                  <option value="scheduled">{t('tripForm.statusScheduled')}</option>
                  <option value="active">{t('tripForm.statusActive')}</option>
                  {isEdit ? (
                    <option value="interrupted">{t('trips.tripStatus.interrupted')}</option>
                  ) : null}
                  <option value="completed">{t('tripForm.statusCompleted')}</option>
                  {isEdit ? (
                    <option value="cancelled">{t('tripForm.statusCancelled')}</option>
                  ) : null}
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
                  hint={hasBookings ? t('tripForm.bookingsLockFieldHint') : undefined}
                  required
                  disabled={hasBookings}
                  title={hasBookings ? t('tripForm.bookingsLockFieldHint') : undefined}
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
              <CardTitle className="flex items-center gap-2 text-[22px] !text-white">
                <Sparkles className="h-5 w-5 text-white" />
                {t('tripForm.autoSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-white/75">{t('tripForm.summary.route')}</dt>
                <dd className="text-end">{routeSummaryLabel || t('tripForm.notSet')}</dd>
                <dt className="text-white/75">{t('tripForm.summary.driver')}</dt>
                <dd className="text-end">{selectedDriverName ?? t('tripForm.notAssigned')}</dd>
                <dt className="text-white/75">{t('tripForm.summary.dateTime')}</dt>
                <dd className="text-end">
                  {form.departureDate || form.departureTime
                    ? `${form.departureDate || '--'} ${form.departureTime || '--'}`
                    : t('tripForm.notSet')}
                </dd>
                <dt className="text-white/75">{t('tripForm.summary.vehicle')}</dt>
                <dd className="text-end">
                  {selectedVehiclePlate ?? t('tripForm.notAssigned')}
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
                  disabled={isSaving || isAvailabilityLoading}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? t('common.saving') : t('tripForm.saveTrip')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isEdit && Number.isFinite(editNumericId) ? (
        <CancelTripDialog
          open={cancelDialogOpen}
          tripId={editNumericId}
          tripLabel={
            selectedRoute
              ? `${routeDisplayName(selectedRoute, locale)} · #${editNumericId}`
              : `#${editNumericId}`
          }
          onClose={() => setCancelDialogOpen(false)}
          onRemoved={handleTripRemoved}
        />
      ) : null}
    </div>
  )
}
