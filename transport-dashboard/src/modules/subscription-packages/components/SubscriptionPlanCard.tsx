import { Check, Pencil, Trash2, Users } from 'lucide-react'
import type { PlanTheme, SubscriptionPlanCard as Plan } from '@/modules/subscription-packages/types'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

const headerSurface: Record<PlanTheme, string> = {
  sky: 'bg-sky-100 text-sky-950',
  emerald: 'bg-emerald-100 text-emerald-950',
  violet: 'bg-violet-100 text-violet-950',
  amber: 'bg-amber-100 text-amber-950',
  indigo: 'bg-indigo-100 text-indigo-950',
  slate: 'bg-slate-200 text-slate-800',
}

type SubscriptionPlanCardProps = {
  plan: Plan
  onOpenSubscribers: (packageId: string) => void
  onEdit: (packageId: string) => void
  onDelete: (packageId: string) => void
}

export function SubscriptionPlanCard({
  plan,
  onOpenSubscribers,
  onEdit,
  onDelete,
}: SubscriptionPlanCardProps) {
  const { t } = useTranslation()
  const inactive = plan.status === 'inactive'

  const open = () => onOpenSubscribers(plan.id)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('packages.aria.openSubscribers', { name: plan.name })}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      className="w-full cursor-pointer rounded-xl text-left transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
    >
      <Card
        className={cn(
          'overflow-hidden border border-border shadow-md transition-opacity',
          inactive && 'opacity-75',
        )}
      >
        <div
          className={cn(
            'relative px-4 pb-4 pt-9',
            headerSurface[plan.theme],
            inactive && 'grayscale-[0.35]',
          )}
        >
          {plan.isPopular ? (
            <span className="absolute right-3 top-3 rounded-full bg-[var(--brand-primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              {t('packages.popular')}
            </span>
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-lg font-semibold leading-tight">{plan.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/70 px-2 py-0.5 text-xs font-medium text-text-secondary shadow-sm ring-1 ring-black/5">
                  {plan.billing === 'monthly'
                    ? t('addPackage.monthly')
                    : t('addPackage.yearly')}
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    plan.status === 'active' ? 'text-green-700' : 'text-slate-500',
                  )}
                >
                  {plan.status === 'active' ? t('common.active') : t('common.inactive')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums leading-none">{plan.priceDisplay}</p>
              {plan.savingsNote ? (
                <p className="mt-1 text-xs font-medium opacity-90">{plan.savingsNote}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-surface px-4 py-4">
          <ul className="space-y-2.5">
            {plan.features.map((line) => (
              <li key={line} className="flex gap-2 text-sm text-text-secondary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-surface-muted pt-3 text-sm">
            <span className="text-text-muted">{t('packages.activeSubscribers')}</span>
            <span className="font-semibold tabular-nums text-text-primary">
              {plan.activeSubscribers.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-border bg-background text-text-secondary sm:flex-none sm:min-w-[5.5rem]"
              onClick={(e) => {
                e.stopPropagation()
                open()
              }}
            >
              <Users className="h-4 w-4" aria-hidden />
              {t('packages.viewSubscribers')}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] sm:flex-none sm:min-w-[5.5rem]"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(plan.id)
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {t('common.edit')}
            </Button>
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              aria-label={t('packages.aria.delete', { name: plan.name })}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(plan.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
