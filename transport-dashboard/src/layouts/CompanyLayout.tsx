import {
  LayoutDashboard,
  Map,
  Route,
  Ticket,
  Truck,
  Users,
  Package,
  Tag,
  MessageSquareWarning,
  Settings,
} from 'lucide-react'
import { paths } from '@/routes/paths'
import { AppShell, type AppShellNavItem } from '@/layouts/AppShell'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function CompanyLayout() {
  const { t } = useTranslation()
  const companyNavItems: AppShellNavItem[] = [
    {
      to: paths.company.dashboard,
      label: t('sidebar.dashboard'),
      end: true,
      Icon: LayoutDashboard,
    },
    { to: paths.company.routes, label: t('sidebar.routes'), Icon: Map },
    { to: paths.company.trips, label: t('sidebar.trips'), Icon: Route },
    { to: paths.company.bookings, label: t('sidebar.bookings'), Icon: Ticket },
    { to: paths.company.vehicles, label: t('sidebar.vehicles'), Icon: Truck },
    { to: paths.company.drivers, label: t('sidebar.drivers'), Icon: Users },
    {
      to: paths.company.subscriptionPackages,
      label: t('sidebar.subscriptionPackages'),
      Icon: Package,
    },
    {
      to: paths.company.promoCodes,
      label: t('sidebar.promoCodes'),
      Icon: Tag,
    },
    {
      to: paths.company.complaints,
      label: t('sidebar.complaints'),
      Icon: MessageSquareWarning,
    },
    { to: paths.company.settings, label: t('sidebar.settings'), Icon: Settings },
  ]

  return (
    <AppShell
      variant="company"
      brandLabel="Bus TMS"
      sectionTitle={t('sidebar.company')}
      navItems={companyNavItems}
    />
  )
}
