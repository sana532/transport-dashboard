import { Building2, Bus, Landmark, LayoutDashboard, MapPin, Users } from 'lucide-react'
import { AppShell, type AppShellNavItem } from '@/layouts/AppShell'
import { paths } from '@/routes/paths'

const adminNavItems: AppShellNavItem[] = [
  { to: paths.admin.dashboard, label: 'Dashboard', end: true, Icon: LayoutDashboard },
  { to: paths.admin.companies, label: 'Companies', Icon: Building2 },
  { to: paths.admin.vehicleModels, label: 'Vehicle models', Icon: Bus },
  { to: paths.admin.cities, label: 'Cities', Icon: Landmark },
  { to: paths.admin.stations, label: 'Stations', Icon: MapPin },
  { to: paths.admin.users, label: 'Users', Icon: Users },
]

export function AdminLayout() {
  return (
    <AppShell
      variant="company"
      brandLabel="Platform"
      sectionTitle="Admin"
      navItems={adminNavItems}
    />
  )
}
