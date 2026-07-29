import type { ComplaintStatus } from '@/modules/complaints/types'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

type ComplaintBadgeProps = {
  status: ComplaintStatus
  variant?: 'pill' | 'text'
}

const pillStyles: Record<ComplaintStatus, string> = {
  pending: 'bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-100',
  open: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-100',
  in_progress: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  resolved: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
  closed: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-100',
}

const textStyles: Record<ComplaintStatus, string> = {
  pending: 'text-slate-600',
  open: 'text-red-600',
  in_progress: 'text-amber-800',
  resolved: 'text-green-700',
  closed: 'text-zinc-600',
}

export function ComplaintBadge({ status, variant = 'pill' }: ComplaintBadgeProps) {
  const { t } = useTranslation()
  const label = t(`complaints.status.${status}`)
  if (variant === 'text') {
    return (
      <span className={cn('text-sm font-medium tabular-nums', textStyles[status])}>{label}</span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        pillStyles[status],
      )}
    >
      {label}
    </span>
  )
}
