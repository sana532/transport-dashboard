import { Link } from 'react-router-dom'
import {
  Building2,
  Bus,
  Coffee,
  Landmark,
  MapPin,
  MessageSquareWarning,
  Package,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'

type HubLink = {
  to: string
  titleKey: string
  descriptionKey: string
  Icon: LucideIcon
}

const readyLinks: HubLink[] = [
  {
    to: paths.admin.companies,
    titleKey: 'admin.sidebar.companies',
    descriptionKey: 'admin.overview.companiesDesc',
    Icon: Building2,
  },
  {
    to: paths.admin.cities,
    titleKey: 'admin.sidebar.cities',
    descriptionKey: 'admin.overview.citiesDesc',
    Icon: Landmark,
  },
  {
    to: paths.admin.stations,
    titleKey: 'admin.sidebar.stations',
    descriptionKey: 'admin.overview.stationsDesc',
    Icon: MapPin,
  },
  {
    to: paths.admin.restAreas,
    titleKey: 'admin.sidebar.restAreas',
    descriptionKey: 'admin.overview.restAreasDesc',
    Icon: Coffee,
  },
  {
    to: paths.admin.vehicleModels,
    titleKey: 'admin.sidebar.vehicleModels',
    descriptionKey: 'admin.overview.vehicleModelsDesc',
    Icon: Bus,
  },
  {
    to: paths.admin.promoCodes,
    titleKey: 'admin.sidebar.promoCodes',
    descriptionKey: 'admin.overview.promoCodesDesc',
    Icon: Tag,
  },
  {
    to: paths.admin.platformPlans,
    titleKey: 'admin.sidebar.platformPlans',
    descriptionKey: 'admin.overview.platformPlansDesc',
    Icon: Package,
  },
  {
    to: paths.admin.complaints,
    titleKey: 'admin.sidebar.complaints',
    descriptionKey: 'admin.overview.complaintsDesc',
    Icon: MessageSquareWarning,
  },
  {
    to: paths.admin.users,
    titleKey: 'admin.sidebar.users',
    descriptionKey: 'admin.overview.usersDesc',
    Icon: Users,
  },
]

export function AdminDashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {t('admin.overview.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">{t('admin.overview.subtitle')}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t('admin.overview.modules')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {readyLinks.map(({ to, titleKey, descriptionKey, Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors',
                'hover:border-[#2F3E1F]/40 hover:bg-surface-muted/40',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">{t(titleKey)}</p>
                  <p className="mt-1 text-sm text-text-muted">{t(descriptionKey)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
