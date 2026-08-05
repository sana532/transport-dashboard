import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Shield, UserRound } from 'lucide-react'
import { usePlatformUserDetail } from '@/modules/users/hooks/usePlatformUserDetail'
import type { PlatformUserStatus, UpdatePlatformUserInput } from '@/modules/users/types'
import { PLATFORM_USER_STATUSES } from '@/modules/users/types'
import { useUserRoleLabel } from '@/modules/users/utils/useUserRoleLabel'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function emptyForm(): UpdatePlatformUserInput {
  return {
    name: '',
    email: '',
    phone_number: '',
    gender: '',
    address: '',
    city: '',
    status: 'active',
  }
}

export function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>()
  const { t, locale } = useTranslation()
  const roleLabel = useUserRoleLabel()
  const {
    user,
    reliability,
    isLoading,
    isSaving,
    error,
    reload,
    updateUser,
    updateReliability,
    resetReliability,
  } = usePlatformUserDetail(userId)

  const [form, setForm] = useState<UpdatePlatformUserInput>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [reliabilityError, setReliabilityError] = useState<string | null>(null)
  const [reliabilitySuccess, setReliabilitySuccess] = useState<string | null>(null)
  const [adminFlagged, setAdminFlagged] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name === '—' ? '' : user.name,
      email: user.email === '—' ? '' : user.email,
      phone_number: user.phone_number === '—' ? '' : user.phone_number,
      gender: user.gender ?? '',
      address: user.address ?? '',
      city: user.city ?? '',
      status: user.status,
    })
    setAdminFlagged(reliability?.admin_flagged ?? user.admin_flagged)
  }, [user, reliability])

  const bannedUntilRaw = reliability?.banned_until ?? user?.banned_until ?? null
  const bannedUntilDate = bannedUntilRaw ? new Date(bannedUntilRaw) : null
  const bannedUntilLabel =
    bannedUntilDate && !Number.isNaN(bannedUntilDate.getTime())
      ? bannedUntilDate.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : ''

  function updateField<K extends keyof UpdatePlatformUserInput>(
    key: K,
    value: UpdatePlatformUserInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmitProfile(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!form.name.trim() || !form.email.trim() || !form.phone_number.trim()) {
      setFormError(t('admin.users.formRequired'))
      return
    }

    try {
      await updateUser(form)
      setFormSuccess(t('admin.users.updateSuccess'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.users.updateFailed'))
    }
  }

  async function onSaveReliability() {
    setReliabilityError(null)
    setReliabilitySuccess(null)
    try {
      await updateReliability({ admin_flagged: adminFlagged })
      setReliabilitySuccess(t('admin.users.reliabilityUpdateSuccess'))
    } catch (err) {
      setReliabilityError(
        err instanceof Error ? err.message : t('admin.users.reliabilityUpdateFailed'),
      )
    }
  }

  async function onClearBan() {
    setReliabilityError(null)
    setReliabilitySuccess(null)
    try {
      await updateReliability({ clear_ban: true })
      setReliabilitySuccess(t('admin.users.clearBanSuccess'))
    } catch (err) {
      setReliabilityError(
        err instanceof Error ? err.message : t('admin.users.reliabilityUpdateFailed'),
      )
    }
  }

  async function onResetReliability() {
    if (!window.confirm(t('admin.users.resetConfirm'))) return
    setReliabilityError(null)
    setReliabilitySuccess(null)
    try {
      await resetReliability()
      setReliabilitySuccess(t('admin.users.resetSuccess'))
    } catch (err) {
      setReliabilityError(err instanceof Error ? err.message : t('admin.users.resetFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={paths.admin.users}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2F3E1F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('admin.users.backToList')}
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t('admin.nav.access')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
          {user?.name ?? t('admin.users.detailsTitle')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('admin.users.detailsSubtitle')}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">{t('admin.users.loading')}</p>
      ) : error || !user ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-red-700" role="alert">
              {error ?? t('admin.users.notFound')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void reload()}
                className="bg-[#2F3E1F] text-white hover:bg-[#243217]"
              >
                {t('common.retry')}
              </Button>
              <Link to={paths.admin.users}>
                <Button type="button" variant="outline">
                  {t('admin.users.backToList')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm text-text-muted">
            <span className="rounded-lg border border-border bg-surface-muted/50 px-2.5 py-1">
              {t('admin.users.colRole')}: {roleLabel(user.role)}
            </span>
            {user.company_id != null ? (
              <span className="rounded-lg border border-border bg-surface-muted/50 px-2.5 py-1">
                {t('admin.users.colCompanyId')}: {user.company_name ?? `#${user.company_id}`}
              </span>
            ) : null}
            <span className="rounded-lg border border-border bg-surface-muted/50 px-2.5 py-1">
              {t('admin.users.colScore')}:{' '}
              {reliability?.score ?? user.score ?? '—'}
            </span>
          </div>

          {formError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {formError}
            </p>
          ) : null}
          {formSuccess ? (
            <p
              className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              role="status"
            >
              {formSuccess}
            </p>
          ) : null}

          <form className="space-y-5" onSubmit={onSubmitProfile} noValidate>
            <Card className="border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
                  <UserRound className="h-5 w-5" aria-hidden />
                </span>
                <CardTitle className="text-base font-semibold text-text-primary">
                  {t('admin.users.profileTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                <Input
                  label={t('admin.users.colName')}
                  name="user_name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
                <Input
                  label={t('admin.users.colEmail')}
                  name="user_email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                />
                <Input
                  label={t('admin.users.colPhone')}
                  name="user_phone"
                  value={form.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value)}
                  required
                />
                <div>
                  <label htmlFor="user_gender" className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('admin.users.colGender')}
                  </label>
                  <select
                    id="user_gender"
                    className={selectClass}
                    value={form.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                  >
                    <option value="">{t('admin.users.genderUnset')}</option>
                    <option value="male">{t('admin.users.genderMale')}</option>
                    <option value="female">{t('admin.users.genderFemale')}</option>
                    <option value="other">{t('admin.users.genderOther')}</option>
                  </select>
                </div>
                <Input
                  label={t('admin.users.colCity')}
                  name="user_city"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                />
                <div>
                  <label htmlFor="user_status" className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('common.status')}
                  </label>
                  <select
                    id="user_status"
                    className={selectClass}
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value as PlatformUserStatus)}
                  >
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
                  label={t('admin.users.colAddress')}
                  name="user_address"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="sm:col-span-2"
                />
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#2F3E1F] text-white hover:bg-[#243217] sm:w-auto"
              >
                {isSaving ? t('common.saving') : t('common.saveChanges')}
              </Button>
            </div>
          </form>

          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                <Shield className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-text-primary">
                  {t('admin.users.reliabilityTitle')}
                </CardTitle>
                <p className="mt-0.5 text-sm text-text-muted">{t('admin.users.reliabilityHint')}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {t('admin.users.colScore')}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">
                    {reliability?.score ?? user.score ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {t('admin.users.colFlagged')}
                  </p>
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    {(reliability?.admin_flagged ?? user.admin_flagged)
                      ? t('admin.users.filterYes')
                      : t('admin.users.filterNo')}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {t('admin.users.colBanned')}
                  </p>
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    {(reliability?.is_banned ?? user.is_banned)
                      ? t('admin.users.filterYes')
                      : t('admin.users.filterNo')}
                  </p>
                  {bannedUntilLabel ? (
                    <p className="mt-1 text-xs text-text-muted">
                      {t('admin.users.bannedUntil')}: {bannedUntilLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              {reliability?.notes ? (
                <p className="rounded-lg border border-border bg-surface-muted/30 px-3 py-2 text-sm text-text-secondary">
                  {reliability.notes}
                </p>
              ) : null}

              <label className={cn('flex items-center gap-2 text-sm text-text-primary')}>
                <input
                  type="checkbox"
                  checked={adminFlagged}
                  onChange={(e) => setAdminFlagged(e.target.checked)}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-border"
                />
                {t('admin.users.adminFlaggedLabel')}
              </label>

              {reliabilityError ? (
                <p className="text-sm text-red-700" role="alert">
                  {reliabilityError}
                </p>
              ) : null}
              {reliabilitySuccess ? (
                <p className="text-sm text-green-700" role="status">
                  {reliabilitySuccess}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void onSaveReliability()}
                  className="w-full bg-[#2F3E1F] text-white hover:bg-[#243217] sm:w-auto"
                >
                  {t('admin.users.saveReliability')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || !(reliability?.is_banned ?? user.is_banned)}
                  onClick={() => void onClearBan()}
                  className="w-full sm:w-auto"
                >
                  {t('admin.users.clearBan')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => void onResetReliability()}
                  className="w-full sm:w-auto"
                >
                  {t('admin.users.resetReliability')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
