import { useEffect, useId, useState, type FormEvent } from 'react'
import { Building2, Languages, Loader2, Moon, Sun } from 'lucide-react'
import { useCompanyProfile } from '@/modules/companies/components/CompanyProfileProvider'
import { CompanyRating } from '@/modules/companies/components/CompanyRating'
import { usePreferences } from '@/shared/preferences/PreferencesProvider'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { useMediaImageSrc } from '@/shared/hooks/useMediaImageSrc'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'

function CoverPreview({ url, alt }: { url: string | null | undefined; alt: string }) {
  const { src, failed, onError } = useMediaImageSrc(url ?? undefined)
  if (!url || failed || !src) {
    return (
      <div className="flex h-36 w-full items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/40 text-text-muted">
        <Building2 className="h-8 w-8" aria-hidden />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={onError}
      className="h-36 w-full rounded-xl border border-border object-cover"
    />
  )
}

export function CompanySettingsPage() {
  const { t } = useTranslation()
  const { locale, setLocale, theme, toggleTheme } = usePreferences()
  const { profile, isLoading, isSaving, error, reload, updateProfile } = useCompanyProfile()

  const nameId = useId()
  const coverId = useId()

  const [name, setName] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.name === '—' ? '' : profile.name)
  }, [profile])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSuccess(null)

    const trimmed = name.trim()
    if (!trimmed) {
      setFormError(t('settings.profile.nameRequired'))
      return
    }

    try {
      await updateProfile({
        name: trimmed,
        coverImage: coverFile,
      })
      setCoverFile(null)
      setSuccess(t('settings.profile.saveSuccess'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('settings.profile.saveFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
          {t('settings.pageTitle')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('settings.pageSubtitle')}</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-brand-primary">
            <Building2 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings.profile.title')}</CardTitle>
            <p className="mt-1 text-sm text-text-muted">{t('settings.profile.hint')}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t('common.loading')}
            </div>
          ) : error && !profile ? (
            <div className="space-y-3 py-4">
              <p className="text-sm text-red-700">{error}</p>
              <Button type="button" variant="outline" onClick={() => void reload()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              <div>
                <p className="mb-2 text-sm font-semibold text-text-secondary">
                  {t('settings.profile.coverLabel')}
                </p>
                <CoverPreview
                  url={coverPreview ?? profile?.coverImageUrl}
                  alt={t('settings.profile.coverAlt')}
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label
                    htmlFor={coverId}
                    className="inline-flex cursor-pointer items-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-muted"
                  >
                    {t('settings.profile.coverChoose')}
                  </label>
                  <input
                    id={coverId}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                  />
                  {coverFile ? (
                    <button
                      type="button"
                      className="text-sm text-text-muted hover:text-text-primary"
                      onClick={() => setCoverFile(null)}
                    >
                      {t('settings.profile.coverClear')}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor={nameId} className="text-sm font-medium text-text-secondary">
                    {t('settings.profile.nameLabel')}
                  </label>
                  <Input
                    id={nameId}
                    name="company-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5"
                    autoComplete="organization"
                  />
                </div>

                {profile ? (
                  <div>
                    <p className="text-sm font-medium text-text-secondary">
                      {t('admin.companies.colRating')}
                    </p>
                    <div className="mt-1.5 text-sm text-text-primary">
                      <CompanyRating
                        averageRating={profile.averageRating}
                        totalRatings={profile.totalRatings}
                      />
                    </div>
                  </div>
                ) : null}

                {profile?.email && profile.email !== '—' ? (
                  <div>
                    <p className="text-sm font-medium text-text-secondary">
                      {t('settings.profile.emailLabel')}
                    </p>
                    <p className="mt-1.5 text-sm text-text-primary">{profile.email}</p>
                  </div>
                ) : null}

                {profile?.phone && profile.phone !== '—' ? (
                  <div>
                    <p className="text-sm font-medium text-text-secondary">
                      {t('settings.profile.phoneLabel')}
                    </p>
                    <p className="mt-1.5 text-sm text-text-primary" dir="ltr">
                      {profile.phone}
                    </p>
                  </div>
                ) : null}

                {profile?.address ? (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-text-secondary">
                      {t('settings.profile.addressLabel')}
                    </p>
                    <p className="mt-1.5 text-sm text-text-primary">{profile.address}</p>
                  </div>
                ) : null}
              </div>

              {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
              {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-brand-primary text-white hover:bg-brand-primary-dark"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {t('settings.profile.saving')}
                    </>
                  ) : (
                    t('settings.profile.save')
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-brand-primary">
            <Languages className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings.preferencesTitle')}</CardTitle>
            <p className="mt-1 text-sm text-text-muted">{t('settings.preferencesHint')}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div>
            <p className="text-sm font-semibold text-text-secondary">{t('settings.languageLabel')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={locale === 'ar' ? 'primary' : 'outline'}
                onClick={() => setLocale('ar')}
                aria-pressed={locale === 'ar'}
              >
                {t('settings.languageArabic')}
              </Button>
              <Button
                type="button"
                variant={locale === 'en' ? 'primary' : 'outline'}
                onClick={() => setLocale('en')}
                aria-pressed={locale === 'en'}
              >
                {t('settings.languageEnglish')}
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-secondary">{t('settings.themeLabel')}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {theme === 'dark' ? t('settings.themeDarkHint') : t('settings.themeLightHint')}
                </p>
                <p className="mt-2 text-xs font-medium text-text-secondary">
                  {theme === 'dark' ? t('settings.themeActiveDark') : t('settings.themeActiveLight')}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  theme === 'dark'
                    ? 'flex shrink-0 items-center gap-3 rounded-xl border border-amber-200/40 bg-amber-950/40 px-4 py-3 text-left text-amber-100 shadow-sm transition-colors hover:bg-amber-950/55'
                    : 'flex shrink-0 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-text-primary shadow-sm transition-colors hover:bg-surface-muted',
                )}
                aria-pressed={theme === 'dark'}
                aria-label={t('settings.themeLabel')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-6 w-6 shrink-0 text-amber-300" aria-hidden />
                ) : (
                  <Moon className="h-6 w-6 shrink-0 text-slate-600" aria-hidden />
                )}
                <span className="text-sm font-semibold">
                  {theme === 'dark' ? t('settings.themeActiveDark') : t('settings.themeActiveLight')}
                </span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
