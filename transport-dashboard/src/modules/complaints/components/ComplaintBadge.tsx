import type { ComplaintStatus } from '@/modules/complaints/types'
import { complaintStatusLabels } from '@/modules/complaints/types'
import { cn } from '@/shared/utils/cn'

type ComplaintBadgeProps = {
  status: ComplaintStatus
  variant?: 'pill' | 'text'
}

const pillStyles: Record<ComplaintStatus, string> = {
  open: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-100',
  in_progress: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  resolved: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
}

const textStyles: Record<ComplaintStatus, string> = {
  open: 'text-red-600',
  in_progress: 'text-amber-800',
  resolved: 'text-green-700',
}

export function ComplaintBadge({ status, variant = 'pill' }: ComplaintBadgeProps) {
  const label = complaintStatusLabels[status]
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
