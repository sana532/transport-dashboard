import type { LucideIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/ui/Button'

export type AppShellNavItem = {
  to: string
  label: string
  end?: boolean
  /** Optional icon (e.g. from `lucide-react`) */
  Icon?: LucideIcon
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

export function AppShell({
  navItems,
  brandLabel,
  sectionTitle,
  variant = 'company',
}: AppShellProps) {
  const { logout } = useAuth()

  const isCompany = variant === 'company'

  return (
    <div
      className={cn(
        'flex min-h-screen',
        isCompany ? 'bg-background' : 'bg-background',
      )}
    >
      <aside
        className={cn(
          'flex w-56 shrink-0 flex-col border-r',
          isCompany
            ? 'border-[#243217] bg-[#2F3E1F] text-white'
            : 'border-border bg-surface text-text-primary',
        )}
      >
        <div
          className={cn(
            'border-b px-4 py-4',
            isCompany ? 'border-white/15 bg-[#2F3E1F]' : 'border-border',
          )}
        >
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
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {navItems.map(({ to, label, end = false, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
              {Icon ? (
                <Icon
                  className="h-5 w-5 shrink-0 opacity-90"
                  aria-hidden
                />
              ) : null}
              <span className="min-w-0">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            'flex h-14 shrink-0 items-center justify-end border-b px-6',
            isCompany
              ? 'border-[#243217] bg-[#2F3E1F] text-white'
              : 'border-border bg-surface',
          )}
        >
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
            Sign out
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
