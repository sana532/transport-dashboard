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
  FileSpreadsheet,
  Settings,
} from 'lucide-react'
import { paths } from '@/routes/paths'
import { AppShell, type AppShellNavItem } from '@/layouts/AppShell'
import { CompanyProfileProvider, useCompanyProfile } from '@/modules/companies/components/CompanyProfileProvider'
import { useTranslation } from '@/shared/i18n/useTranslation'

function CompanyLayoutShell() {
  const { t } = useTranslation()
  const { profile } = useCompanyProfile()

  const companyNavItems: AppShellNavItem[] = [
    {
      to: paths.company.dashboard,
      label: t('sidebar.dashboard'),
      end: true,
      Icon: LayoutDashboard,
      section: t('company.nav.overview'),
    },
    {
      to: paths.company.reports,
      label: t('sidebar.reports'),
      Icon: FileSpreadsheet,
      section: t('company.nav.overview'),
    },
    {
      to: paths.company.routes,
      label: t('sidebar.routes'),
      Icon: Map,
      section: t('company.nav.operations'),
    },
    {
      to: paths.company.trips,
      label: t('sidebar.trips'),
      Icon: Route,
      section: t('company.nav.operations'),
    },
    {
      to: paths.company.bookings,
      label: t('sidebar.bookings'),
      Icon: Ticket,
      section: t('company.nav.operations'),
    },
    {
      to: paths.company.vehicles,
      label: t('sidebar.vehicles'),
      Icon: Truck,
      section: t('company.nav.fleet'),
    },
    {
      to: paths.company.drivers,
      label: t('sidebar.drivers'),
      Icon: Users,
      section: t('company.nav.fleet'),
    },
    {
      to: paths.company.subscriptionPackages,
      label: t('sidebar.subscriptionPackages'),
      Icon: Package,
      section: t('company.nav.offers'),
    },
    {
      to: paths.company.promoCodes,
      label: t('sidebar.promoCodes'),
      Icon: Tag,
      section: t('company.nav.offers'),
    },
    {
      to: paths.company.complaints,
      label: t('sidebar.complaints'),
      Icon: MessageSquareWarning,
      section: t('company.nav.support'),
    },
    {
      to: paths.company.settings,
      label: t('sidebar.settings'),
      Icon: Settings,
      section: t('company.nav.settings'),
    },
  ]

  const companyName = profile?.name?.trim() && profile.name !== '—'
    ? profile.name
    : t('sidebar.company')

  return (
    <AppShell
      variant="company"
      brandLabel="Bus TMS"
      sectionTitle={companyName}
      brandHref={paths.company.settings}
      brandImageUrl={profile?.logoUrl ?? profile?.coverImageUrl}
      navItems={companyNavItems}
    />
  )
}

export function CompanyLayout() {
  return (
    <CompanyProfileProvider>
      <CompanyLayoutShell />
    </CompanyProfileProvider>
  )
}
