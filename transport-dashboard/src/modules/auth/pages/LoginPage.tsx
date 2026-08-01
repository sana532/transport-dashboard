import { type FormEvent, useId, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Languages } from 'lucide-react'
import { authService } from '@/modules/auth/services/authService'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { usePreferences } from '@/shared/preferences/PreferencesProvider'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Card, CardContent } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'
import loginIllustration from '@/assets/images/login-illustration.png'

function homePathByRole(role: 'admin' | 'company'): string {
  return role === 'admin' ? paths.admin.root : paths.company.root
}

function BusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )
}

function LoginArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
      />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  )
}

const inputFocusClass =
  'focus-visible:border-ring focus-visible:ring-ring/25'

export function LoginPage() {
  const { isAuthenticated, login, role } = useAuth()
  const navigate = useNavigate()
  const { t, locale } = useTranslation()
  const { setLocale } = usePreferences()
  const emailId = useId()
  const passwordId = useId()
  const isRtl = locale === 'ar'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (isAuthenticated && role) {
    return <Navigate to={homePathByRole(role)} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const { token, role: nextRole } = await authService.login({
        email,
        password,
      })
      login(token, nextRole)
      const next = homePathByRole(nextRole)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorFallback'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid min-h-svh w-full grid-cols-1 overflow-x-hidden overflow-y-auto bg-background md:grid-cols-2">
      {/* Illustration (tablet/desktop) */}
      <div className="login-animate-panel relative hidden min-h-svh overflow-hidden bg-[#F2F2EE] md:flex">
        <img
          src={loginIllustration}
          alt=""
          className="h-full w-full min-h-full object-cover object-center"
        />
      </div>

      {/* Login form column */}
      <div className="relative flex min-h-svh flex-col justify-between px-6 py-5 sm:px-8 sm:py-6">
        <div className="absolute end-6 top-5 z-10 sm:end-8 sm:top-6 login-animate-footer">
          <div
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5 shadow-sm"
            role="group"
            aria-label={t('login.language')}
          >
            <Languages className="ms-1 h-3 w-3 text-text-muted" aria-hidden />
            <button
              type="button"
              onClick={() => setLocale('ar')}
              aria-pressed={isRtl}
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors duration-200',
                isRtl
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
              )}
            >
              {t('settings.languageArabic')}
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              aria-pressed={!isRtl}
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors duration-200',
                !isRtl
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
              )}
            >
              {t('settings.languageEnglish')}
            </button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-start -translate-y-3 pt-0">
          <header className="login-animate-brand mb-3 flex flex-col items-center gap-2 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary">
                <BusIcon className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 max-w-[420px] text-center">
                <p className="mt-2 text-[32px] leading-normal text-gray-700">
                  <span className="block">{t('login.brandTitleLine1')}</span>
                  <span className="block">{t('login.brandTitleLine2')}</span>
                </p>
                <p className="mt-2 text-sm leading-normal text-text-muted">
                  {t('login.brandSubtitle')}
                </p>
              </div>
            </div>
          </header>

          <Card className="login-animate-form h-[390px] w-[420px] max-w-full border-border shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
            <CardContent className="flex h-full flex-col p-4 sm:p-5">
              <form className="space-y-3" onSubmit={onSubmit} noValidate>
                <div>
                  <label
                    htmlFor={emailId}
                    className="mb-1.5 block text-xs font-medium text-text-secondary"
                  >
                    {t('login.usernameLabel')}
                  </label>
                  <div className="relative">
                    <MailIcon className="pointer-events-none absolute start-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-text-muted" />
                    <Input
                      id={emailId}
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      placeholder={t('login.usernamePlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      label={undefined}
                      required
                      className={cn('py-1.5 ps-10', inputFocusClass)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={passwordId}
                    className="mb-1.5 block text-sm font-medium text-text-secondary"
                  >
                    {t('login.passwordLabel')}
                  </label>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute start-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-text-muted" />
                    <Input
                      id={passwordId}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={t('login.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      label={undefined}
                      required
                      className={cn('py-1.5 ps-10 pe-10', inputFocusClass)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors duration-200 hover:bg-surface-muted hover:text-text-secondary focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring/30"
                      aria-label={
                        showPassword ? t('login.hidePassword') : t('login.showPassword')
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-brand-primary focus:ring-ring/30"
                    />
                    {t('login.rememberMe')}
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring/30"
                    onClick={() => {
                      /* Wire to forgot-password route when available */
                    }}
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>

                {error ? (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  disabled={pending}
                  className={cn(
                    'h-[52px] w-[382px] max-w-full self-center rounded-lg border-0 !bg-[#2F3E1F] text-[15px] font-semibold !text-white shadow-sm',
                    'hover:!bg-[#243217] focus-visible:ring-ring disabled:!bg-[#2F3E1F] disabled:!text-white disabled:opacity-100',
                  )}
                >
                  <LoginArrowIcon
                    className={cn('h-5 w-5 shrink-0', isRtl && 'rotate-180')}
                  />
                  {pending ? t('login.submitting') : t('login.submit')}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-text-muted">
                  <ShieldIcon className="h-4 w-4 shrink-0 text-text-muted" />
                  {t('login.secureNote')}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <footer className="login-animate-footer mx-auto mt-5 w-full max-w-[448px] pb-1 text-center text-xs text-text-muted md:mt-0">
          {t('login.copyright')}
        </footer>
      </div>
    </div>
  )
}
