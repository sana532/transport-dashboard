import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ComplaintBadge } from '@/modules/complaints/components/ComplaintBadge'
import type { ComplaintStatus } from '@/modules/complaints/types'
import { complaintStatusLabels } from '@/modules/complaints/types'
import { useComplaintDetail } from '@/modules/complaints/hooks/useComplaintDetail'
import { complaintDisplayType } from '@/modules/complaints/utils/mapCompanyComplaint'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

function DetailLoading() {
  return (
    <div className="space-y-5">
      <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-36 animate-pulse rounded-xl bg-surface-muted" />
    </div>
  )
}

function Field({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-secondary">{label}</p>
      <p className={cn('mt-1 text-sm text-text-primary', valueClassName)}>{value}</p>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  iconClassName,
  children,
}: {
  title: string
  icon: LucideIcon
  iconClassName: string
  children: ReactNode
}) {
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted pb-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconClassName)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-5 pt-5">{children}</CardContent>
    </Card>
  )
}

function InProgressStatusPill() {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-950">
      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-600" aria-hidden />
      {t('complaints.status.in_progress')}
    </span>
  )
}

export function ComplaintDetailsPage() {
  const { t } = useTranslation()
  const { complaintId } = useParams<{ complaintId: string }>()
  const { row, isLoading, error, reload } = useComplaintDetail(complaintId)
  const [statusDraft, setStatusDraft] = useState<ComplaintStatus>('open')

  useEffect(() => {
    if (row) setStatusDraft(row.status)
  }, [row])

  if (isLoading) return <DetailLoading />

  if (error || !row) {
    return (
      <Card className="shadow-md">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-red-700">{error ?? t('complaintDetails.errorNotFound')}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to={paths.company.complaints}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-text-secondary hover:bg-border/40"
            >
              {t('complaintDetails.backToComplaints')}
            </Link>
            <Button type="button" onClick={() => void reload()}>
              {t('common.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight text-text-primary">
            {t('complaintDetails.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t('complaintDetails.subtitle')}</p>
        </div>
        <Link
          to={paths.company.complaints}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-2.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-border/40 hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('complaintDetails.backToComplaints')}
        </Link>
      </div>

      <SectionCard
        title={t('complaintDetails.complaintInfo')}
        icon={AlertTriangle}
        iconClassName="bg-red-100 text-red-700"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('complaintDetails.complaintId')} value={row.complaintCode} />
          <Field label={t('complaintDetails.complaintType')} value={complaintDisplayType(row, t)} />
          <Field label={t('complaintDetails.complaintDate')} value={row.reportedAtDetailLabel} />
          <Field label={t('complaintDetails.relatedTrip')} value={`${row.relatedTripCode} (${row.relatedTripRoute})`} />
          <Field label={t('complaintDetails.assignedDriver')} value={row.assignedDriverName} />
        </div>
      </SectionCard>

      <SectionCard
        title={t('complaintDetails.descriptionTitle')}
        icon={FileText}
        iconClassName="bg-sky-100 text-sky-800"
      >
        <div className="rounded-lg border border-surface-muted bg-background p-4 text-sm leading-relaxed text-text-secondary">
          {row.description}
        </div>
      </SectionCard>

      <SectionCard
        title={t('complaintDetails.statusTitle')}
        icon={Clock}
        iconClassName="bg-amber-100 text-amber-800"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-text-secondary">{t('complaintDetails.currentStatus')}</p>
            <div className="mt-2">
              {statusDraft === 'in_progress' ? (
                <InProgressStatusPill />
              ) : (
                <ComplaintBadge status={statusDraft} />
              )}
            </div>
          </div>
          <div>
            <label htmlFor="complaint-status-update" className="text-sm font-semibold text-text-secondary">
              {t('complaintDetails.updateStatus')}
            </label>
            <select
              id="complaint-status-update"
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value as ComplaintStatus)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {(Object.keys(complaintStatusLabels) as ComplaintStatus[]).map((key) => (
                <option key={key} value={key}>
                  {complaintStatusLabels[key]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
              {t('complaintDetails.statusUpdateHint')}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
