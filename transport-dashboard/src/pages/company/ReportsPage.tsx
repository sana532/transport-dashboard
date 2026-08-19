import { useMemo, useState } from 'react'
import { ChevronDown, Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { ReportStatusBadge } from '@/modules/reports/components/ReportStatusBadge'
import { useReports } from '@/modules/reports/hooks/useReports'
import { REPORT_TYPES, type ReportType } from '@/modules/reports/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { useToast } from '@/shared/ui/Toast'
import { formatInstantDateTime } from '@/shared/utils/formatDateTime'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from: toDateInputValue(from), to: toDateInputValue(to) }
}

function ReportsLoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-16 w-72 animate-pulse rounded-lg bg-surface-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-[360px] animate-pulse rounded-xl bg-surface-muted" />
    </div>
  )
}

function ReportsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm text-red-700">{message}</p>
        <Button
          onClick={onRetry}
          className="bg-brand-primary text-white hover:bg-brand-primary-dark"
        >
          {t('common.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

function reportTypeLabel(type: string, t: (key: string) => string): string {
  const key = `reports.type.${type}`
  const label = t(key)
  return label === key ? type : label
}

export function ReportsPage() {
  const { t, locale } = useTranslation()
  const { toast } = useToast()
  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'
  const defaults = useMemo(() => defaultDateRange(), [])

  const [type, setType] = useState<ReportType>('bookings')
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    reports,
    isLoading,
    exporting,
    downloadingId,
    error,
    reload,
    exportReport,
    downloadReport,
  } = useReports()

  const handleExport = async () => {
    setFormError(null)
    if (!from || !to) {
      setFormError(t('reports.validation.datesRequired'))
      return
    }
    if (from > to) {
      setFormError(t('reports.validation.rangeInvalid'))
      return
    }

    try {
      await exportReport({ type, from, to })
      toast({
        title: t('reports.exportQueued'),
        description: t('reports.exportQueuedHint'),
        variant: 'success',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('reports.errorExport')
      setFormError(message)
      toast({ title: t('reports.errorExport'), description: message, variant: 'error' })
    }
  }

  const handleDownload = async (id: number) => {
    const report = reports.find((row) => row.id === id)
    if (!report) return
    try {
      await downloadReport(report)
    } catch (err) {
      toast({
        title: t('reports.errorDownload'),
        description: err instanceof Error ? err.message : t('reports.errorDownload'),
        variant: 'error',
      })
    }
  }

  if (isLoading) return <ReportsLoadingState />
  if (error && reports.length === 0) {
    return <ReportsErrorState message={error} onRetry={() => void reload()} />
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
          {t('reports.title')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('reports.subtitle')}</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">{t('reports.generateTitle')}</CardTitle>
          <p className="mt-1 text-sm text-text-muted">{t('reports.generateHint')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="report-type" className="text-sm font-medium text-text-secondary">
                {t('reports.col.type')}
              </label>
              <div className="relative">
                <select
                  id="report-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ReportType)}
                  className={selectClass}
                >
                  {REPORT_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {t(`reports.type.${value}`)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden
                />
              </div>
            </div>
            <Input
              id="report-from"
              label={t('reports.from')}
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              id="report-to"
              label={t('reports.to')}
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full bg-brand-primary text-white hover:bg-brand-primary-dark"
                disabled={exporting}
                onClick={() => void handleExport()}
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t('reports.exporting')}
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4" aria-hidden />
                    {t('reports.exportCta')}
                  </>
                )}
              </Button>
            </div>
          </div>
          {formError ? (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">{t('reports.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="app-table w-full min-w-[760px] text-left text-sm">
              <thead className="border-y border-surface-muted bg-background text-text-muted">
                <tr>
                  {[
                    t('reports.col.type'),
                    t('reports.col.period'),
                    t('reports.col.file'),
                    t('common.status'),
                    t('reports.col.createdAt'),
                    t('common.actions'),
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-muted">
                      {t('reports.empty')}
                    </td>
                  </tr>
                ) : (
                  reports.map((row) => (
                    <tr key={row.id} className="border-b border-surface-muted text-text-secondary">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {reportTypeLabel(row.type, t)}
                      </td>
                      <td className="px-4 py-3">
                        {row.from && row.to ? `${row.from} – ${row.to}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{row.fileName || '—'}</td>
                      <td className="px-4 py-3">
                        <ReportStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        {row.createdAt ? formatInstantDateTime(row.createdAt, dateLocale) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                          disabled={!row.canDownload || downloadingId === row.id}
                          onClick={() => void handleDownload(row.id)}
                        >
                          {downloadingId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <Download className="h-4 w-4" aria-hidden />
                          )}
                          {t('reports.download')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
