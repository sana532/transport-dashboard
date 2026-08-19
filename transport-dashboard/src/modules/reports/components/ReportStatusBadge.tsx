import type { ReportStatus } from '@/modules/reports/types'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

const pillStyles: Record<ReportStatus, string> = {
  pending: 'bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-100',
  processing: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  completed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-100',
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        pillStyles[status],
      )}
    >
      {t(`reports.status.${status}`)}
    </span>
  )
}
