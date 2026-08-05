import { useState, type FormEvent } from 'react'
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react'
import type { City, CityFormInput } from '@/modules/geography/types'
import { usePlatformCities } from '@/modules/geography/hooks/usePlatformCities'
import { formatCityCoords, formatCityLabel } from '@/modules/geography/utils/cityApi'
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

const emptyForm: CityFormInput = {
  nameEn: '',
  nameAr: '',
  latitude: '',
  longitude: '',
}

function cityToForm(city: City): CityFormInput {
  return {
    nameEn: city.name_en ?? city.name,
    nameAr: city.name_ar ?? city.governorate_name ?? '',
    latitude: city.latitude != null ? String(city.latitude) : '',
    longitude: city.longitude != null ? String(city.longitude) : '',
  }
}

export function CitiesManagementPage() {
  const { t } = useTranslation()
  const { cities, isLoading, error, reload, createCity, updateCity, deleteCity } =
    usePlatformCities()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CityFormInput>(emptyForm)
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

  function openEdit(city: City) {
    setEditingId(city.id)
    setForm(cityToForm(city))
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

    if (!form.nameEn.trim() || !form.nameAr.trim() || !form.latitude.trim() || !form.longitude.trim()) {
      setFormError('Fill in English name, Arabic name, latitude, and longitude.')
      return
    }

    const latitude = Number(form.latitude.trim())
    const longitude = Number(form.longitude.trim())
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setFormError('Latitude must be between -90 and 90 (e.g. 32.6189).')
      return
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setFormError('Longitude must be between -180 and 180 (e.g. 36.1069).')
      return
    }

    setPending(true)
    try {
      if (isEditing && editingId !== null) {
        await updateCity(editingId, form)
      } else {
        await createCity(form)
      }
      closeDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save city')
    } finally {
      setPending(false)
    }
  }

  async function handleDelete(city: City) {
    if (!window.confirm(`Delete city "${formatCityLabel(city)}"? This cannot be undone.`)) return
    setActionError(null)
    try {
      await deleteCity(city.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete city')
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
            {t('admin.sidebar.cities')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('admin.cities.subtitle')}</p>
        </div>
        <button type="button" className={createBtnClass} onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Add city
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
              {isEditing ? 'Edit city' : 'Add city'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Enter English and Arabic names with valid map coordinates.
            </p>
          </div>
          <div className="grid gap-4 p-6">
            <Input
              label="Name (English)"
              name="name_en"
              value={form.nameEn}
              onChange={(e) => setForm((prev) => ({ ...prev, nameEn: e.target.value }))}
              placeholder="e.g. Daraa"
              required
            />
            <Input
              label="Name (Arabic)"
              name="name_ar"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder="مثلاً: درعا"
              dir="rtl"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Latitude"
                name="latitude"
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={form.latitude}
                onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                placeholder="32.6189"
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
                placeholder="36.1069"
                required
              />
            </div>
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
              {pending ? 'Saving…' : isEditing ? 'Save changes' : 'Create city'}
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
              <Landmark className="h-5 w-5" aria-hidden />
            </span>
            <CardTitle className="text-lg">All cities</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : cities.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-text-muted">No cities yet. Add the first city.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border" dir="rtl">
                <table className="app-table w-full min-w-[640px] table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[24%]" />
                    <col className="w-[28%]" />
                    <col className="w-[6rem]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-text-muted">
                      <th className="py-3 ps-4 pe-1 text-start font-semibold">Name (EN)</th>
                      <th className="py-3 ps-1 pe-2 text-start font-semibold">Name (AR)</th>
                      <th className="px-3 py-3 text-start font-semibold">Coordinates</th>
                      <th className="px-2 py-3 text-end font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cities.map((city) => (
                      <tr
                        key={city.id}
                        className="border-b border-surface-muted transition-colors last:border-0 hover:bg-surface-muted/40"
                      >
                        <td className="py-3 ps-4 pe-1 align-middle text-start font-medium text-text-primary">
                          <span className="block truncate" title={city.name_en ?? city.name}>
                            {city.name_en ?? city.name}
                          </span>
                        </td>
                        <td className="py-3 ps-1 pe-2 align-middle text-start text-text-secondary">
                          <span className="block truncate" dir="rtl" title={city.name_ar ?? ''}>
                            {city.name_ar ?? '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle text-start">
                          <span
                            className="inline-block whitespace-nowrap font-mono text-xs tabular-nums text-text-secondary"
                            dir="ltr"
                            title={formatCityCoords(city)}
                          >
                            {formatCityCoords(city)}
                          </span>
                        </td>
                        <td className="px-2 py-3 align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className={iconBtnClass}
                              title="Edit"
                              aria-label={`Edit ${formatCityLabel(city)}`}
                              onClick={() => openEdit(city)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className={cn(iconBtnClass, 'hover:border-red-200 hover:text-red-700')}
                              title="Delete"
                              aria-label={`Delete ${formatCityLabel(city)}`}
                              onClick={() => void handleDelete(city)}
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
