import { useEffect, useId, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Menu, X } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { NotificationBell } from '@/modules/notifications/components/NotificationBell'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/ui/Button'

export type AppShellNavItem = {
  to: string
  label: string
  end?: boolean
  /** Optional icon (e.g. from `lucide-react`) */
  Icon?: LucideIcon
  /**
   * Optional group label. When set and different from the previous item's
   * section, a small heading is rendered above the link.
   */
  section?: string
}

type AppShellProps = {
  /** Items shown in the sidebar, in order */
  navItems: AppShellNavItem[]
  /** Small label above the section title (e.g. product name) */
  brandLabel: string
  /** Main sidebar heading (e.g. Company / Admin) */
  sectionTitle: string
  /**
   * `company`: sidebar + top bar use brand primary (#2F3E1F) with white text.
   * `neutral`: light sidebar + light top bar (legacy admin-style shell).
   */
  variant?: 'company' | 'neutral'
}

function SidebarBrand({
  brandLabel,
  sectionTitle,
  isCompany,
  trailing,
}: {
  brandLabel: string
  sectionTitle: string
  isCompany: boolean
  trailing?: ReactNode
}) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 flex shrink-0 items-start justify-between gap-2 border-b px-4 py-4',
        isCompany ? 'border-white/15 bg-[#2F3E1F]' : 'border-border bg-surface',
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-wide',
            isCompany ? 'text-white/80' : 'text-text-muted',
          )}
        >
          {brandLabel}
        </p>
        <p
          className={cn(
            'mt-0.5 text-sm font-medium',
            isCompany ? 'text-white' : 'text-text-primary',
          )}
        >
          {sectionTitle}
        </p>
      </div>
      {trailing}
    </div>
  )
}

function SidebarNav({
  navItems,
  isCompany,
  onNavigate,
}: {
  navItems: AppShellNavItem[]
  isCompany: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-2">
      {navItems.map(({ to, label, end = false, Icon, section }, index) => {
        const prevSection = index > 0 ? navItems[index - 1]?.section : undefined
        const showSection = Boolean(section && section !== prevSection)

        return (
          <div key={to} className={cn(showSection && index > 0 && 'mt-3')}>
            {showSection ? (
              <p
                className={cn(
                  'px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider',
                  isCompany ? 'text-white/50' : 'text-text-muted',
                )}
              >
                {section}
              </p>
            ) : null}
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isCompany
                    ? isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/90 hover:bg-white/10'
                    : isActive
                      ? 'bg-surface-muted text-text-primary'
                      : 'text-text-secondary hover:bg-surface-muted',
                )
              }
            >
              {Icon ? <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden /> : null}
              <span className="min-w-0">{label}</span>
            </NavLink>
          </div>
        )
      })}
    </nav>
  )
}

export function AppShell({
  navItems,
  brandLabel,
  sectionTitle,
  variant = 'company',
}: AppShellProps) {
  const { logout } = useAuth()
  const { t } = useTranslation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const navTitleId = useId()

  const isCompany = variant === 'company'

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false)
    }
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [mobileNavOpen])

  const asideSurface = cn(
    'flex h-full w-56 flex-col overflow-y-auto border-e',
    isCompany
      ? 'border-[#243217] bg-[#2F3E1F] text-white'
      : 'border-border bg-surface text-text-primary',
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — unchanged layout from lg up */}
      <aside className={cn(asideSurface, 'hidden shrink-0 lg:flex')}>
        <SidebarBrand
          brandLabel={brandLabel}
          sectionTitle={sectionTitle}
          isCompany={isCompany}
        />
        <SidebarNav navItems={navItems} isCompany={isCompany} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          mobileNavOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity',
            mobileNavOpen ? 'opacity-100' : 'opacity-0',
          )}
          aria-label={t('common.closeMenu')}
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          id={navTitleId}
          role="dialog"
          aria-modal="true"
          aria-label={sectionTitle}
          className={cn(
            asideSurface,
            'absolute inset-y-0 start-0 z-10 shadow-xl transition-transform duration-200 ease-out',
            mobileNavOpen
              ? 'translate-x-0'
              : '-translate-x-full rtl:translate-x-full',
          )}
        >
          <SidebarBrand
            brandLabel={brandLabel}
            sectionTitle={sectionTitle}
            isCompany={isCompany}
            trailing={
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'rounded-lg p-1.5 transition-colors',
                  isCompany
                    ? 'text-white/90 hover:bg-white/10'
                    : 'text-text-secondary hover:bg-surface-muted',
                )}
                aria-label={t('common.closeMenu')}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            }
          />
          <SidebarNav
            navItems={navItems}
            isCompany={isCompany}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </aside>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className={cn(
            'flex h-14 shrink-0 items-center gap-1 border-b px-4 sm:px-6',
            isCompany
              ? 'border-[#243217] bg-[#2F3E1F] text-white'
              : 'border-border bg-surface',
          )}
        >
          <button
            type="button"
            className={cn(
              'rounded-lg p-2 transition-colors lg:hidden',
              isCompany
                ? 'text-white hover:bg-white/10'
                : 'text-text-secondary hover:bg-surface-muted',
            )}
            aria-label={t('common.openMenu')}
            aria-expanded={mobileNavOpen}
            aria-controls={navTitleId}
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <div className="ms-auto flex items-center gap-1">
            <NotificationBell variant={variant} />
            <Button
              type="button"
              variant="ghost"
              onClick={() => logout()}
              className={
                isCompany
                  ? 'text-white hover:bg-white/10 focus-visible:ring-white/40'
                  : undefined
              }
            >
              {t('common.signOut')}
            </Button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
