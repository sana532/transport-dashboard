import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Eye, Pencil, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ComplaintBadge } from '@/modules/complaints/components/ComplaintBadge'
import {
  defaultComplaintsListFilters,
  useComplaintsManagement,
  type ComplaintsListFilters,
} from '@/modules/complaints/hooks/useComplaintsManagement'
import { complaintDisplayType } from '@/modules/complaints/utils/mapCompanyComplaint'
import { COMPLAINT_STATUSES } from '@/modules/complaints/types'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { useTranslation } from '@/shared/i18n/useTranslation'

type StatusFilter = ComplaintsListFilters['status']
type CategoryFilter = ComplaintsListFilters['categoryId']

function ComplaintsLoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-16 w-72 animate-pulse rounded-lg bg-surface-muted" />
      <div className="h-[420px] animate-pulse rounded-xl bg-surface-muted" />
    </div>
  )
}

function ComplaintsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function ComplaintsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(defaultComplaintsListFilters.status)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(defaultComplaintsListFilters.categoryId)
  const [page, setPage] = useState(1)

  const apiFilters = useMemo<ComplaintsListFilters>(
    () => ({ status: statusFilter, categoryId: categoryFilter }),
    [statusFilter, categoryFilter],
  )

  const { data, isLoading, error, reload } = useComplaintsManagement(apiFilters)

  const pageSize = data?.pageSize ?? 6

  const filteredRows = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.rows.filter((row) => {
      if (!q) return true
      const hay = `${row.complaintCode} ${row.passengerName} ${row.phone} ${row.id} ${row.categoryLabel}`.toLowerCase()
      return hay.includes(q)
    })
  }, [data, search])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, categoryFilter])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount))
  }, [pageCount])

  const safePage = Math.min(page, pageCount)
  const sliceStart = (safePage - 1) * pageSize
  const pageRows = filteredRows.slice(sliceStart, sliceStart + pageSize)

  const from = filteredRows.length === 0 ? 0 : sliceStart + 1
  const to = sliceStart + pageRows.length

  if (isLoading) return <ComplaintsLoadingState />
  if (error || !data) {
    return (
      <ComplaintsErrorState
        message={error ?? t('complaints.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[34px] font-semibold tracking-tight text-text-primary">
          {t('complaints.title')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {t('complaints.subtitle')}
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col gap-4 border-b border-surface-muted pb-4 lg:flex-row lg:items-end lg:justify-between">
          <CardTitle className="text-xl">{t('complaints.allComplaints')}</CardTitle>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:max-w-2xl">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                <Search className="h-4 w-4 text-text-muted" aria-hidden />
              </span>
              <Input
                name="complaint-search"
                placeholder={t('complaints.searchPlaceholder')}
                aria-label={t('complaints.searchAria')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative w-full sm:max-w-[200px]">
              <label htmlFor="complaint-status-filter" className="sr-only">
                {t('complaints.filterByStatus')}
              </label>
              <select
                id="complaint-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <option value="all">{t('complaints.allStatus')}</option>
                {COMPLAINT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`complaints.status.${status}`)}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
            </div>
            {data.categories.length > 0 ? (
              <div className="relative w-full sm:max-w-[220px]">
                <label htmlFor="complaint-category-filter" className="sr-only">
                  {t('complaints.filterByCategory')}
                </label>
                <select
                  id="complaint-category-filter"
                  value={categoryFilter === 'all' ? 'all' : String(categoryFilter)}
                  onChange={(e) => {
                    const value = e.target.value
                    setCategoryFilter(value === 'all' ? 'all' : Number(value))
                  }}
                  className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <option value="all">{t('complaints.allCategories')}</option>
                  {data.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden
                />
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-y border-surface-muted bg-background text-text-muted">
                <tr>
                  {[
                    t('complaints.col.complaintId'),
                    t('complaints.col.passengerName'),
                    t('complaints.col.phoneNumber'),
                    t('complaints.col.complaintType'),
                    t('complaints.col.date'),
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
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-muted">
                      {t('complaints.empty')}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                  <tr key={row.id} className="border-b border-surface-muted text-text-secondary">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-text-primary">
                      {row.complaintCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">{row.passengerName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.phone}</td>
                    <td className="px-4 py-3">{complaintDisplayType(row, t)}</td>
                    <td className="px-4 py-3">{row.reportedAtLabel}</td>
                    <td className="px-4 py-3">
                      <ComplaintBadge status={row.status} variant="text" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-text-primary hover:bg-surface-muted"
                          aria-label={`${t('complaints.aria.view')} ${row.complaintCode}`}
                          onClick={() => navigate(paths.company.complaintDetails(row.id))}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                          aria-label={`${t('complaints.aria.edit')} ${row.complaintCode}`}
                          onClick={() => navigate(paths.company.complaintDetails(row.id))}
                        >
                          <Pencil className="h-4 w-4" />
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
              {t('complaints.pagination.showing', { from, to, total: filteredRows.length.toLocaleString() })}
            </p>
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
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
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
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
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
