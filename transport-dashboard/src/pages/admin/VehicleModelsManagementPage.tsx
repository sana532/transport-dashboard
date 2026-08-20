import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useVehicleModels } from '@/modules/vehicle-models/hooks/useVehicleModels'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'

const createBtnClass = cn(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold',
  'bg-[#2F3E1F] text-white shadow-sm hover:bg-[#243217]',
)

const iconBtnClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary'

function ActiveBadge({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600',
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

export function VehicleModelsManagementPage() {
  const { t } = useTranslation()
  const confirm = useConfirmDialog()
  const { models, isLoading, error, reload, deleteModel } = useVehicleModels()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(id: number, name: string) {
    await confirm({
      title: t('common.confirmDeleteTitle'),
      description: t('admin.vehicleModels.confirmDelete', { name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      action: async () => {
        setActionError(null)
        setDeletingId(id)
        try {
          await deleteModel(id)
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t('admin.nav.catalog')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
            {t('admin.sidebar.vehicleModels')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            {t('admin.vehicleModels.subtitle')}
          </p>
        </div>
        <Link to={paths.admin.vehicleModelNew} className={createBtnClass}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin.vehicleModels.table.add')}
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
              {t('admin.vehicleModels.table.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
              <Bus className="h-5 w-5" aria-hidden />
            </span>
            <CardTitle className="text-lg">{t('admin.vehicleModels.table.all')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-text-muted">{t('admin.vehicleModels.table.loading')}</p>
            ) : models.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-text-muted">{t('admin.vehicleModels.table.empty')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="app-table w-full min-w-[780px] table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[26%]" />
                    <col className="w-[5rem]" />
                    <col className="w-[5.5rem]" />
                    <col className="w-[6rem]" />
                    <col className="w-[4.5rem]" />
                    <col className="w-[7rem]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-text-muted">
                      <th className="py-3 ps-4 pe-2 text-start font-semibold">
                        {t('admin.vehicleModels.table.name')}
                      </th>
                      <th className="px-2 py-3 text-start font-semibold">
                        {t('admin.vehicleModels.table.description')}
                      </th>
                      <th className="px-2 py-3 text-center font-semibold">
                        {t('admin.vehicleModels.table.seats')}
                      </th>
                      <th className="px-2 py-3 text-center font-semibold">
                        {t('admin.vehicleModels.table.vehicles')}
                      </th>
                      <th className="px-2 py-3 text-start font-semibold">
                        {t('admin.vehicleModels.table.status')}
                      </th>
                      <th className="px-2 py-3 text-center font-semibold">
                        {t('admin.vehicleModels.table.images')}
                      </th>
                      <th className="py-3 ps-2 pe-3 text-end font-semibold">
                        {t('admin.vehicleModels.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((model) => (
                      <tr
                        key={model.id}
                        className="border-b border-surface-muted transition-colors last:border-0 hover:bg-surface-muted/40"
                      >
                        <td className="py-3 ps-4 pe-2 align-middle text-start font-medium text-text-primary">
                          <span className="block truncate" title={model.nameEn || model.name}>
                            {model.nameEn || model.name}
                          </span>
                          {model.nameAr && model.nameAr !== model.nameEn ? (
                            <span className="mt-0.5 block truncate text-xs text-text-muted" dir="rtl" title={model.nameAr}>
                              {model.nameAr}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-2 py-3 align-middle text-start text-text-secondary">
                          <span className="block truncate" title={model.description ?? undefined}>
                            {model.description || '—'}
                          </span>
                        </td>
                        <td className="px-2 py-3 align-middle text-center tabular-nums text-text-primary">
                          {model.seat_count != null ? model.seat_count : '—'}
                        </td>
                        <td className="px-2 py-3 align-middle text-center tabular-nums text-text-primary">
                          {model.vehicles_count != null ? model.vehicles_count : '—'}
                        </td>
                        <td className="px-2 py-3 align-middle">
                          <ActiveBadge
                            active={model.is_active}
                            activeLabel={t('admin.vehicleModels.table.active')}
                            inactiveLabel={t('admin.vehicleModels.table.inactive')}
                          />
                        </td>
                        <td className="px-2 py-3 align-middle text-center tabular-nums text-text-secondary">
                          {model.image_urls?.length ?? 0}
                        </td>
                        <td className="py-3 ps-2 pe-3 align-middle">
                          <div className="flex items-center justify-end gap-1.5">
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
