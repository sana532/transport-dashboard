import { useState, type FormEvent } from 'react'
import { Coffee, Pencil, Plus, Trash2 } from 'lucide-react'
import type { RestArea, RestAreaFormInput } from '@/modules/geography/types'
import { usePlatformCities } from '@/modules/geography/hooks/usePlatformCities'
import { usePlatformRestAreas } from '@/modules/geography/hooks/usePlatformRestAreas'
import { formatCityLabel } from '@/modules/geography/utils/cityApi'
import {
  formatRestAreaCityLabel,
  formatRestAreaCoords,
} from '@/modules/geography/utils/restAreaApi'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { cn } from '@/shared/utils/cn'

const createBtnClass = cn(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold',
  'bg-[#2F3E1F] text-white shadow-sm hover:bg-[#243217]',
)

const iconBtnClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const emptyForm: RestAreaFormInput = {
  cityId: '',
  name: '',
  description: '',
  latitude: '',
  longitude: '',
  isActive: true,
}

function restAreaToForm(area: RestArea): RestAreaFormInput {
  return {
    cityId: area.city_id != null ? String(area.city_id) : area.city?.id != null ? String(area.city.id) : '',
    name: area.name,
    description: area.description ?? '',
    latitude: area.latitude != null ? String(area.latitude) : '',
    longitude: area.longitude != null ? String(area.longitude) : '',
    isActive: area.is_active !== false,
  }
}

export function RestAreasManagementPage() {
  const { t } = useTranslation()
  const { cities, isLoading: citiesLoading } = usePlatformCities()
  const {
    restAreas,
    isLoading,
    error,
    reload,
    createRestArea,
    updateRestArea,
    deleteRestArea,
  } = usePlatformRestAreas()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<RestAreaFormInput>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isEditing = editingId !== null

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(area: RestArea) {
    setEditingId(area.id)
    setForm(restAreaToForm(area))
    setFormError(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (
      !form.cityId.trim() ||
      !form.name.trim() ||
      !form.latitude.trim() ||
      !form.longitude.trim()
    ) {
      setFormError('Fill in city, name, latitude, and longitude.')
      return
    }

    setPending(true)
    try {
      if (isEditing && editingId !== null) {
        await updateRestArea(editingId, form)
      } else {
        await createRestArea(form)
      }
      closeDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save rest area')
    } finally {
      setPending(false)
    }
  }

  async function handleDelete(area: RestArea) {
    if (!window.confirm(`Delete rest area "${area.name}"? This cannot be undone.`)) return
    setActionError(null)
    try {
      await deleteRestArea(area.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete rest area')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t('admin.nav.catalog')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
            {t('admin.sidebar.restAreas')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('admin.restAreas.subtitle')}</p>
        </div>
        <button type="button" className={createBtnClass} onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Add rest area
        </button>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      <Modal open={dialogOpen} onClose={closeDialog} className="max-w-lg p-0">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-surface-muted px-6 py-4">
            <h2 className="section-title text-lg font-semibold text-[var(--title-h2)]">
              {isEditing ? 'Edit rest area' : 'Add rest area'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Link a highway stop to a city with map coordinates.
            </p>
          </div>
          <div className="grid gap-4 p-6">
            <div className="grid gap-1.5">
              <label htmlFor="rest_area_city_id" className="text-sm font-medium text-text-secondary">
                City
              </label>
              <select
                id="rest_area_city_id"
                name="city_id"
                className={selectClass}
                value={form.cityId}
                onChange={(e) => setForm((prev) => ({ ...prev, cityId: e.target.value }))}
                required
                disabled={citiesLoading}
              >
                <option value="">{citiesLoading ? 'Loading cities…' : 'Select a city'}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {formatCityLabel(city)}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Name"
              name="name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Highway Rest Area 1"
              required
            />
            <div className="grid gap-1.5">
              <label htmlFor="rest_area_description" className="text-sm font-medium text-text-secondary">
                Description
              </label>
              <textarea
                id="rest_area_description"
                name="description"
                rows={3}
                className={cn(selectClass, 'resize-y')}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Open 24/7"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Latitude"
                name="latitude"
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={form.latitude}
                onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                placeholder="33.9"
                required
              />
              <Input
                label="Longitude"
                name="longitude"
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={form.longitude}
                onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                placeholder="36.8"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-[#2F3E1F] focus:ring-[#2F3E1F]/30"
              />
              Active
            </label>
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
              {pending ? 'Saving…' : isEditing ? 'Save changes' : 'Create rest area'}
            </Button>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {error ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
            <Button
              type="button"
              onClick={() => void reload()}
              className="bg-[#2F3E1F] text-white hover:bg-[#243217]"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
              <Coffee className="h-5 w-5" aria-hidden />
            </span>
            <CardTitle className="text-lg">All rest areas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : restAreas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-text-muted">No rest areas yet. Add the first one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border" dir="rtl">
                <table className="app-table w-full min-w-[760px] table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[16%]" />
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[10%]" />
                    <col className="w-[6rem]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-text-muted">
                      <th className="py-3 ps-4 pe-1 text-start font-semibold">Name</th>
                      <th className="py-3 ps-1 pe-2 text-start font-semibold">City</th>
                      <th className="px-3 py-3 text-start font-semibold">Coordinates</th>
                      <th className="px-3 py-3 text-start font-semibold">Description</th>
                      <th className="px-2 py-3 text-start font-semibold">Status</th>
                      <th className="px-2 py-3 text-end font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restAreas.map((area) => (
                      <tr
                        key={area.id}
                        className="border-b border-surface-muted transition-colors last:border-0 hover:bg-surface-muted/40"
                      >
                        <td className="py-3 ps-4 pe-1 align-middle text-start font-medium text-text-primary">
                          <span className="block truncate" title={area.name}>
                            {area.name}
                          </span>
                        </td>
                        <td className="py-3 ps-1 pe-2 align-middle text-start text-text-secondary">
                          <span className="block truncate" title={formatRestAreaCityLabel(area)}>
                            {formatRestAreaCityLabel(area)}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle text-start">
                          <span
                            className="inline-block whitespace-nowrap font-mono text-xs tabular-nums text-text-secondary"
                            dir="ltr"
                            title={formatRestAreaCoords(area)}
                          >
                            {formatRestAreaCoords(area)}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle text-start text-text-secondary">
                          <span className="block truncate" title={area.description ?? ''}>
                            {area.description?.trim() || '—'}
                          </span>
                        </td>
                        <td className="px-2 py-3 align-middle text-start">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                              area.is_active === false
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-green-100 text-green-800',
                            )}
                          >
                            {area.is_active === false ? 'inactive' : 'active'}
                          </span>
                        </td>
                        <td className="px-2 py-3 align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className={iconBtnClass}
                              title="Edit"
                              aria-label={`Edit ${area.name}`}
                              onClick={() => openEdit(area)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className={cn(iconBtnClass, 'hover:border-red-200 hover:text-red-700')}
                              title="Delete"
                              aria-label={`Delete ${area.name}`}
                              onClick={() => void handleDelete(area)}
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
      )}
    </div>
  )
}
