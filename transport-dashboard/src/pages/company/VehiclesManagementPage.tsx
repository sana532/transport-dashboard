import { useMemo, useState } from 'react'
import { CircleGauge, Download, Loader2, Plus, Search } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import type { VehiclesStatVariant } from '@/modules/vehicles/types'
import type { Vehicle } from '@/modules/vehicles/types'
import { useVehiclesManagement } from '@/modules/vehicles/hooks/useVehiclesManagement'
import { VehicleFormDialog } from '@/modules/vehicles/components/VehicleFormDialog'
import { VehicleCard } from '@/modules/vehicles/components/VehicleCard'
import {
  defaultVehicleListFilters,
  filterVehicles,
  uniqueVehicleModels,
  type VehicleListFilters,
} from '@/modules/vehicles/utils/filterVehicles'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function statCardClass(variant: VehiclesStatVariant): string {
  if (variant === 'primary') return 'bg-[#2F3E1F] text-white border-[#2F3E1F]'
  if (variant === 'info') return 'border-l-4 border-l-blue-500'
  if (variant === 'success') return 'border-l-4 border-l-green-500'
  return 'border-l-4 border-l-amber-500'
}

function trendClass(variant: VehiclesStatVariant): string {
  if (variant === 'primary') return 'text-emerald-200'
  return 'text-green-700'
}

function VehiclesLoadingState({ message }: { message: string }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-text-muted">{message}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-36 animate-pulse rounded-xl border border-border bg-surface shadow-sm" />
        ))}
      </div>
      <div className="h-44 animate-pulse rounded-xl border border-border bg-surface shadow-sm" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-48 animate-pulse rounded-xl border border-border bg-surface shadow-sm" />
        ))}
      </div>
    </div>
  )
}

function VehiclesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm text-red-700">{message}</p>
        <Button onClick={onRetry} className="bg-brand-primary text-white hover:bg-brand-primary-dark">
          {t('common.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function VehiclesManagementPage() {
  const { t } = useTranslation()
  const {
    data,
    vehicleModels,
    isLoading,
    error,
    reload,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  } = useVehiclesManagement()

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formPending, setFormPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [filters, setFilters] = useState<VehicleListFilters>(defaultVehicleListFilters)

  const modelOptions = useMemo(
    () => (data ? uniqueVehicleModels(data.vehicles) : []),
    [data],
  )

  const filteredVehicles = useMemo(() => {
    if (!data) return []
    return filterVehicles(data.vehicles, filters)
  }, [data, filters])

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.modelName !== 'all'

  const handleResetFilters = () => setFilters(defaultVehicleListFilters)

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    const id = Number(vehicle.id)
    if (!Number.isFinite(id)) return
    if (!window.confirm(t('vehicles.confirmDelete', { name: vehicle.plateNumber }))) return
    try {
      await deleteVehicle(id)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('vehicles.form.saveFailed'))
    }
  }

  if (isLoading) return <VehiclesLoadingState message={t('common.loading')} />
  if (error || !data) {
    return (
      <VehiclesErrorState
        message={error ?? t('vehicles.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="space-y-5">
      <VehicleFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingVehicle(null)
          setFormError(null)
        }}
        mode={formMode}
        vehicle={formMode === 'edit' ? editingVehicle : null}
        vehicleModels={vehicleModels}
        pending={formPending}
        saveError={formError}
        onCreate={async (input) => {
          setFormPending(true)
          setFormError(null)
          try {
            await createVehicle(input)
          } catch (err) {
            setFormError(err instanceof Error ? err.message : t('vehicles.form.saveFailed'))
            throw err
          } finally {
            setFormPending(false)
          }
        }}
        onUpdate={async (id, input) => {
          setFormPending(true)
          setFormError(null)
          try {
            await updateVehicle(id, input)
          } catch (err) {
            setFormError(err instanceof Error ? err.message : t('vehicles.form.saveFailed'))
            throw err
          } finally {
            setFormPending(false)
          }
        }}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight text-text-primary">
              {t('vehicles.title')}
            </h1>
            <p className="mt-1 text-sm text-text-muted">{t('vehicles.subtitle')}</p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setFormMode('add')
              setEditingVehicle(null)
              setFormError(null)
              setFormOpen(true)
            }}
            className="w-full shrink-0 bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[var(--brand-primary-dark)] focus-visible:ring-[var(--brand-primary)] sm:w-auto sm:self-start"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('vehicles.addNew')}
          </Button>
        </div>

        <div className="relative max-w-xl">
          <span className="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center ps-3">
            <Search className="h-4 w-4 text-text-muted" aria-hidden />
          </span>
          <Input
            name="vehicle-search-header"
            placeholder={t('vehicles.searchPlaceholder')}
            aria-label={t('vehicles.searchAria')}
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="ps-9"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map(({ title, value, note, trend, Icon, variant }) => (
          <Card key={title} className={cn('shadow-md', statCardClass(variant))}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    'rounded-xl p-2',
                    variant === 'primary' ? 'bg-white/10' : 'bg-background',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      variant === 'primary' ? 'text-white' : 'text-brand-primary',
                    )}
                  />
                </div>
                <p
                  className={cn(
                    'text-sm',
                    variant === 'primary' ? 'text-white/90' : 'text-text-muted',
                  )}
                >
                  {title}
                </p>
              </div>

              <p
                className={cn(
                  'mt-3 text-4xl font-semibold leading-none',
                  variant === 'primary' ? 'text-white' : 'text-text-primary',
                )}
              >
                {value}
              </p>
              <p
                className={cn(
                  'mt-2 text-xs',
                  variant === 'primary' ? 'text-white/80' : 'text-text-muted',
                )}
              >
                {note}
              </p>
              <p className={cn('mt-1 text-xs font-medium', trendClass(variant))}>{trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardContent className="space-y-4 p-4">
          <p className="text-sm font-semibold text-text-primary">{t('vehicles.filtersTitle')}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="vehicle-status-filter" className="text-sm font-medium text-text-secondary">
                {t('common.status')}
              </label>
              <select
                id="vehicle-status-filter"
                className={selectClass}
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value as VehicleListFilters['status'],
                  }))
                }
              >
                <option value="all">{t('vehicles.allStatus')}</option>
                <option value="Available">{t('vehicles.status.available')}</option>
                <option value="Maintenance">{t('vehicles.status.maintenance')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="vehicle-model-filter" className="text-sm font-medium text-text-secondary">
                {t('vehicles.type')}
              </label>
              <select
                id="vehicle-model-filter"
                className={selectClass}
                value={filters.modelName}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, modelName: e.target.value }))
                }
              >
                <option value="all">{t('vehicles.allTypes')}</option>
                {modelOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="min-w-[7rem] border-border"
            >
              {t('common.reset')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-[7rem] border-border text-text-secondary"
            >
              <Download className="h-4 w-4" aria-hidden />
              {t('common.export')}
            </Button>
            {hasActiveFilters ? (
              <span className="text-xs text-text-muted">
                {t('vehicles.fleet')}: {filteredVehicles.length}/{data.vehicles.length}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-2xl">
            {t('vehicles.fleet')}
            {hasActiveFilters ? (
              <span className="ms-2 text-base font-normal text-text-muted">
                ({filteredVehicles.length}/{data.vehicles.length})
              </span>
            ) : null}
          </CardTitle>
          <Button type="button" variant="ghost" className="shrink-0 text-text-muted" aria-label="Overview">
            <CircleGauge className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4">
          {data.vehicles.length === 0 ? (
            <div className="rounded-lg border border-surface-muted bg-background p-6 text-center">
              <p className="font-medium text-text-primary">{t('vehicles.emptyTitle')}</p>
              <p className="mt-2 text-sm text-text-muted">{t('vehicles.emptyHint')}</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="rounded-lg border border-surface-muted bg-background p-6 text-center">
              <p className="text-sm text-text-muted">{t('vehicles.noFilterResults')}</p>
              <Button type="button" variant="ghost" className="mt-3" onClick={handleResetFilters}>
                {t('common.reset')}
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onEdit={(v) => {
                    setFormMode('edit')
                    setEditingVehicle(v)
                    setFormError(null)
                    setFormOpen(true)
                  }}
                  onDelete={handleDeleteVehicle}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
