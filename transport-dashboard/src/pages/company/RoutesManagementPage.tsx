import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MapPinned, Pencil, Plus, Trash2 } from 'lucide-react'
import { formatRestAreaLabel } from '@/modules/geography/utils/restAreaApi'
import { translateCityName } from '@/modules/geography/utils/cityNames'
import type { Station } from '@/modules/geography/types'
import type { CompanyRoute } from '@/modules/routes/types'
import { RouteRestAreasCell } from '@/modules/routes/components/RouteRestAreasCell'
import { useRoutesManagement } from '@/modules/routes/hooks/useRoutesManagement'
import { routesService } from '@/modules/routes/services/routesService'
import {
  buildAutoRouteNameAr,
  buildAutoRouteNameEn,
  routeDisplayName,
} from '@/modules/routes/utils/routeDisplay'
import {
  buildRestAreasPayload,
  emptyRestAreaStopRow,
  routeRestStopsToFormRows,
  type RestAreaStopFormRow,
} from '@/modules/routes/utils/routeRestAreas'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { cn } from '@/shared/utils/cn'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

type RouteFormState = {
  name_en: string
  name_ar: string
  origin_station_id: string
  destination_station_id: string
  estimated_duration_hhmm: string
  base_fare: string
  restAreaStops: RestAreaStopFormRow[]
}

const emptyForm: RouteFormState = {
  name_en: '',
  name_ar: '',
  origin_station_id: '',
  destination_station_id: '',
  estimated_duration_hhmm: '',
  base_fare: '',
  restAreaStops: [],
}

const DURATION_HHMM = /^\d{1,2}:\d{2}$/

function isValidDurationHhmm(value: string): boolean {
  if (!value.trim()) return true
  if (!DURATION_HHMM.test(value.trim())) return false
  const [h, m] = value.trim().split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) && m >= 0 && m < 60
}

function buildAutoRouteName(
  originStationId: string,
  destinationStationId: string,
  stations: Station[],
): string {
  return buildAutoRouteNameEn(originStationId, destinationStationId, stations)
}

function buildAutoRouteNameArLocal(
  originStationId: string,
  destinationStationId: string,
  stations: Station[],
): string {
  return buildAutoRouteNameAr(originStationId, destinationStationId, stations)
}

function stationLabel(route: CompanyRoute, kind: 'origin' | 'destination', locale: string): string {
  const station = kind === 'origin' ? route.origin_station : route.destination_station
  const city = kind === 'origin' ? route.origin_city : route.destination_city
  if (station?.name && city?.name) {
    return `${station.name} (${translateCityName(city.name, locale)})`
  }
  if (station?.name) return station.name
  const id = kind === 'origin' ? route.origin_station_id : route.destination_station_id
  return `#${id}`
}

function RoutesLoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-surface-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-surface-muted" />
    </div>
  )
}

function RoutesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm text-red-700" role="alert">
          {message}
        </p>
        <Button
          onClick={onRetry}
          className="bg-brand-primary text-white hover:bg-brand-primary-dark"
        >
          {t('common.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function RoutesManagementPage() {
  const { t, locale } = useTranslation()
  const confirm = useConfirmDialog()
  const {
    routes,
    stations,
    restAreas,
    isLoading,
    error,
    reload,
    createRoute,
    updateRoute,
    deleteRoute,
  } = useRoutesManagement()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<RouteFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [nameEnTouched, setNameEnTouched] = useState(false)
  const [nameArTouched, setNameArTouched] = useState(false)
  const editingRouteIdRef = useRef<number | null>(null)
  const formDirtyRef = useRef(false)

  const markFormDirty = () => {
    formDirtyRef.current = true
  }

  const isEditing = editingId !== null

  const autoRouteNameEn = buildAutoRouteName(
    form.origin_station_id,
    form.destination_station_id,
    stations,
  )
  const autoRouteNameAr = buildAutoRouteNameArLocal(
    form.origin_station_id,
    form.destination_station_id,
    stations,
  )

  const seedRouteForm = (route: CompanyRoute) => {
    setNameEnTouched(false)
    setNameArTouched(false)
    setForm({
      name_en: route.name_en?.trim() || route.name?.trim() || '',
      name_ar: route.name_ar?.trim() || '',
      origin_station_id: String(route.origin_station_id),
      destination_station_id: String(route.destination_station_id),
      estimated_duration_hhmm: route.estimated_duration_hhmm ?? '',
      base_fare: route.base_fare != null ? String(route.base_fare) : '',
      restAreaStops: routeRestStopsToFormRows(route.rest_areas),
    })
  }

  useEffect(() => {
    if (!dialogOpen || isEditing || formDirtyRef.current) return
    setForm((prev) => {
      const next = { ...prev }
      if (!nameEnTouched && autoRouteNameEn) next.name_en = autoRouteNameEn
      if (!nameArTouched && autoRouteNameAr) next.name_ar = autoRouteNameAr
      return next
    })
  }, [dialogOpen, isEditing, nameEnTouched, nameArTouched, autoRouteNameEn, autoRouteNameAr])

  const openAddDialog = () => {
    setEditingId(null)
    editingRouteIdRef.current = null
    formDirtyRef.current = false
    setForm(emptyForm)
    setNameEnTouched(false)
    setNameArTouched(false)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (row: CompanyRoute) => {
    setEditingId(row.id)
    editingRouteIdRef.current = row.id
    formDirtyRef.current = false
    setNameEnTouched(false)
    setNameArTouched(false)
    setFormError(null)
    setDialogOpen(true)
    seedRouteForm(row)

    void routesService
      .getRoute(row.id)
      .then((detail) => {
        if (editingRouteIdRef.current !== row.id) return
        if (formDirtyRef.current) {
          setForm((prev) => ({
            ...prev,
            restAreaStops: routeRestStopsToFormRows(detail.rest_areas),
          }))
          return
        }
        seedRouteForm(detail)
      })
      .catch(() => {
        /* keep list row data */
      })
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    editingRouteIdRef.current = null
    formDirtyRef.current = false
    setForm(emptyForm)
    setNameEnTouched(false)
    setNameArTouched(false)
    setFormError(null)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const formData = new FormData(e.currentTarget)
    const origin_station_id = Number(form.origin_station_id)
    const destination_station_id = Number(form.destination_station_id)
    const name_en =
      String(formData.get('route-name-en') ?? form.name_en).trim() || autoRouteNameEn
    const name_ar =
      String(formData.get('route-name-ar') ?? form.name_ar).trim() ||
      autoRouteNameAr ||
      name_en

    if (!name_en || !name_ar || !origin_station_id || !destination_station_id) {
      setFormError(
        !name_en || !name_ar ? t('routes.form.namesRequired') : t('routes.form.validation'),
      )
      return
    }
    if (origin_station_id === destination_station_id) {
      setFormError(t('routes.form.sameStation'))
      return
    }

    const duration = form.estimated_duration_hhmm.trim()
    if (!isValidDurationHhmm(duration)) {
      setFormError(t('routes.form.invalidDuration'))
      return
    }

    const baseFareRaw = form.base_fare.trim()
    let base_fare: number | undefined
    if (baseFareRaw) {
      base_fare = Number(baseFareRaw)
      if (!Number.isFinite(base_fare) || base_fare <= 0) {
        setFormError(t('routes.form.invalidBaseFare'))
        return
      }
    }

    const rest_areas = buildRestAreasPayload(form.restAreaStops)

    setPending(true)
    try {
      const payload = {
        name_en,
        name_ar,
        origin_station_id,
        destination_station_id,
        rest_areas,
        ...(duration ? { estimated_duration_hhmm: duration } : {}),
        ...(base_fare != null ? { base_fare } : {}),
      }
      if (isEditing && editingId !== null) {
        await updateRoute(editingId, payload)
      } else {
        await createRoute(payload)
      }
      closeDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('routes.form.saveFailed'))
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async (row: CompanyRoute) => {
    await confirm({
      title: t('common.confirmDeleteTitle'),
      description: t('routes.confirmDelete', { name: row.name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      action: () => deleteRoute(row.id),
    })
  }

  if (isLoading) return <RoutesLoadingState />
  if (error) return <RoutesErrorState message={error} onRetry={() => void reload()} />

  return (
    <div className="space-y-5">
      <Modal open={dialogOpen} onClose={closeDialog} className="max-w-2xl p-0">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-surface-muted px-6 py-4">
            <h2 className="section-title text-lg font-semibold text-[var(--title-h2)]">
              {isEditing ? t('routes.modal.editTitle') : t('routes.modal.addTitle')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{t('routes.modal.hint')}</p>
          </div>

          <div className="grid gap-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="route-name-en"
                label={t('routes.form.nameEn')}
                placeholder={autoRouteNameEn || t('routes.form.nameEnPlaceholder')}
                value={form.name_en}
                onChange={(e) => {
                  markFormDirty()
                  setNameEnTouched(true)
                  setForm((prev) => ({ ...prev, name_en: e.target.value }))
                }}
                hint={
                  !nameEnTouched && autoRouteNameEn
                    ? t('routes.form.nameAutoHint', { name: autoRouteNameEn })
                    : undefined
                }
                required
              />
              <Input
                name="route-name-ar"
                label={t('routes.form.nameAr')}
                placeholder={autoRouteNameAr || t('routes.form.nameArPlaceholder')}
                value={form.name_ar}
                onChange={(e) => {
                  markFormDirty()
                  setNameArTouched(true)
                  setForm((prev) => ({ ...prev, name_ar: e.target.value }))
                }}
                dir="rtl"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="origin_station_id" className="text-sm font-medium text-text-secondary">
                  {t('routes.form.originStation')}
                </label>
                <select
                  id="origin_station_id"
                  name="origin_station_id"
                  className={selectClass}
                  value={form.origin_station_id}
                  onChange={(e) => {
                    markFormDirty()
                    if (!isEditing) {
                      setNameEnTouched(false)
                      setNameArTouched(false)
                    }
                    setForm((prev) => ({ ...prev, origin_station_id: e.target.value }))
                  }}
                  required
                >
                  <option value="">{t('routes.form.chooseStation')}</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.city?.name || station.governorate_name
                        ? `${station.name} — ${station.city?.name ?? station.governorate_name}`
                        : station.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex w-full flex-col gap-1.5">
                <label
                  htmlFor="destination_station_id"
                  className="text-sm font-medium text-text-secondary"
                >
                  {t('routes.form.destinationStation')}
                </label>
                <select
                  id="destination_station_id"
                  name="destination_station_id"
                  className={selectClass}
                  value={form.destination_station_id}
                  onChange={(e) => {
                    markFormDirty()
                    if (!isEditing) {
                      setNameEnTouched(false)
                      setNameArTouched(false)
                    }
                    setForm((prev) => ({ ...prev, destination_station_id: e.target.value }))
                  }}
                  required
                >
                  <option value="">{t('routes.form.chooseStation')}</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.city?.name || station.governorate_name
                        ? `${station.name} — ${station.city?.name ?? station.governorate_name}`
                        : station.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="estimated_duration_hhmm"
                label={t('routes.form.estimatedDuration')}
                placeholder={t('routes.form.estimatedDurationPlaceholder')}
                value={form.estimated_duration_hhmm}
                onChange={(e) => {
                  markFormDirty()
                  setForm((prev) => ({ ...prev, estimated_duration_hhmm: e.target.value }))
                }}
              />
              <Input
                name="base_fare"
                label={t('routes.form.baseFare')}
                placeholder={t('routes.form.baseFarePlaceholder')}
                type="number"
                min={0}
                value={form.base_fare}
                onChange={(e) => {
                  markFormDirty()
                  setForm((prev) => ({ ...prev, base_fare: e.target.value }))
                }}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-surface-muted bg-background p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {t('routes.form.restAreasSection')}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{t('routes.form.restAreasHint')}</p>
              </div>
              {form.restAreaStops.length === 0 ? (
                <p className="text-sm text-text-muted">{t('routes.restStopsNone')}</p>
              ) : (
                <ul className="space-y-3">
                  {form.restAreaStops.map((row, index) => (
                    <li
                      key={`rest-stop-${index}`}
                      className="grid gap-3 rounded-lg border border-surface-muted p-3 sm:grid-cols-[1fr_5rem_5rem_auto]"
                    >
                      <div className="flex w-full flex-col gap-1.5 sm:col-span-1">
                        <label className="text-xs font-medium text-text-secondary">
                          {t('routes.form.restArea')}
                        </label>
                        <select
                          className={selectClass}
                          value={row.rest_area_id}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              restAreaStops: prev.restAreaStops.map((s, i) =>
                                i === index ? { ...s, rest_area_id: e.target.value } : s,
                              ),
                            }))
                          }
                        >
                          <option value="">{t('routes.form.chooseRestArea')}</option>
                          {restAreas.map((area) => (
                            <option key={area.id} value={area.id}>
                              {formatRestAreaLabel(area, locale)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        name={`stop_order_${index}`}
                        label={t('routes.form.stopOrder')}
                        type="number"
                        min={1}
                        value={row.stop_order}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            restAreaStops: prev.restAreaStops.map((s, i) =>
                              i === index ? { ...s, stop_order: e.target.value } : s,
                            ),
                          }))
                        }
                      />
                      <Input
                        name={`duration_${index}`}
                        label={t('routes.form.stopDuration')}
                        type="number"
                        min={0}
                        value={row.duration_minutes}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            restAreaStops: prev.restAreaStops.map((s, i) =>
                              i === index ? { ...s, duration_minutes: e.target.value } : s,
                            ),
                          }))
                        }
                      />
                      <div className="flex items-end sm:pb-0.5">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          aria-label={t('routes.form.removeRestStop')}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              restAreaStops: prev.restAreaStops.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={restAreas.length === 0}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    restAreaStops: [
                      ...prev.restAreaStops,
                      emptyRestAreaStopRow(),
                    ],
                  }))
                }
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('routes.form.addRestStop')}
              </Button>
              {restAreas.length === 0 ? (
                <p className="text-sm text-amber-800">{t('routes.form.noRestAreas')}</p>
              ) : null}
            </div>

            {stations.length === 0 ? (
              <p className="text-sm text-amber-800">{t('routes.form.noStations')}</p>
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
            {t('routes.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t('routes.subtitle')}</p>
        </div>
        <Button
          type="button"
          onClick={openAddDialog}
          className="w-full shrink-0 bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[var(--brand-primary-dark)] sm:w-auto sm:self-start"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('routes.addNew')}
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="border-b border-surface-muted pb-4">
          <CardTitle className="text-xl">{t('routes.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {routes.length === 0 ? (
            <div className="p-6">
              <div className="flex items-start gap-3 rounded-lg border border-surface-muted bg-background p-4">
                <div className="rounded-lg bg-surface-muted p-2 text-brand-primary">
                  <MapPinned className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('routes.emptyTitle')}</p>
                  <p className="mt-1 text-sm text-text-muted">{t('routes.emptyHint')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="app-table w-full min-w-[720px] text-start text-sm">
                <thead className="border-y border-surface-muted bg-background text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('routes.col.routeName')}</th>
                    <th className="px-4 py-3 font-medium">{t('routes.col.origin')}</th>
                    <th className="px-4 py-3 font-medium">{t('routes.col.destination')}</th>
                    <th className="min-w-[12rem] px-4 py-3 font-medium">{t('routes.col.restAreas')}</th>
                    <th className="px-4 py-3 font-medium">{t('routes.col.duration')}</th>
                    <th className="px-4 py-3 font-medium">{t('routes.col.baseFare')}</th>
                    <th className="px-4 py-3 font-medium">{t('routes.col.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-surface-muted text-text-secondary"
                    >
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        {routeDisplayName(row, locale, { stations })}
                      </td>
                      <td className="px-4 py-3">{stationLabel(row, 'origin', locale)}</td>
                      <td className="px-4 py-3">{stationLabel(row, 'destination', locale)}</td>
                      <td className="px-4 py-3 align-top">
                        <RouteRestAreasCell
                          stops={row.rest_areas}
                          catalog={restAreas}
                        />
                      </td>
                      <td className="px-4 py-3">{row.estimated_duration_hhmm ?? '—'}</td>
                      <td className="px-4 py-3">
                        {row.base_fare != null ? row.base_fare.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                            aria-label={t('routes.actions.edit', { name: row.name })}
                            onClick={() => openEditDialog(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={cn(
                              'rounded-lg p-1.5 text-red-600 hover:bg-red-50',
                            )}
                            aria-label={t('routes.actions.delete', { name: row.name })}
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
