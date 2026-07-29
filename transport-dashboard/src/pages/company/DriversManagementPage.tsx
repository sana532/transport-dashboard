import { useMemo, useState } from 'react'
import { CircleGauge, Download, ListFilter, Plus, Search } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { DriverFormDialog } from '@/modules/drivers/components/DriverFormDialog'
import { DriverProfileDialog } from '@/modules/drivers/components/DriverProfileDialog'
import { DriverCard } from '@/modules/drivers/components/DriverCard'
import type { Driver } from '@/modules/drivers/types'
import { useDriversManagement } from '@/modules/drivers/hooks/useDriversManagement'
import type { DriversStatVariant } from '@/modules/drivers/types'
import {
  defaultDriverListFilters,
  filterDrivers,
  type DriverListFilters,
} from '@/modules/drivers/utils/filterDrivers'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function statCardClass(variant: DriversStatVariant): string {
  if (variant === 'primary') return 'bg-[#2F3E1F] text-white border-[#2F3E1F]'
  if (variant === 'info') return 'border-l-4 border-l-blue-500'
  if (variant === 'success') return 'border-l-4 border-l-green-500'
  return 'border-l-4 border-l-slate-400'
}

function trendClass(variant: DriversStatVariant): string {
  if (variant === 'primary') return 'text-emerald-200'
  if (variant === 'neutral') return 'text-slate-600'
  return 'text-green-700'
}

function DriversLoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-24 animate-pulse rounded-lg bg-surface-muted" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-36 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-surface-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-56 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
    </div>
  )
}

function DriversErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function DriversManagementPage() {
  const { t } = useTranslation()
  const {
    data,
    isLoading,
    error,
    reload,
    resolveDriver,
    createDriver,
    updateDriver,
    deleteDriver,
  } = useDriversManagement()
  const [driverFormOpen, setDriverFormOpen] = useState(false)
  const [driverFormMode, setDriverFormMode] = useState<'add' | 'edit'>('add')
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [profileDriver, setProfileDriver] = useState<Driver | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [formPending, setFormPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [draftFilters, setDraftFilters] = useState<Omit<DriverListFilters, 'search'>>({
    status: defaultDriverListFilters.status,
    experience: defaultDriverListFilters.experience,
    licenseStatus: defaultDriverListFilters.licenseStatus,
  })
  const [appliedFilters, setAppliedFilters] = useState(draftFilters)

  const activeFilters: DriverListFilters = useMemo(
    () => ({ search, ...appliedFilters }),
    [search, appliedFilters],
  )

  const filteredDrivers = useMemo(() => {
    if (!data) return []
    return filterDrivers(data.drivers, activeFilters)
  }, [data, activeFilters])

  const hasActiveFilters =
    search.trim() !== '' ||
    appliedFilters.status !== 'all' ||
    appliedFilters.experience !== 'all' ||
    appliedFilters.licenseStatus !== 'all'

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters)
  }

  const handleResetFilters = () => {
    setSearch('')
    const reset = {
      status: defaultDriverListFilters.status,
      experience: defaultDriverListFilters.experience,
      licenseStatus: defaultDriverListFilters.licenseStatus,
    }
    setDraftFilters(reset)
    setAppliedFilters(reset)
  }

  const handleDeleteDriver = async (driver: Driver) => {
    const id = Number(driver.id)
    if (!Number.isFinite(id)) return
    if (!window.confirm(t('drivers.confirmDelete', { name: driver.name }))) return
    try {
      await deleteDriver(id)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('drivers.form.saveFailed'))
    }
  }

  if (isLoading) return <DriversLoadingState />
  if (error || !data) {
    return (
      <DriversErrorState
        message={error ?? t('drivers.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="space-y-5">
      <DriverProfileDialog
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false)
          setProfileDriver(null)
        }}
        driver={profileDriver}
        onEdit={(d) => {
          void (async () => {
            const fresh = await resolveDriver(d)
            setDriverFormMode('edit')
            setEditingDriver(fresh)
            setFormError(null)
            setDriverFormOpen(true)
          })()
        }}
      />

      <DriverFormDialog
        open={driverFormOpen}
        onClose={() => {
          setDriverFormOpen(false)
          setEditingDriver(null)
          setFormError(null)
        }}
        mode={driverFormMode}
        driver={driverFormMode === 'edit' ? editingDriver : null}
        pending={formPending}
        saveError={formError}
        onCreate={async (input) => {
          setFormPending(true)
          setFormError(null)
          try {
            await createDriver(input)
          } catch (err) {
            setFormError(err instanceof Error ? err.message : t('drivers.form.saveFailed'))
            throw err
          } finally {
            setFormPending(false)
          }
        }}
        onUpdate={async (id, input, profileId) => {
          setFormPending(true)
          setFormError(null)
          try {
            await updateDriver(id, input, {
              profileId: Number.isFinite(profileId) ? profileId : undefined,
            })
          } catch (err) {
            setFormError(err instanceof Error ? err.message : t('drivers.form.saveFailed'))
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
              {t('drivers.title')}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {t('drivers.subtitle')}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setDriverFormMode('add')
              setEditingDriver(null)
              setFormError(null)
              setDriverFormOpen(true)
            }}
            className="w-full shrink-0 bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[var(--brand-primary-dark)] focus-visible:ring-[var(--brand-primary)] sm:w-auto sm:self-start"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('drivers.addNew')}
          </Button>
        </div>

        <div className="relative max-w-xl">
          <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
            <Search className="h-4 w-4 text-text-muted" aria-hidden />
          </span>
          <Input
            name="driver-search-header"
            placeholder={t('drivers.searchPlaceholder')}
            aria-label={t('drivers.searchAria')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
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
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="driver-status-filter" className="text-sm font-medium text-text-secondary">
                {t('common.status')}
              </label>
              <select
                id="driver-status-filter"
                name="driver-status"
                className={selectClass}
                value={draftFilters.status}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    status: e.target.value as DriverListFilters['status'],
                  }))
                }
              >
                <option value="all">{t('drivers.allStatus')}</option>
                <option value="Available">{t('drivers.status.available')}</option>
                <option value="On Trip">{t('drivers.status.onTrip')}</option>
                <option value="Off Duty">{t('drivers.status.offDuty')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="driver-experience-filter"
                className="text-sm font-medium text-text-secondary"
              >
                {t('drivers.experience')}
              </label>
              <select
                id="driver-experience-filter"
                name="driver-experience"
                className={selectClass}
                value={draftFilters.experience}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    experience: e.target.value as DriverListFilters['experience'],
                  }))
                }
              >
                <option value="all">{t('drivers.allExperience')}</option>
                <option value="0-2">{t('drivers.experience.0-2')}</option>
                <option value="3-5">{t('drivers.experience.3-5')}</option>
                <option value="6+">{t('drivers.experience.6+')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="driver-license-filter"
                className="text-sm font-medium text-text-secondary"
              >
                {t('drivers.licenseStatus')}
              </label>
              <select
                id="driver-license-filter"
                name="driver-license"
                className={selectClass}
                value={draftFilters.licenseStatus}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    licenseStatus: e.target.value as DriverListFilters['licenseStatus'],
                  }))
                }
              >
                <option value="all">{t('drivers.allLicenseStatus')}</option>
                <option value="has">{t('drivers.license.has')}</option>
                <option value="missing">{t('drivers.license.missing')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
                onClick={handleApplyFilters}
              >
                <ListFilter className="h-4 w-4" />
                {t('common.applyFilters')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters && draftFilters.status === 'all' && draftFilters.experience === 'all' && draftFilters.licenseStatus === 'all'}
              >
                {t('common.reset')}
              </Button>
            </div>

            <Button type="button" variant="ghost" className="text-text-muted">
              <Download className="h-4 w-4" />
              {t('common.export')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-2xl">
            {t('drivers.listTitle')}
            {hasActiveFilters ? (
              <span className="ms-2 text-base font-normal text-text-muted">
                ({filteredDrivers.length}/{data.drivers.length})
              </span>
            ) : null}
          </CardTitle>
          <Button type="button" variant="ghost" className="shrink-0 text-text-muted" aria-label="Overview">
            <CircleGauge className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4">
          {data.drivers.length === 0 ? (
            <div className="rounded-lg border border-surface-muted bg-background p-6 text-center">
              <p className="font-medium text-text-primary">{t('drivers.emptyTitle')}</p>
              <p className="mt-2 text-sm text-text-muted">{t('drivers.emptyHint')}</p>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="rounded-lg border border-surface-muted bg-background p-6 text-center">
              <p className="text-sm text-text-muted">{t('drivers.noFilterResults')}</p>
              <Button type="button" variant="ghost" className="mt-3" onClick={handleResetFilters}>
                {t('common.reset')}
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDrivers.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  onView={(d) => {
                    void (async () => {
                      const fresh = await resolveDriver(d)
                      setProfileDriver(fresh)
                      setProfileOpen(true)
                    })()
                  }}
                  onEdit={(d) => {
                    void (async () => {
                      const fresh = await resolveDriver(d)
                      setDriverFormMode('edit')
                      setEditingDriver(fresh)
                      setFormError(null)
                      setDriverFormOpen(true)
                    })()
                  }}
                  onDelete={handleDeleteDriver}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
