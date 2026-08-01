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
  const navigate = useNavigate()
  const { data, isLoading, error, reload, deletePlan } = usePackagesManagement()

  const handleDelete = async (planId: string) => {
    if (!window.confirm(t('packages.confirmDelete'))) return
    try {
      await deletePlan(planId)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('packages.errorDelete'))
    }
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
          <h1 className="text-[34px] font-semibold tracking-tight text-text-primary">
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
      )}
    </div>
  )
}
