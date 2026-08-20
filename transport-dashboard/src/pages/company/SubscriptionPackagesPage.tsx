import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SubscriptionPlanCard } from '@/modules/subscription-packages/components/SubscriptionPlanCard'
import { usePackagesManagement } from '@/modules/subscription-packages/hooks/usePackagesManagement'
import type { PackagesStatVariant } from '@/modules/subscription-packages/types'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'

function statCardClass(variant: PackagesStatVariant): string {
  if (variant === 'info') return 'border-l-4 border-l-blue-500'
  if (variant === 'success') return 'border-l-4 border-l-green-500'
  return 'border-l-4 border-l-violet-500'
}

function PackagesLoadingState({ message }: { message: string }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-text-muted">{message}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-surface shadow-sm" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-96 animate-pulse rounded-xl border border-border bg-surface shadow-sm" />
        ))}
      </div>
    </div>
  )
}

function PackagesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function SubscriptionPackagesPage() {
  const { t } = useTranslation()
  const confirm = useConfirmDialog()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error, reload, deletePlan } = usePackagesManagement(page)

  const pagination = data?.pagination
  const lastPage = pagination?.lastPage ?? 1

  useEffect(() => {
    if (!pagination) return
    if (page > pagination.lastPage) setPage(pagination.lastPage)
  }, [page, pagination])

  const visiblePages = useMemo(() => {
    if (!pagination) return [] as number[]
    const start = Math.max(1, Math.min(pagination.currentPage - 2, pagination.lastPage - 4))
    const end = Math.min(pagination.lastPage, start + 4)
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
  }, [pagination])

  const handleDelete = async (planId: string) => {
    await confirm({
      title: t('common.confirmDeleteTitle'),
      description: t('packages.confirmDelete'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      action: () => deletePlan(planId),
    })
  }

  if (isLoading) return <PackagesLoadingState message={t('common.loading')} />
  if (error || !data) {
    return (
      <PackagesErrorState
        message={error ?? t('packages.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
            {t('packages.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t('packages.subtitle')}</p>
        </div>
        <Button
          type="button"
          onClick={() => navigate(paths.company.packageNew)}
          className="w-full shrink-0 bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[var(--brand-primary-dark)] focus-visible:ring-[var(--brand-primary)] sm:w-auto sm:self-start"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('packages.addNew')}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {data.stats.map(({ titleKey, value, noteKey, variant, Icon }) => (
          <Card key={titleKey} className={cn('shadow-md', statCardClass(variant))}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-background p-2">
                  <Icon className="h-5 w-5 text-brand-primary" aria-hidden />
                </div>
                <p className="text-sm text-text-muted">{t(titleKey)}</p>
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-text-primary">{value}</p>
              <p className="mt-1 text-xs text-text-muted">{t(noteKey)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.plans.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-16 text-center">
            <p className="text-lg font-medium text-text-primary">{t('packages.emptyTitle')}</p>
            <p className="mt-2 text-sm text-text-muted">{t('packages.emptyHint')}</p>
            <Button
              type="button"
              className="mt-6 bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
              onClick={() => navigate(paths.company.packageNew)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('packages.addNew')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.plans.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              plan={plan}
              onOpenSubscribers={(id) => navigate(paths.company.packageSubscribers(id))}
              onEdit={(id) => navigate(paths.company.packageEdit(id))}
              onDelete={handleDelete}
            />
          ))}
        </div>
        {pagination && pagination.lastPage > 1 ? (
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-text-muted">
              {t('packages.pagination.showing', {
                from: pagination.from,
                to: pagination.to,
                total: pagination.total,
              })}
              {isFetching ? ' …' : null}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                {t('common.previous')}
              </Button>
              {visiblePages.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={n === page ? 'primary' : 'outline'}
                  className="h-8 min-w-8 px-2 text-xs"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2 text-xs"
                disabled={page >= lastPage}
                onClick={() => setPage((value) => Math.min(lastPage, value + 1))}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        ) : pagination ? (
          <p className="text-sm text-text-muted">
            {t('packages.pagination.showing', {
              from: pagination.from,
              to: pagination.to,
              total: pagination.total,
            })}
          </p>
        ) : null}
        </>
      )}
    </div>
  )
}
