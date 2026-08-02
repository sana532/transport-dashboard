import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Eye, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ComplaintBadge } from '@/modules/complaints/components/ComplaintBadge'
import {
  defaultPlatformComplaintsFilters,
  usePlatformComplaints,
  type PlatformComplaintsListFilters,
} from '@/modules/complaints/hooks/usePlatformComplaints'
import { complaintDisplayType } from '@/modules/complaints/utils/mapCompanyComplaint'
import { COMPLAINT_STATUSES } from '@/modules/complaints/types'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

export function PlatformComplaintsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<PlatformComplaintsListFilters['status']>('all')
  const [categoryFilter, setCategoryFilter] =
    useState<PlatformComplaintsListFilters['categoryId']>('all')
  const [companyId, setCompanyId] = useState('')
  const [appliedCompanyId, setAppliedCompanyId] = useState('')
  const [page, setPage] = useState(1)

  const apiFilters = useMemo<PlatformComplaintsListFilters>(
    () => ({
      status: statusFilter,
      categoryId: categoryFilter,
      companyId: appliedCompanyId,
    }),
    [statusFilter, categoryFilter, appliedCompanyId],
  )

  const { data, isLoading, error, reload } = usePlatformComplaints(apiFilters)
  const pageSize = data?.pageSize ?? 10

  const filteredRows = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.rows.filter((row) => {
      if (!q) return true
      const hay =
        `${row.complaintCode} ${row.passengerName} ${row.phone} ${row.id} ${row.categoryLabel} ${row.companyName ?? ''} ${row.companyId ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [data, search])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, categoryFilter, appliedCompanyId])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount))
  }, [pageCount])

  const safePage = Math.min(page, pageCount)
  const sliceStart = (safePage - 1) * pageSize
  const pageRows = filteredRows.slice(sliceStart, sliceStart + pageSize)
  const from = filteredRows.length === 0 ? 0 : sliceStart + 1
  const to = sliceStart + pageRows.length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t('admin.nav.support')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
          {t('admin.sidebar.complaints')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">
          {t('admin.overview.complaintsDesc')}
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
            <Button
              type="button"
              onClick={() => void reload()}
              className="bg-[#2F3E1F] text-white hover:bg-[#243217]"
            >
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader className="flex flex-col gap-4 border-b border-surface-muted pb-4">
            <CardTitle className="text-xl">{t('complaints.allComplaints')}</CardTitle>
            <div className="grid gap-3 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
                <span className="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center ps-3">
                  <Search className="h-4 w-4 text-text-muted" aria-hidden />
                </span>
                <Input
                  name="platform-complaint-search"
                  placeholder={t('complaints.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-9"
                />
              </div>
              <div className="relative">
                <select
                  className={selectClass}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as PlatformComplaintsListFilters['status'])
                  }
                >
                  <option value="all">{t('complaints.allStatus')}</option>
                  {COMPLAINT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t(`complaints.status.${status}`)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
              <div className="relative">
                <select
                  className={selectClass}
                  value={categoryFilter === 'all' ? 'all' : String(categoryFilter)}
                  onChange={(e) => {
                    const value = e.target.value
                    setCategoryFilter(value === 'all' ? 'all' : Number(value))
                  }}
                  disabled={!data?.categories.length}
                >
                  <option value="all">{t('complaints.allCategories')}</option>
                  {(data?.categories ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 sm:max-w-xs">
                <Input
                  label={t('admin.complaints.companyId')}
                  name="company_id"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder={t('admin.complaints.companyIdOptional')}
                  inputMode="numeric"
                />
              </div>
              <Button
                type="button"
                className="bg-[#2F3E1F] text-white hover:bg-[#243217]"
                onClick={() => setAppliedCompanyId(companyId.trim())}
              >
                {t('common.applyFilters')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatusFilter(defaultPlatformComplaintsFilters.status)
                  setCategoryFilter(defaultPlatformComplaintsFilters.categoryId)
                  setCompanyId('')
                  setAppliedCompanyId('')
                  setSearch('')
                }}
              >
                {t('common.reset')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-text-muted">{t('admin.companies.loading')}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="app-table w-full min-w-[960px] text-start text-sm">
                    <thead className="border-y border-surface-muted bg-background text-text-muted">
                      <tr>
                        {[
                          t('complaints.col.complaintId'),
                          t('admin.sidebar.companies'),
                          t('complaints.col.passengerName'),
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
                          <tr
                            key={row.id}
                            className="border-b border-surface-muted text-text-secondary"
                          >
                            <td className="px-4 py-3 font-mono text-xs font-medium text-text-primary">
                              {row.complaintCode}
                            </td>
                            <td className="px-4 py-3">
                              {row.companyName ||
                                (row.companyId != null ? `#${row.companyId}` : '—')}
                            </td>
                            <td className="px-4 py-3 font-medium text-text-primary">
                              {row.passengerName}
                            </td>
                            <td className="px-4 py-3">{complaintDisplayType(row, t)}</td>
                            <td className="px-4 py-3">{row.reportedAtLabel}</td>
                            <td className="px-4 py-3">
                              <ComplaintBadge status={row.status} variant="text" />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                className="rounded-lg p-1.5 text-text-primary hover:bg-surface-muted"
                                aria-label={`${t('complaints.aria.view')} ${row.complaintCode}`}
                                onClick={() =>
                                  navigate(paths.admin.complaintDetails(String(row.id)))
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-surface-muted px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-text-muted">
                    {t('complaints.pagination.showing', {
                      from,
                      to,
                      total: filteredRows.length.toLocaleString(),
                    })}
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
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
