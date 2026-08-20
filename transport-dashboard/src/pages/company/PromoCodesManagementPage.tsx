import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PromoLifecycleBadge } from '@/modules/promo-codes/components/PromoLifecycleBadge'
import { usePromoCodesManagement } from '@/modules/promo-codes/hooks/usePromoCodesManagement'
import type { PromoCodesStatVariant } from '@/modules/promo-codes/types'
import {
  defaultPromoListFilters,
  filterPromoCodes,
  type PromoListFilters,
} from '@/modules/promo-codes/utils/filterPromoCodes'
import { formatPromoDate } from '@/modules/promo-codes/utils/promoCodeDates'
import {
  formatPromoValue,
  promoDisplayName,
} from '@/modules/promo-codes/utils/mapCompanyPromoCode'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'

const selectClass =
  'w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function statCardClass(variant: PromoCodesStatVariant): string {
  if (variant === 'primary') return 'bg-[#2F3E1F] text-white border-[#2F3E1F]'
  if (variant === 'success') return 'border-l-4 border-l-green-500'
  if (variant === 'warning') return 'border-l-4 border-l-amber-500'
  return 'border-l-4 border-l-blue-500'
}

function PromoLoadingState({ message }: { message: string }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-text-muted">{message}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-surface shadow-sm" />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-xl border border-border bg-surface shadow-sm" />
    </div>
  )
}

function PromoErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function PromoCodesManagementPage() {
  const { t, locale } = useTranslation()
  const confirm = useConfirmDialog()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<PromoListFilters>(defaultPromoListFilters)
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error, reload, deletePromoCode } =
    usePromoCodesManagement(page)

  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'

  const filteredRows = useMemo(() => {
    if (!data) return []
    return filterPromoCodes(data.promoCodes, filters)
  }, [data, filters])

  const pagination = data?.pagination
  const lastPage = pagination?.lastPage ?? 1
  const safePage = Math.min(page, lastPage)

  useEffect(() => {
    if (!pagination) return
    if (page > pagination.lastPage) setPage(pagination.lastPage)
  }, [page, pagination])

  const visiblePages = useMemo(() => {
    if (!pagination) return [] as number[]
    const start = Math.max(1, Math.min(pagination.currentPage - 2, pagination.lastPage - 4))
    const end = Math.min(pagination.lastPage, start + 4)
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
  }, [pagination])

  const from = pagination?.from ?? (filteredRows.length === 0 ? 0 : 1)
  const to = pagination?.to ?? filteredRows.length
  const totalLabel = (pagination?.total ?? filteredRows.length).toLocaleString(dateLocale)

  const handleDelete = async (id: number, code: string) => {
    await confirm({
      title: t('common.confirmDeleteTitle'),
      description: t('promoCodes.confirmDelete', { code }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      action: () => deletePromoCode(id),
    })
  }

  if (error && !data) {
    return (
      <PromoErrorState
        message={error ?? t('promoCodes.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  if (isLoading && !data) return <PromoLoadingState message={t('common.loading')} />
  if (!data) return <PromoLoadingState message={t('common.loading')} />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
            {t('promoCodes.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t('promoCodes.subtitle')}</p>
        </div>
        <Button
          type="button"
          onClick={() => navigate(paths.company.promoCodeNew)}
          className="w-full shrink-0 bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[var(--brand-primary-dark)] sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('promoCodes.addNew')}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <Card key={stat.id} className={cn('shadow-md', statCardClass(stat.variant))}>
            <CardContent className="p-5">
              <p
                className={cn(
                  'text-sm font-medium',
                  stat.variant === 'primary' ? 'text-white/80' : 'text-text-muted',
                )}
              >
                {t(stat.titleKey)}
              </p>
              <p
                className={cn(
                  'mt-2 text-3xl font-semibold tracking-tight',
                  stat.variant === 'primary' ? 'text-white' : 'text-text-primary',
                )}
              >
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col gap-4 border-b border-surface-muted pb-4 lg:flex-row lg:items-end lg:justify-between">
          <CardTitle className="text-xl">{t('promoCodes.allCodes')}</CardTitle>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                <Search className="h-4 w-4 text-text-muted" aria-hidden />
              </span>
              <Input
                name="promo-search"
                placeholder={t('promoCodes.searchPlaceholder')}
                aria-label={t('promoCodes.searchAria')}
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <div className="relative w-full sm:max-w-[200px]">
              <label htmlFor="promo-status-filter" className="sr-only">
                {t('promoCodes.filterStatus')}
              </label>
              <select
                id="promo-status-filter"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: e.target.value as PromoListFilters['status'],
                  }))
                }
                className={selectClass}
              >
                <option value="all">{t('promoCodes.allStatus')}</option>
                <option value="active">{t('promoCodes.lifecycle.active')}</option>
                <option value="inactive">{t('promoCodes.lifecycle.inactive')}</option>
                <option value="expired">{t('promoCodes.lifecycle.expired')}</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-medium text-text-primary">{t('promoCodes.emptyTitle')}</p>
              <p className="mt-2 text-sm text-text-muted">{t('promoCodes.emptyHint')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="app-table w-full min-w-[1000px] text-left text-sm">
                  <thead className="border-y border-surface-muted bg-background text-text-muted">
                    <tr>
                      {[
                        t('promoCodes.col.code'),
                        t('promoCodes.col.name'),
                        t('promoCodes.col.discount'),
                        t('promoCodes.col.route'),
                        t('promoCodes.col.validity'),
                        t('common.status'),
                        t('common.actions'),
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-surface-muted text-text-secondary"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-text-primary">
                          {row.code}
                        </td>
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {promoDisplayName(row, locale)}
                        </td>
                        <td className="px-4 py-3">{formatPromoValue(row, t)}</td>
                        <td className="px-4 py-3">
                          {row.routeName ?? (row.routeId != null ? `#${row.routeId}` : t('promoCodes.allRoutes'))}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div>{formatPromoDate(row.validFrom, dateLocale)}</div>
                          <div className="text-text-muted">→ {formatPromoDate(row.validTo, dateLocale)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <PromoLifecycleBadge promo={row} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="rounded-lg p-1.5 text-text-primary hover:bg-surface-muted"
                              aria-label={t('promoCodes.aria.edit', { code: row.code })}
                              onClick={() => navigate(paths.company.promoCodeEdit(String(row.id)))}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                              aria-label={t('promoCodes.aria.delete', { code: row.code })}
                              onClick={() => void handleDelete(row.id, row.code)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-surface-muted px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-text-muted">
                  {t('promoCodes.pagination.showing', {
                    from,
                    to,
                    total: totalLabel,
                  })}
                  {isFetching ? ' …' : null}
                </p>
                {pagination && pagination.lastPage > 1 ? (
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      {t('common.previous')}
                    </Button>
                    {visiblePages.map((n) => (
                      <Button
                        key={n}
                        type="button"
                        variant={n === safePage ? 'primary' : 'outline'}
                        className="h-8 min-w-8 px-2 text-xs"
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      disabled={safePage >= lastPage}
                      onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    >
                      {t('common.next')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
