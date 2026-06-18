import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useVehicleModels } from '@/modules/vehicle-models/hooks/useVehicleModels'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'

const createBtnClass = cn(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold',
  'bg-[#2F3E1F] text-white shadow-sm hover:bg-[#243217]',
)

const iconBtnClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary'

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function VehicleModelsManagementPage() {
  const { models, isLoading, error, reload, deleteModel } = useVehicleModels()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete vehicle model "${name}"? This cannot be undone.`)) return
    setActionError(null)
    setDeletingId(id)
    try {
      await deleteModel(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete vehicle model')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Vehicle models
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Platform catalog of bus layouts. Companies will pick from these models when
            configuring their fleet.
          </p>
        </div>
        <Link to={paths.admin.vehicleModelNew} className={createBtnClass}>
          <Plus className="h-4 w-4" aria-hidden />
          Add model
        </Link>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

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
              <Bus className="h-5 w-5" aria-hidden />
            </span>
            <CardTitle className="text-lg">All models</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : models.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-text-muted">No vehicle models yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-start text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="pb-3 pe-4 font-medium">Name</th>
                      <th className="pb-3 pe-4 font-medium">Description</th>
                      <th className="pb-3 pe-4 font-medium">Status</th>
                      <th className="pb-3 pe-4 font-medium">Images</th>
                      <th className="pb-3 font-medium text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((model) => (
                      <tr
                        key={model.id}
                        className="border-b border-surface-muted last:border-0"
                      >
                        <td className="py-3 pe-4 font-medium text-text-primary">
                          <div>{model.nameEn || model.name}</div>
                          {model.nameAr && model.nameAr !== model.nameEn ? (
                            <div className="text-xs text-text-muted" dir="rtl">
                              {model.nameAr}
                            </div>
                          ) : null}
                        </td>
                        <td className="max-w-xs truncate py-3 pe-4 text-text-secondary">
                          {model.description || '—'}
                        </td>
                        <td className="py-3 pe-4">
                          <ActiveBadge active={model.is_active} />
                        </td>
                        <td className="py-3 pe-4 text-text-secondary">
                          {model.image_urls?.length ?? 0}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={paths.admin.vehicleModelEdit(String(model.id))}
                              className={iconBtnClass}
                              title="Edit"
                              aria-label={`Edit ${model.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              className={cn(iconBtnClass, 'hover:border-red-200 hover:text-red-700')}
                              title="Delete"
                              aria-label={`Delete ${model.name}`}
                              disabled={deletingId === model.id}
                              onClick={() => void handleDelete(model.id, model.name)}
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
