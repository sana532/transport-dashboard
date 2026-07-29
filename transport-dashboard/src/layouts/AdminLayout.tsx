import {
  Building2,
  Bus,
  Coffee,
  FolderTree,
  Landmark,
  LayoutDashboard,
  MapPin,
  MessageSquareWarning,
  Package,
  Settings,
  Tag,
  Users,
} from 'lucide-react'
import { AppShell, type AppShellNavItem } from '@/layouts/AppShell'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function AdminLayout() {
  const { t } = useTranslation()

  const adminNavItems: AppShellNavItem[] = [
    {
      to: paths.admin.dashboard,
      label: t('admin.sidebar.overview'),
      end: true,
      Icon: LayoutDashboard,
      section: t('admin.nav.overview'),
    },
    {
      to: paths.admin.companies,
      label: t('admin.sidebar.companies'),
      Icon: Building2,
      section: t('admin.nav.tenants'),
    },
    {
      to: paths.admin.cities,
      label: t('admin.sidebar.cities'),
      Icon: Landmark,
      section: t('admin.nav.catalog'),
    },
    {
      to: paths.admin.stations,
      label: t('admin.sidebar.stations'),
      Icon: MapPin,
      section: t('admin.nav.catalog'),
    },
    {
      to: paths.admin.restAreas,
      label: t('admin.sidebar.restAreas'),
      Icon: Coffee,
      section: t('admin.nav.catalog'),
    },
    {
      to: paths.admin.vehicleModels,
      label: t('admin.sidebar.vehicleModels'),
      Icon: Bus,
      section: t('admin.nav.catalog'),
    },
    {
      to: paths.admin.promoCodes,
      label: t('admin.sidebar.promoCodes'),
      Icon: Tag,
      section: t('admin.nav.offers'),
    },
    {
      to: paths.admin.platformPlans,
      label: t('admin.sidebar.platformPlans'),
      Icon: Package,
      section: t('admin.nav.offers'),
    },
    {
      to: paths.admin.complaints,
      label: t('admin.sidebar.complaints'),
      Icon: MessageSquareWarning,
      section: t('admin.nav.support'),
    },
    {
      to: paths.admin.complaintCategories,
      label: t('admin.sidebar.complaintCategories'),
      Icon: FolderTree,
      section: t('admin.nav.support'),
    },
    {
      to: paths.admin.users,
      label: t('admin.sidebar.users'),
      Icon: Users,
      section: t('admin.nav.access'),
    },
    {
      to: paths.admin.settings,
      label: t('admin.sidebar.settings'),
      Icon: Settings,
      section: t('admin.sidebar.settings'),
    },
  ]

  return (
    <AppShell
      variant="company"
      brandLabel={t('admin.brand')}
      sectionTitle={t('admin.sectionTitle')}
      navItems={adminNavItems}
    />
  )
}
