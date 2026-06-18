import type { CompanySubscriptionPlan, PackagesManagementData } from '@/modules/subscription-packages/types'
import { PackagesIcons } from '@/modules/subscription-packages/types'

export function buildPackagesStats(plans: CompanySubscriptionPlan[]): PackagesManagementData['stats'] {
  const active = plans.filter((p) => p.isActive).length
  const subscribers = plans.reduce((sum, p) => sum + p.activeSubscribers, 0)

  return [
    {
      titleKey: 'packages.stats.total',
      value: String(plans.length),
      noteKey: 'packages.stats.totalNote',
      variant: 'info',
      Icon: PackagesIcons.Total,
    },
    {
      titleKey: 'packages.stats.active',
      value: String(active),
      noteKey: 'packages.stats.activeNote',
      variant: 'success',
      Icon: PackagesIcons.Active,
    },
    {
      titleKey: 'packages.stats.subscribers',
      value: subscribers.toLocaleString(),
      noteKey: 'packages.stats.subscribersNote',
      variant: 'accent',
      Icon: PackagesIcons.Subscribers,
    },
  ]
}
