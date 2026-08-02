import { Languages, Moon, Sun } from 'lucide-react'
import { usePreferences } from '@/shared/preferences/PreferencesProvider'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'

export function AdminSettingsPage() {
  const { t } = useTranslation()
  const { locale, setLocale, theme, toggleTheme } = usePreferences()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
          {t('settings.pageTitle')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('settings.pageSubtitleAdmin')}</p>
      </div>

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
                className={
                  theme === 'dark'
                    ? 'flex shrink-0 items-center gap-3 rounded-xl border border-amber-200/40 bg-amber-950/40 px-4 py-3 text-left text-amber-100 shadow-sm transition-colors hover:bg-amber-950/55'
                    : 'flex shrink-0 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-text-primary shadow-sm transition-colors hover:bg-surface-muted'
                }
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
