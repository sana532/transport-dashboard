import { ArrowLeft, Clock, FileText, ImageIcon, type LucideIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ComplaintBadge } from '@/modules/complaints/components/ComplaintBadge'
import { ComplaintAttachments } from '@/modules/complaints/components/ComplaintAttachments'
import { usePlatformComplaintDetail } from '@/modules/complaints/hooks/usePlatformComplaintDetail'
import { complaintDisplayType } from '@/modules/complaints/utils/mapCompanyComplaint'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

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
  children: React.ReactNode
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

export function PlatformComplaintDetailsPage() {
  const { t } = useTranslation()
  const { complaintId } = useParams<{ complaintId: string }>()
  const { row, isLoading, error, reload } = usePlatformComplaintDetail(complaintId)

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-surface-muted" />
      </div>
    )
  }

  if (error || !row) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-red-700" role="alert">
            {error ?? t('complaints.errorUnavailable')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void reload()}
              className="bg-[#2F3E1F] text-white hover:bg-[#243217]"
            >
              {t('common.retry')}
            </Button>
            <Link to={paths.admin.complaints}>
              <Button type="button" variant="outline">
                {t('common.back')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={paths.admin.complaints}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2F3E1F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('common.back')}
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t('admin.nav.support')}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {row.complaintCode}
          </h1>
          <ComplaintBadge status={row.status} />
        </div>
        <p className="mt-1 text-sm text-text-muted">
          {row.companyName
            ? `${row.companyName}${row.companyId != null ? ` (#${row.companyId})` : ''}`
            : row.companyId != null
              ? `Company #${row.companyId}`
              : t('admin.sidebar.companies')}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface-muted/40 px-4 py-3 text-sm text-text-muted">
        {t('admin.complaints.readOnlyNote')}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title={t('complaintDetails.passengerInfo')}
          icon={FileText}
          iconClassName="bg-[#2F3E1F]/10 text-[#2F3E1F]"
        >
          <Field label={t('complaints.col.passengerName')} value={row.passengerName || '—'} />
          <Field label={t('complaints.col.phoneNumber')} value={row.phone || '—'} valueClassName="font-mono" />
          <Field label={t('complaints.col.complaintType')} value={complaintDisplayType(row, t)} />
          <Field label={t('complaintDetails.complaintDate')} value={row.reportedAtDetailLabel || row.reportedAtLabel || '—'} />
        </SectionCard>

        <SectionCard
          title={t('complaintDetails.relatedTrip')}
          icon={Clock}
          iconClassName="bg-sky-100 text-sky-800"
        >
          <Field
            label={t('complaintDetails.relatedTrip')}
            value={`${row.relatedTripCode || '—'} (${row.relatedTripRoute || '—'})`}
          />
          <Field label={t('complaintDetails.assignedDriver')} value={row.assignedDriverName || '—'} />
          <Field
            label={t('admin.sidebar.companies')}
            value={row.companyName || (row.companyId != null ? `#${row.companyId}` : '—')}
          />
        </SectionCard>
      </div>

      <SectionCard
        title={t('complaintDetails.descriptionTitle')}
        icon={FileText}
        iconClassName="bg-amber-100 text-amber-900"
      >
        <p className="whitespace-pre-wrap text-sm text-text-primary">{row.description || '—'}</p>
        {row.adminNotes ? (
          <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t('complaintDetails.adminNotes')}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{row.adminNotes}</p>
          </div>
        ) : null}
      </SectionCard>

      {row.attachments.length > 0 ? (
        <SectionCard
          title={t('complaintDetails.attachmentsTitle')}
          icon={ImageIcon}
          iconClassName="bg-violet-100 text-violet-800"
        >
          <ComplaintAttachments attachments={row.attachments} />
        </SectionCard>
      ) : null}
    </div>
  )
}
