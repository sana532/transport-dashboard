import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'
import { useCompanies } from '@/modules/companies/hooks/useCompanies'
import type { CompanyStatus, PlatformCompany } from '@/modules/companies/types'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'

const createBtnClass = cn(
  'inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold sm:w-auto',
  'bg-[#2F3E1F] text-white shadow-sm hover:bg-[#243217]',
)

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function StatusBadge({ status }: { status: PlatformCompany['status'] }) {
  const { t } = useTranslation()
  const label =
    status === 'active'
      ? t('common.active')
      : status === 'suspended'
        ? t('admin.companies.statusSuspended')
        : t('common.inactive')

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'active'
          ? 'bg-green-100 text-green-800'
          : status === 'suspended'
            ? 'bg-amber-100 text-amber-900'
            : 'bg-slate-100 text-slate-600',
      )}
    >
      {label}
    </span>
  )
}

export function CompaniesManagementPage() {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CompanyStatus | ''>('')

  const query = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
    }),
    [search, status],
  )

  const { companies, isLoading, error, reload } = useCompanies(query)

  function applySearch() {
    setSearch(searchInput.trim())
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t('admin.nav.tenants')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
            {t('admin.sidebar.companies')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            {t('admin.companies.subtitle')}
          </p>
        </div>
        <Link to={paths.admin.companyNew} className={createBtnClass}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin.companies.create')}
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
            <Building2 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-lg">{t('admin.companies.listTitle')}</CardTitle>
            <p className="mt-0.5 text-sm text-text-muted">{t('admin.companies.listHint')}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Input
                label={t('common.search')}
                name="company_search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applySearch()
                  }
                }}
                placeholder={t('admin.companies.searchPlaceholder')}
              />
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="company_status_filter" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('common.status')}
              </label>
              <select
                id="company_status_filter"
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as CompanyStatus | '')}
              >
                <option value="">{t('admin.companies.statusAll')}</option>
                <option value="active">{t('common.active')}</option>
                <option value="inactive">{t('common.inactive')}</option>
                <option value="suspended">{t('admin.companies.statusSuspended')}</option>
              </select>
            </div>
            <Button
              type="button"
              onClick={applySearch}
              className="w-full bg-[#2F3E1F] text-white hover:bg-[#243217] sm:w-auto"
            >
              {t('common.search')}
            </Button>
          </div>

          {error ? (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p role="alert">{error}</p>
              <Button type="button" variant="outline" onClick={() => void reload()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-text-muted">{t('admin.companies.loading')}</p>
          ) : companies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
              <p className="text-sm font-medium text-text-primary">
                {t('admin.companies.emptyTitle')}
              </p>
              <p className="mt-1 text-sm text-text-muted">{t('admin.companies.emptyHint')}</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="space-y-3 md:hidden">
                {companies.map((company) => (
                  <li
                    key={company.id}
                    className="rounded-xl border border-border bg-surface-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary">{company.name}</p>
                        <p className="mt-1 truncate text-sm text-text-secondary" dir="ltr">
                          {company.email}
                        </p>
                        <p className="mt-0.5 text-sm text-text-muted" dir="ltr">
                          {company.phone}
                        </p>
                      </div>
                      <StatusBadge status={company.status} />
                    </div>
                    <Link
                      to={paths.admin.companyDetails(String(company.id))}
                      className="mt-3 inline-flex font-medium text-[#2F3E1F] hover:underline"
                    >
                      {t('admin.companies.details')}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] text-start text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="pb-3 pe-4 font-medium">{t('admin.companies.colName')}</th>
                      <th className="pb-3 pe-4 font-medium">{t('admin.companies.colEmail')}</th>
                      <th className="pb-3 pe-4 font-medium">{t('admin.companies.colPhone')}</th>
                      <th className="pb-3 pe-4 font-medium">{t('common.status')}</th>
                      <th className="pb-3 font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b border-surface-muted last:border-0">
                        <td className="py-3 pe-4 font-medium text-text-primary">
                          {company.name}
                        </td>
                        <td className="py-3 pe-4 text-text-secondary">{company.email}</td>
                        <td className="py-3 pe-4 text-text-secondary">{company.phone}</td>
                        <td className="py-3 pe-4">
                          <StatusBadge status={company.status} />
                        </td>
                        <td className="py-3">
                          <Link
                            to={paths.admin.companyDetails(String(company.id))}
                            className="font-medium text-[#2F3E1F] hover:underline"
                          >
                            {t('admin.companies.details')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
