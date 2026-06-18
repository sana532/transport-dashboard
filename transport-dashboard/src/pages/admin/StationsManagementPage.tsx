import { useState, type FormEvent } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Station, StationFormInput } from '@/modules/geography/types'
import { usePlatformStations } from '@/modules/geography/hooks/usePlatformStations'
import { formatStationCityLabel } from '@/modules/geography/utils/stationApi'
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

const emptyForm: StationFormInput = {
  name: '',
  governorateName: '',
  latitude: '',
  longitude: '',
}

function stationToForm(station: Station): StationFormInput {
  return {
    name: station.name,
    governorateName: station.governorate_name ?? station.city?.name ?? '',
    latitude: station.latitude != null ? String(station.latitude) : '',
    longitude: station.longitude != null ? String(station.longitude) : '',
  }
}

function formatCoords(station: Station): string {
  if (station.latitude != null && station.longitude != null) {
    return `${station.latitude}, ${station.longitude}`
  }
  return '—'
}

export function StationsManagementPage() {
  const {
    stations,
    isLoading,
    error,
    reload,
    createStation,
    updateStation,
    deleteStation,
  } = usePlatformStations()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<StationFormInput>(emptyForm)
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

  function openEdit(station: Station) {
    setEditingId(station.id)
    setForm(stationToForm(station))
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

    if (!form.name.trim() || !form.governorateName.trim() || !form.latitude.trim() || !form.longitude.trim()) {
      setFormError('Fill in name, governorate, latitude, and longitude.')
      return
    }

    setPending(true)
    try {
      if (isEditing && editingId !== null) {
        await updateStation(editingId, form)
      } else {
        await createStation(form)
      }
      closeDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save station')
    } finally {
      setPending(false)
    }
  }

  async function handleDelete(station: Station) {
    if (!window.confirm(`Delete station "${station.name}"? This cannot be undone.`)) return
    setActionError(null)
    try {
      await deleteStation(station.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete station')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Stations</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Platform bus stations used by all companies when building routes. Companies read
            these via GET /api/stations.
          </p>
        </div>
        <button type="button" className={createBtnClass} onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Add station
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
            <h2 className="text-lg font-semibold text-text-primary">
              {isEditing ? 'Edit station' : 'Add station'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Matches POST/PATCH /api/platform/stations in Admin-Platform Postman.
            </p>
          </div>
          <div className="grid gap-4 p-6">
            <Input
              label="Station name"
              name="name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Damascus Terminal"
              required
            />
            <Input
              label="Governorate"
              name="governorate_name"
              value={form.governorateName}
              onChange={(e) => setForm((prev) => ({ ...prev, governorateName: e.target.value }))}
              placeholder="e.g. Damascus"
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
                placeholder="33.5138"
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
                placeholder="36.2765"
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
              {pending ? 'Saving…' : isEditing ? 'Save changes' : 'Create station'}
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
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <CardTitle className="text-lg">All stations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : stations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-text-muted">No stations yet. Add the first station.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border" dir="rtl">
                <table className="w-full min-w-[680px] table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[22%]" />
                    <col className="w-[20%]" />
                    <col className="w-[6rem]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-text-muted">
                      <th className="py-3 ps-4 pe-1 text-start font-semibold">Name</th>
                      <th className="py-3 ps-1 pe-2 text-start font-semibold">Coordinates</th>
                      <th className="px-3 py-3 text-start font-semibold">City</th>
                      <th className="px-2 py-3 text-end font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((station) => (
                      <tr
                        key={station.id}
                        className="border-b border-surface-muted transition-colors last:border-0 hover:bg-surface-muted/40"
                      >
                        <td className="py-3 ps-4 pe-1 align-middle text-start font-medium text-text-primary">
                          <span className="block truncate" title={station.name}>
                            {station.name}
                          </span>
                        </td>
                        <td className="py-3 ps-1 pe-2 align-middle text-start">
                          <span
                            className="inline-block whitespace-nowrap font-mono text-xs tabular-nums text-text-secondary"
                            dir="ltr"
                            title={formatCoords(station)}
                          >
                            {formatCoords(station)}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle text-start text-text-secondary">
                          <span className="block whitespace-nowrap" title={formatStationCityLabel(station)}>
                            {formatStationCityLabel(station)}
                          </span>
                        </td>
                        <td className="px-2 py-3 align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className={iconBtnClass}
                              title="Edit"
                              aria-label={`Edit ${station.name}`}
                              onClick={() => openEdit(station)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className={cn(iconBtnClass, 'hover:border-red-200 hover:text-red-700')}
                              title="Delete"
                              aria-label={`Delete ${station.name}`}
                              onClick={() => void handleDelete(station)}
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
