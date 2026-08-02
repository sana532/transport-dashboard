import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, Pause, Play, Plus, Search, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { usePackageSubscribersManagement } from '@/modules/subscription-packages/hooks/usePackageSubscribersManagement'
import type {
  PackageSubscriberRow,
  PackageSubscriberRowStatus,
  PackageSubscribersStatVariant,
} from '@/modules/subscription-packages/types'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { useMediaImageSrc } from '@/shared/hooks/useMediaImageSrc'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'w-full appearance-none rounded-lg border border-border bg-surface py-2 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function statCardClass(variant: PackageSubscribersStatVariant): string {
  if (variant === 'info') return 'border-s-4 border-s-blue-500'
  if (variant === 'success') return 'border-s-4 border-s-green-500'
  if (variant === 'danger') return 'border-s-4 border-s-red-500'
  return 'border-s-4 border-s-sky-500'
}

function valueClass(variant: PackageSubscribersStatVariant): string {
  if (variant === 'success') return 'text-green-700'
  if (variant === 'danger') return 'text-red-600'
  if (variant === 'month') return 'text-blue-600'
  return 'text-text-primary'
}

function statusBadgeClass(status: PackageSubscriberRowStatus): string {
  if (status === 'active') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
  return 'bg-red-50 text-red-700 ring-1 ring-red-200/80'
}

function subscriberInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function SubscriberAvatar({ row }: { row: PackageSubscriberRow }) {
  const { src, failed, onError } = useMediaImageSrc(row.avatarUrl)
  const initials = subscriberInitials(row.name)

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        onError={onError}
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    )
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F3E1F] to-[#4a6330] text-xs font-semibold text-white shadow-sm">
      {initials || '?'}
    </div>
  )
}

function SubscriberTableRow({
  row,
  t,
}: {
  row: PackageSubscriberRow
  t: (key: string) => string
}) {
  return (
    <tr className="border-b border-surface-muted text-text-secondary transition-colors last:border-b-0 hover:bg-table-rowHover">
      <td className="px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <SubscriberAvatar row={row} />
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">{row.name}</p>
            <p className="mt-0.5 truncate text-xs text-text-muted sm:hidden" dir="ltr">
              {row.phone}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3.5 sm:table-cell">
        <span className="inline-block rounded-md bg-surface-muted px-2.5 py-1 font-mono text-xs text-text-primary" dir="ltr">
          {row.phone}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-text-primary">{row.subscriptionDate}</td>
      <td className="whitespace-nowrap px-4 py-3.5 text-text-primary">{row.expirationDate}</td>
      <td className="px-4 py-3.5">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
            statusBadgeClass(row.status),
          )}
        >
          {row.status === 'active' ? t('common.active') : t('common.expired')}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          {row.status === 'active' ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100"
              aria-label={t('packageSubscribers.aria.pauseSubscription')}
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
              aria-label={t('packageSubscribers.aria.resumeSubscription')}
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
            aria-label={t('packageSubscribers.aria.removeSubscriber')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function SubscribersLoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-16 w-64 animate-pulse rounded-lg bg-surface-muted" />
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-xl bg-surface-muted" />
    </div>
  )
}

function SubscribersErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function PackageSubscribersPage() {
  const { t, locale } = useTranslation()
  const { packageId } = useParams<{ packageId: string }>()
  const { data, isLoading, error, reload } = usePackageSubscribersManagement(packageId)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PackageSubscriberRowStatus>('all')
  const [page, setPage] = useState(1)
  const isRtl = locale === 'ar'

  const filteredRows = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!q) return true
      return `${row.name} ${row.phone} ${row.id}`.toLowerCase().includes(q)
    })
  }, [data, search, statusFilter])

  const pageSize = data?.pageSize ?? 10
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  if (isLoading) return <SubscribersLoadingState />
  if (error || !data) {
    return (
      <SubscribersErrorState
        message={error ?? t('packageSubscribers.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  const from = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, filteredRows.length)

  return (
    <div className="space-y-5">
      <div>
        <Link
          to={paths.company.subscriptionPackages}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft className={cn('h-4 w-4 shrink-0', isRtl && 'rotate-180')} aria-hidden />
          {t('packageSubscribers.backToPackages')}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
              {t('packageSubscribers.title')}
            </h1>
            <p className="mt-1 text-lg font-medium text-text-secondary">{data.packageTitle}</p>
            {(data.planCreatedAtLabel || data.planValidityNote) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.planCreatedAtLabel ? (
                  <span className="inline-flex items-center rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">{t('packages.createdAt')}:</span>
                    <span className="ms-1.5">{data.planCreatedAtLabel}</span>
                  </span>
                ) : null}
                {data.planValidityNote ? (
                  <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900">
                    <span className="font-semibold">{t('packages.passExpiry')}:</span>
                    <span className="ms-1.5">{data.planValidityNote}</span>
                  </span>
                ) : null}
                {data.planUpdatedAtLabel ? (
                  <span className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text-muted">
                    {t('packages.lastUpdated')}: {data.planUpdatedAtLabel}
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <Button
            type="button"
            className="w-full shrink-0 bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[var(--brand-primary-dark)] sm:w-auto sm:self-start"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('packageSubscribers.addSubscriber')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map(({ title, value, note, variant, Icon }) => (
          <Card key={title} className={cn('shadow-sm', statCardClass(variant))}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-background p-2.5 shadow-sm">
                  <Icon className="h-5 w-5 text-brand-primary" aria-hidden />
                </div>
                <p className="text-sm font-medium text-text-muted">{title}</p>
              </div>
              <p className={cn('mt-4 text-3xl font-semibold tabular-nums', valueClass(variant))}>
                {value}
              </p>
              <p className="mt-1 text-xs text-text-muted">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden shadow-md">
        <CardHeader className="flex flex-col gap-4 border-b border-surface-muted bg-surface-muted/30 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">{t('packageSubscribers.listTitle')}</CardTitle>
            <span className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-semibold text-brand-primary">
              {filteredRows.length}
            </span>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:max-w-2xl">
            <div className="relative flex-1">
              <span
                className={cn(
                  'pointer-events-none absolute inset-y-0 z-10 flex items-center text-text-muted',
                  isRtl ? 'right-0 pr-3' : 'left-0 pl-3',
                )}
              >
                <Search className="h-4 w-4" aria-hidden />
              </span>
              <Input
                name="subscriber-search"
                placeholder={t('packageSubscribers.searchPlaceholder')}
                aria-label={t('packageSubscribers.searchAria')}
                className={isRtl ? 'pr-9' : 'pl-9'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="relative w-full sm:max-w-[180px]">
              <label htmlFor="subscriber-status-filter" className="sr-only">
                {t('common.status')}
              </label>
              <select
                id="subscriber-status-filter"
                name="subscriber-status-filter"
                className={cn(selectClass, isRtl ? 'pl-9 pr-3' : 'pl-3 pr-9')}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | PackageSubscriberRowStatus)
                  setPage(1)
                }}
              >
                <option value="all">{t('packageSubscribers.allStatus')}</option>
                <option value="active">{t('common.active')}</option>
                <option value="expired">{t('common.expired')}</option>
              </select>
              <ChevronDown
                className={cn(
                  'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted',
                  isRtl ? 'left-3' : 'right-3',
                )}
                aria-hidden
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="app-table w-full min-w-[760px] text-start text-sm">
              <thead className="border-b border-surface-muted bg-background text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  {[
                    t('packageSubscribers.col.subscriber'),
                    t('packageSubscribers.col.phone'),
                    t('packageSubscribers.col.subscriptionDate'),
                    t('packageSubscribers.col.expirationDate'),
                    t('common.status'),
                    t('common.actions'),
                  ].map((h, index) => (
                    <th
                      key={h}
                      className={cn(
                        'px-4 py-3 font-semibold',
                        index === 1 && 'hidden sm:table-cell',
                        index >= 5 && 'w-[120px]',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <p className="text-sm font-medium text-text-secondary">
                        {t('packageSubscribers.empty')}
                      </p>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => <SubscriberTableRow key={row.id} row={row} t={t} />)
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-surface-muted bg-surface-muted/20 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-text-muted">
              {t('packageSubscribers.pagination.showing', {
                from,
                to,
                total: filteredRows.length.toLocaleString(),
              })}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('common.previous')}
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={n === currentPage ? 'primary' : 'outline'}
                  className="h-8 min-w-8 px-2 text-xs"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
