import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CompanyRoute } from '@/modules/routes/types'
import { routesService } from '@/modules/routes/services/routesService'
import { routeDisplayName } from '@/modules/routes/utils/routeDisplay'
import type { Driver } from '@/modules/drivers/types'
import { driversService } from '@/modules/drivers/services/driversService'
import { mapCompanyDriverToDriver } from '@/modules/drivers/utils/mapCompanyDriver'
import type { Vehicle } from '@/modules/vehicles/types'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'
import { mapCompanyVehicleToVehicle } from '@/modules/vehicles/utils/mapCompanyVehicle'
import type { CompanyTripTemplate } from '@/modules/trip-templates/types'
import { WEEKDAY_INDICES } from '@/modules/trip-templates/types'
import { useTripTemplatesManagement } from '@/modules/trip-templates/hooks/useTripTemplatesManagement'
import { formatDaysOfWeekLabel } from '@/modules/trip-templates/utils/mapCompanyTripTemplate'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { cn } from '@/shared/utils/cn'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

type ScheduleFormRow = {
  time: string
  vehicle_id: string
  driver_id: string
}

type TemplateFormState = {
  name: string
  route_id: string
  days_of_week: number[]
  schedule: ScheduleFormRow[]
  base_price: string
  is_active: boolean
}

function emptyScheduleRow(): ScheduleFormRow {
  return { time: '', vehicle_id: '', driver_id: '' }
}

const emptyForm: TemplateFormState = {
  name: '',
  route_id: '',
  days_of_week: [],
  schedule: [emptyScheduleRow()],
  base_price: '',
  is_active: true,
}

const ALL_WEEKDAYS = [...WEEKDAY_INDICES]

function formFromTemplate(template: CompanyTripTemplate): TemplateFormState {
  return {
    name: template.name,
    route_id: String(template.routeId),
    days_of_week: [...template.daysOfWeek],
    schedule:
      template.schedule.length > 0
        ? template.schedule.map((slot) => ({
            time: slot.time.slice(0, 5),
            vehicle_id: String(slot.vehicleId),
            driver_id: slot.driverId != null ? String(slot.driverId) : '',
          }))
        : [emptyScheduleRow()],
    base_price: template.basePrice != null ? String(template.basePrice) : '',
    is_active: template.isActive,
  }
}

function SchedulesLoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-surface-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-surface-muted" />
    </div>
  )
}

function SchedulesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm text-red-700" role="alert">
          {message}
        </p>
        <Button onClick={onRetry} className="bg-brand-primary text-white hover:bg-brand-primary-dark">
          {t('common.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function TripSchedulesPage() {
  const { t, locale } = useTranslation()
  const {
    templates,
    isLoading,
    error,
    reload,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTripTemplatesManagement()

  const [routes, setRoutes] = useState<CompanyRoute[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [catalogsLoading, setCatalogsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<TemplateFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const isEditing = editingId !== null

  const loadCatalogs = useCallback(async () => {
    setCatalogsLoading(true)
    try {
      const [routeList, vehicleRows, driverRows] = await Promise.all([
        routesService.listRoutes(),
        vehiclesService.listVehicles(),
        driversService.listDrivers(),
      ])
      setRoutes(routeList)
      setVehicles(vehicleRows.map(mapCompanyVehicleToVehicle))
      setDrivers(driverRows.map(mapCompanyDriverToDriver))
    } catch {
      setRoutes([])
      setVehicles([])
      setDrivers([])
    } finally {
      setCatalogsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalogs()
  }, [loadCatalogs])

  const openAddDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (row: CompanyTripTemplate) => {
    setEditingId(row.id)
    setForm(formFromTemplate(row))
    setFormError(null)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  const toggleDay = (day: number) => {
    setForm((prev) => {
      const has = prev.days_of_week.includes(day)
      const days_of_week = has
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b)
      return { ...prev, days_of_week }
    })
  }

  const allDaysSelected = ALL_WEEKDAYS.every((day) => form.days_of_week.includes(day))

  const toggleAllDays = () => {
    setForm((prev) => ({
      ...prev,
      days_of_week: allDaysSelected ? [] : [...ALL_WEEKDAYS],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const name = form.name.trim()
    const route_id = Number(form.route_id)
    if (!name || !route_id) {
      setFormError(t('tripTemplates.form.validation'))
      return
    }
    if (form.days_of_week.length === 0) {
      setFormError(t('tripTemplates.form.daysRequired'))
      return
    }

    const schedule = form.schedule
      .map((row) => {
        const time = row.time.trim()
        const vehicle_id = Number(row.vehicle_id)
        if (!time || !vehicle_id) return null
        const driver_id = row.driver_id.trim() ? Number(row.driver_id) : null
        return { time, vehicle_id, driver_id }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    if (schedule.length === 0) {
      setFormError(t('tripTemplates.form.scheduleRequired'))
      return
    }

    const basePriceRaw = form.base_price.trim()
    let base_price: number | undefined
    if (basePriceRaw) {
      base_price = Number(basePriceRaw)
      if (!Number.isFinite(base_price) || base_price < 0) {
        setFormError(t('tripTemplates.form.invalidBasePrice'))
        return
      }
    }

    const payload = {
      route_id,
      name,
      days_of_week: form.days_of_week,
      schedule,
      is_active: form.is_active,
      ...(base_price != null ? { base_price } : {}),
    }

    setPending(true)
    try {
      if (isEditing && editingId !== null) {
        await updateTemplate(editingId, payload)
      } else {
        await createTemplate(payload)
      }
      closeDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('tripTemplates.form.saveFailed'))
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async (row: CompanyTripTemplate) => {
    if (!window.confirm(t('tripTemplates.confirmDelete', { name: row.name }))) return
    try {
      await deleteTemplate(row.id)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('tripTemplates.form.saveFailed'))
    }
  }

  const vehicleLabel = (vehicleId: number) => {
    const vehicle = vehicles.find((v) => Number(v.id) === vehicleId)
    if (!vehicle) return `#${vehicleId}`
    return `${vehicle.plateNumber} (${vehicle.seats} ${t('tripForm.seats')})`
  }

  const driverLabel = (driverId: number | null) => {
    if (driverId == null) return t('tripTemplates.noDriver')
    const driver = drivers.find((d) => Number(d.id) === driverId)
    return driver?.name ?? `#${driverId}`
  }

  if (isLoading || catalogsLoading) return <SchedulesLoadingState />
  if (error) return <SchedulesErrorState message={error} onRetry={() => void reload()} />

  return (
    <div className="space-y-5">
      <Modal open={dialogOpen} onClose={closeDialog} className="max-w-2xl p-0">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-surface-muted px-6 py-4">
            <h2 className="section-title text-lg font-semibold text-[var(--title-h2)]">
              {isEditing ? t('tripTemplates.modal.editTitle') : t('tripTemplates.modal.addTitle')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{t('tripTemplates.modal.hint')}</p>
          </div>

          <div className="grid gap-4 p-6">
            <Input
              name="template-name"
              label={t('tripTemplates.form.name')}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('tripTemplates.form.namePlaceholder')}
              required
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {t('tripTemplates.form.route')}
              </label>
              <select
                className={selectClass}
                value={form.route_id}
                onChange={(e) => setForm((prev) => ({ ...prev, route_id: e.target.value }))}
                required
              >
                <option value="">{t('tripTemplates.form.chooseRoute')}</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {routeDisplayName(route, locale)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-text-primary">
                {t('tripTemplates.form.days')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleAllDays}
                  aria-pressed={allDaysSelected}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                    allDaysSelected
                      ? 'border-[#2F3E1F] bg-[#2F3E1F] text-white shadow-sm'
                      : 'border-border bg-surface text-text-muted hover:border-[#2F3E1F]/50 hover:text-[#2F3E1F]',
                  )}
                >
                  {t('tripTemplates.form.selectAllDays')}
                </button>
                {WEEKDAY_INDICES.map((day) => {
                  const active = form.days_of_week.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                        active
                          ? 'border-[#2F3E1F] bg-[#2F3E1F] text-white shadow-sm'
                          : 'border-border bg-surface text-text-muted hover:border-[#2F3E1F]/50 hover:text-[#2F3E1F]',
                      )}
                    >
                      {t(`tripTemplates.day.${day}`)}
                    </button>
                  )
                })}
              </div>
              {form.days_of_week.length === 0 ? (
                <p className="mt-2 text-xs text-text-muted">{t('tripTemplates.form.daysHint')}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-text-primary">
                {t('tripTemplates.form.schedule')}
              </p>
              <ul className="space-y-3">
                {form.schedule.map((row, index) => (
                  <li
                    key={index}
                    className="grid gap-3 rounded-lg border border-surface-muted bg-background p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_auto]"
                  >
                    <Input
                      name={`time_${index}`}
                      label={t('tripTemplates.form.departureTime')}
                      type="time"
                      value={row.time}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          schedule: prev.schedule.map((s, i) =>
                            i === index ? { ...s, time: e.target.value } : s,
                          ),
                        }))
                      }
                      required
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text-primary">
                        {t('tripTemplates.form.vehicle')}
                      </label>
                      <select
                        className={selectClass}
                        value={row.vehicle_id}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            schedule: prev.schedule.map((s, i) =>
                              i === index ? { ...s, vehicle_id: e.target.value } : s,
                            ),
                          }))
                        }
                        required
                      >
                        <option value="">{t('tripTemplates.form.chooseVehicle')}</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.plateNumber} ({vehicle.seats} {t('tripForm.seats')})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text-primary">
                        {t('tripTemplates.form.driver')}
                      </label>
                      <select
                        className={selectClass}
                        value={row.driver_id}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            schedule: prev.schedule.map((s, i) =>
                              i === index ? { ...s, driver_id: e.target.value } : s,
                            ),
                          }))
                        }
                      >
                        <option value="">{t('tripTemplates.form.noDriver')}</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end sm:pb-0.5">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
                        aria-label={t('tripTemplates.form.removeSlot')}
                        disabled={form.schedule.length <= 1}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            schedule: prev.schedule.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    schedule: [...prev.schedule, emptyScheduleRow()],
                  }))
                }
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('tripTemplates.form.addSlot')}
              </Button>
            </div>

            <Input
              name="base-price"
              label={t('tripTemplates.form.basePrice')}
              type="number"
              min={0}
              value={form.base_price}
              onChange={(e) => setForm((prev) => ({ ...prev, base_price: e.target.value }))}
              placeholder={t('tripTemplates.form.basePriceOptional')}
            />

            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              {t('tripTemplates.form.isActive')}
            </label>

            {routes.length === 0 ? (
              <p className="text-sm text-amber-800">{t('tripTemplates.form.noRoutes')}</p>
            ) : null}
            {formError ? (
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-surface-muted px-6 py-4">
            <Button
              type="submit"
              disabled={pending}
              className="bg-[#2F3E1F] px-6 text-white hover:bg-[#243217] disabled:opacity-70"
            >
              {pending
                ? t('common.saving')
                : isEditing
                  ? t('common.saveChanges')
                  : t('common.save')}
            </Button>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={pending}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <div>
        <Link
          to={paths.company.trips}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {t('tripTemplates.backToTrips')}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
              {t('tripTemplates.title')}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('tripTemplates.subtitle')}</p>
          </div>
          <Button
            type="button"
            onClick={openAddDialog}
            className="w-full shrink-0 bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[var(--brand-primary-dark)] sm:w-auto sm:self-start"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('tripTemplates.addNew')}
          </Button>
        </div>
      </div>

      <Card className="border border-surface-muted shadow-md">
        <CardHeader className="flex flex-row items-start gap-3 border-b border-surface-muted pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand-primary">
            <CalendarClock className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg">{t('tripTemplates.infoTitle')}</CardTitle>
            <p className="mt-1 text-sm text-text-muted">{t('tripTemplates.infoBody')}</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {templates.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-text-muted">{t('tripTemplates.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="app-table w-full min-w-[880px] text-start text-sm">
                <thead className="border-y border-surface-muted bg-background text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('tripTemplates.col.name')}</th>
                    <th className="px-4 py-3 font-medium">{t('tripTemplates.col.route')}</th>
                    <th className="px-4 py-3 font-medium">{t('tripTemplates.col.days')}</th>
                    <th className="px-4 py-3 font-medium">{t('tripTemplates.col.schedule')}</th>
                    <th className="px-4 py-3 font-medium">{t('tripTemplates.col.basePrice')}</th>
                    <th className="px-4 py-3 font-medium">{t('tripTemplates.col.status')}</th>
                    <th className="px-4 py-3 font-medium">{t('tripTemplates.col.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((row) => (
                    <tr key={row.id} className="border-b border-surface-muted/80">
                      <td className="px-4 py-3 font-medium text-text-primary">{row.name}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {(() => {
                          const route = routes.find((r) => r.id === row.routeId)
                          if (route) return routeDisplayName(route, locale)
                          return row.routeName ?? `#${row.routeId}`
                        })()}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatDaysOfWeekLabel(row.daysOfWeek, t)}
                      </td>
                      <td className="px-4 py-3">
                        <ul className="space-y-1">
                          {row.schedule.map((slot, idx) => (
                            <li key={idx} className="text-text-muted">
                              <span className="font-medium text-text-primary">{slot.time}</span>
                              {' · '}
                              {vehicleLabel(slot.vehicleId)}
                              {' · '}
                              {driverLabel(slot.driverId)}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {row.basePrice != null
                          ? row.basePrice.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                            row.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {row.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-text-muted hover:bg-surface-muted hover:text-brand-primary"
                            aria-label={t('tripTemplates.aria.edit')}
                            onClick={() => openEditDialog(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-text-muted hover:bg-red-50 hover:text-red-600"
                            aria-label={t('tripTemplates.aria.delete')}
                            onClick={() => void handleDelete(row)}
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
