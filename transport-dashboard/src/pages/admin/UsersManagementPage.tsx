import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { usePlatformUsers } from '@/modules/users/hooks/usePlatformUsers'
import {
  PLATFORM_USER_ROLES,
  PLATFORM_USER_STATUSES,
  type PlatformUser,
  type PlatformUserStatus,
} from '@/modules/users/types'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function StatusBadge({ status }: { status: PlatformUser['status'] }) {
  const { t } = useTranslation()
  const label =
    status === 'active'
      ? t('common.active')
      : status === 'suspended'
        ? t('admin.users.statusSuspended')
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

function FlagPill({ active, label }: { active: boolean; label: string }) {
  if (!active) return null
  return (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
      {label}
    </span>
  )
}

export function UsersManagementPage() {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<PlatformUserStatus | ''>('')
  const [companyIdInput, setCompanyIdInput] = useState('')
  const [companyId, setCompanyId] = useState<number | undefined>()
  const [adminFlagged, setAdminFlagged] = useState<'all' | 'true' | 'false'>('all')
  const [isBanned, setIsBanned] = useState<'all' | 'true' | 'false'>('all')

  const query = useMemo(
    () => ({
      search: search || undefined,
      role: role || undefined,
      status: status || undefined,
      company_id: companyId,
      admin_flagged: adminFlagged === 'all' ? undefined : adminFlagged === 'true',
      is_banned: isBanned === 'all' ? undefined : isBanned === 'true',
    }),
    [search, role, status, companyId, adminFlagged, isBanned],
  )

  const { users, isLoading, error, reload } = usePlatformUsers(query)

  function applyFilters() {
    setSearch(searchInput.trim())
    const parsed = Number(companyIdInput.trim())
    setCompanyId(
      companyIdInput.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t('admin.nav.access')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
          {t('admin.sidebar.users')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('admin.users.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
            <Users className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-lg">{t('admin.users.listTitle')}</CardTitle>
            <p className="mt-0.5 text-sm text-text-muted">{t('admin.users.listHint')}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Input
              label={t('common.search')}
              name="user_search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyFilters()
                }
              }}
              placeholder={t('admin.users.searchPlaceholder')}
            />
            <div>
              <label htmlFor="user_role_filter" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('admin.users.colRole')}
              </label>
              <select
                id="user_role_filter"
                className={selectClass}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">{t('admin.users.roleAll')}</option>
                {PLATFORM_USER_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {t(`admin.users.role.${value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="user_status_filter" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('common.status')}
              </label>
              <select
                id="user_status_filter"
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as PlatformUserStatus | '')}
              >
                <option value="">{t('admin.users.statusAll')}</option>
                {PLATFORM_USER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value === 'active'
                      ? t('common.active')
                      : value === 'suspended'
                        ? t('admin.users.statusSuspended')
                        : t('common.inactive')}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t('admin.users.colCompanyId')}
              name="user_company_id"
              value={companyIdInput}
              onChange={(e) => setCompanyIdInput(e.target.value)}
              placeholder="e.g. 1"
            />
            <div>
              <label htmlFor="user_flagged_filter" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('admin.users.colFlagged')}
              </label>
              <select
                id="user_flagged_filter"
                className={selectClass}
                value={adminFlagged}
                onChange={(e) => setAdminFlagged(e.target.value as 'all' | 'true' | 'false')}
              >
                <option value="all">{t('admin.users.filterAll')}</option>
                <option value="true">{t('admin.users.filterYes')}</option>
                <option value="false">{t('admin.users.filterNo')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="user_banned_filter" className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t('admin.users.colBanned')}
              </label>
              <select
                id="user_banned_filter"
                className={selectClass}
                value={isBanned}
                onChange={(e) => setIsBanned(e.target.value as 'all' | 'true' | 'false')}
              >
                <option value="all">{t('admin.users.filterAll')}</option>
                <option value="true">{t('admin.users.filterYes')}</option>
                <option value="false">{t('admin.users.filterNo')}</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={applyFilters}
                className="w-full bg-[#2F3E1F] text-white hover:bg-[#243217]"
              >
                {t('common.search')}
              </Button>
            </div>
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
            <p className="text-sm text-text-muted">{t('admin.users.loading')}</p>
          ) : users.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
              <p className="text-sm font-medium text-text-primary">{t('admin.users.emptyTitle')}</p>
              <p className="mt-1 text-sm text-text-muted">{t('admin.users.emptyHint')}</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="space-y-3 md:hidden">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className="rounded-xl border border-border bg-surface-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary">{user.name}</p>
                        <p className="mt-1 truncate text-sm text-text-secondary" dir="ltr">
                          {user.email}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-text-muted" dir="ltr">
                          {user.phone_number}
                        </p>
                      </div>
                      <StatusBadge status={user.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                      <span>{user.role}</span>
                      <span className="text-text-muted">·</span>
                      <span>
                        {t('admin.users.colScore')}: {user.score != null ? user.score : '—'}
                      </span>
                    </div>
                    {user.admin_flagged || user.is_banned ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <FlagPill active={user.admin_flagged} label={t('admin.users.colFlagged')} />
                        <FlagPill active={user.is_banned} label={t('admin.users.colBanned')} />
                      </div>
                    ) : null}
                    <Link
                      to={paths.admin.userDetails(String(user.id))}
                      className="mt-3 inline-flex font-medium text-[#2F3E1F] hover:underline"
                    >
                      {t('admin.users.details')}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="app-table w-full min-w-[800px] text-start text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="pb-3 pe-4 font-medium">{t('admin.users.colName')}</th>
                      <th className="pb-3 pe-4 font-medium">{t('admin.users.colContact')}</th>
                      <th className="pb-3 pe-4 font-medium">{t('admin.users.colRole')}</th>
                      <th className="pb-3 pe-4 font-medium">{t('common.status')}</th>
                      <th className="pb-3 pe-4 font-medium">{t('admin.users.colScore')}</th>
                      <th className="pb-3 pe-4 font-medium">{t('admin.users.colFlags')}</th>
                      <th className="pb-3 font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-surface-muted last:border-0">
                        <td className="py-3 pe-4 font-medium text-text-primary">{user.name}</td>
                        <td className="py-3 pe-4 text-text-secondary">
                          <div>{user.email}</div>
                          <div className="font-mono text-xs text-text-muted">{user.phone_number}</div>
                        </td>
                        <td className="py-3 pe-4 text-text-secondary">{user.role}</td>
                        <td className="py-3 pe-4">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="py-3 pe-4 text-text-secondary">
                          {user.score != null ? user.score : '—'}
                        </td>
                        <td className="py-3 pe-4">
                          {user.admin_flagged || user.is_banned ? (
                            <div className="flex flex-wrap gap-1">
                              <FlagPill active={user.admin_flagged} label={t('admin.users.colFlagged')} />
                              <FlagPill active={user.is_banned} label={t('admin.users.colBanned')} />
                            </div>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <Link
                            to={paths.admin.userDetails(String(user.id))}
                            className="font-medium text-[#2F3E1F] hover:underline"
                          >
                            {t('admin.users.details')}
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
