import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, FileText, ImageIcon, type LucideIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ComplaintBadge } from '@/modules/complaints/components/ComplaintBadge'
import { ComplaintAttachments } from '@/modules/complaints/components/ComplaintAttachments'
import { usePlatformComplaintDetail } from '@/modules/complaints/hooks/usePlatformComplaintDetail'
import type { ComplaintStatus } from '@/modules/complaints/types'
import { COMPLAINT_STATUSES } from '@/modules/complaints/types'
import { complaintDisplayType } from '@/modules/complaints/utils/mapCompanyComplaint'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

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
  const { row, isLoading, isSaving, error, reload, updateStatus } =
    usePlatformComplaintDetail(complaintId)

  const [statusDraft, setStatusDraft] = useState<ComplaintStatus>('pending')
  const [adminNotesDraft, setAdminNotesDraft] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!row) return
    setStatusDraft(row.status)
    setAdminNotesDraft(row.adminNotes)
    setSaveSuccess(false)
  }, [row])

  async function handleSave() {
    if (!row) return
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateStatus({
        status: statusDraft,
        admin_notes: adminNotesDraft.trim() || undefined,
      })
      setSaveSuccess(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('complaintDetails.saveFailed'))
    }
  }

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

      <SectionCard
        title={t('complaintDetails.statusTitle')}
        icon={Clock}
        iconClassName="bg-amber-100 text-amber-800"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 border-b border-surface-muted pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-muted">{t('complaintDetails.statusUpdateHint')}</p>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="w-full shrink-0 bg-[#2F3E1F] px-6 py-2.5 text-white hover:bg-[#243217] disabled:opacity-70 sm:w-auto"
            >
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-text-secondary">
                {t('complaintDetails.currentStatus')}
              </p>
              <div className="mt-2">
                <ComplaintBadge status={row.status} />
              </div>
            </div>
            <div>
              <label
                htmlFor="platform-complaint-status-update"
                className="text-sm font-semibold text-text-secondary"
              >
                {t('complaintDetails.updateStatus')}
              </label>
              <select
                id="platform-complaint-status-update"
                value={statusDraft}
                onChange={(e) => {
                  setStatusDraft(e.target.value as ComplaintStatus)
                  setSaveSuccess(false)
                }}
                className={selectClass}
                disabled={isSaving}
              >
                {COMPLAINT_STATUSES.map((key) => (
                  <option key={key} value={key}>
                    {t(`complaints.status.${key}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="platform-complaint-admin-notes"
              className="text-sm font-semibold text-text-secondary"
            >
              {t('complaintDetails.adminNotes')}
            </label>
            <textarea
              id="platform-complaint-admin-notes"
              rows={4}
              value={adminNotesDraft}
              onChange={(e) => {
                setAdminNotesDraft(e.target.value)
                setSaveSuccess(false)
              }}
              disabled={isSaving}
              placeholder={t('complaintDetails.adminNotesPlaceholder')}
              className={cn(selectClass, 'mt-2 resize-y')}
            />
          </div>

          {saveError ? (
            <p className="text-sm text-red-700" role="alert">
              {saveError}
            </p>
          ) : null}
          {saveSuccess ? (
            <p className="text-sm text-green-700" role="status">
              {t('complaintDetails.saveSuccess')}
            </p>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}
