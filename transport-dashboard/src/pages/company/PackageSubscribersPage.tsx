import { useMemo, useState } from 'react'
import { ArrowLeft, Pause, Play, Plus, Search, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { usePackageSubscribersManagement } from '@/modules/subscription-packages/hooks/usePackageSubscribersManagement'
import type {
  PackageSubscriberRowStatus,
  PackageSubscribersStatVariant,
} from '@/modules/subscription-packages/types'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

function statCardClass(variant: PackageSubscribersStatVariant): string {
  if (variant === 'info') return 'border-l-4 border-l-blue-500'
  if (variant === 'success') return 'border-l-4 border-l-green-500'
  if (variant === 'danger') return 'border-l-4 border-l-red-500'
  return 'border-l-4 border-l-sky-500'
}

function valueClass(variant: PackageSubscribersStatVariant): string {
  if (variant === 'success') return 'text-green-700'
  if (variant === 'danger') return 'text-red-600'
  if (variant === 'month') return 'text-blue-600'
  return 'text-text-primary'
}

function statusBadgeClass(status: PackageSubscriberRowStatus): string {
  if (status === 'active') return 'bg-green-100 text-green-800'
  return 'bg-red-100 text-red-700'
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
  const { t } = useTranslation()
  const { packageId } = useParams<{ packageId: string }>()
  const { data, isLoading, error, reload } = usePackageSubscribersManagement(packageId)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PackageSubscriberRowStatus>('all')
  const [page, setPage] = useState(1)

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
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {t('packageSubscribers.backToPackages')}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight text-text-primary">
              {t('packageSubscribers.title')}
            </h1>
            <p className="mt-1 text-lg font-medium text-text-secondary">{data.packageTitle}</p>
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
          <Card key={title} className={cn('shadow-md', statCardClass(variant))}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-background p-2">
                  <Icon className="h-5 w-5 text-brand-primary" aria-hidden />
                </div>
                <p className="text-sm text-text-muted">{title}</p>
              </div>
              <p className={cn('mt-3 text-3xl font-semibold tabular-nums', valueClass(variant))}>
                {value}
              </p>
              <p className="mt-1 text-xs text-text-muted">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col gap-4 border-b border-surface-muted pb-4 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="text-xl">{t('packageSubscribers.listTitle')}</CardTitle>
          <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                <Search className="h-4 w-4 text-text-muted" aria-hidden />
              </span>
              <Input
                name="subscriber-search"
                placeholder={t('packageSubscribers.searchPlaceholder')}
                aria-label={t('packageSubscribers.searchAria')}
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:max-w-[160px]">
              <label htmlFor="subscriber-status-filter" className="text-sm font-medium text-text-secondary">
                {t('common.status')}
              </label>
              <select
                id="subscriber-status-filter"
                name="subscriber-status-filter"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-y border-surface-muted bg-background text-text-muted">
                <tr>
                  {[t('packageSubscribers.col.subscriber'), t('packageSubscribers.col.phone'), t('packageSubscribers.col.subscriptionDate'), t('packageSubscribers.col.expirationDate'), t('common.status'), t('common.actions')].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-muted">
                      {t('packageSubscribers.empty')}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                  <tr key={row.id} className="border-b border-surface-muted text-text-secondary">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {row.avatarUrl ? (
                          <img
                            src={row.avatarUrl}
                            alt={row.name}
                            className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-black/10"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-brand-primary">
                            {row.name
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                        )}
                        <span className="font-medium text-text-primary">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.phone}</td>
                    <td className="px-4 py-3">{row.subscriptionDate}</td>
                    <td className="px-4 py-3">{row.expirationDate}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium',
                          statusBadgeClass(row.status),
                        )}
                      >
                        {row.status === 'active' ? t('common.active') : t('common.expired')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.status === 'active' ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                            aria-label={t('packageSubscribers.aria.pauseSubscription')}
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                            aria-label={t('packageSubscribers.aria.resumeSubscription')}
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                          aria-label={t('packageSubscribers.aria.removeSubscriber')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-surface-muted px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-text-muted">
              {t('packageSubscribers.pagination.showing', { from, to, total: filteredRows.length.toLocaleString() })}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2 text-xs"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('common.previous')}
              </Button>
              <span className="px-2 text-xs text-text-muted">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2 text-xs"
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
