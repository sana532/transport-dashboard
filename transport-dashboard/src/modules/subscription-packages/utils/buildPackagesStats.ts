import type { CompanySubscriptionPlan, PackagesManagementData } from '@/modules/subscription-packages/types'
import { PackagesIcons } from '@/modules/subscription-packages/types'

function pickCount(counts: Record<string, unknown> | null | undefined, ...keys: string[]): number | undefined {
  if (!counts) return undefined
  for (const key of keys) {
    const value = counts[key]
    if (value == null || value === '') continue
    const n = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export function buildPackagesStats(
  plans: CompanySubscriptionPlan[],
  counts?: Record<string, unknown> | null,
): PackagesManagementData['stats'] {
  const totalLocal = plans.length
  const activeLocal = plans.filter((p) => p.isActive).length
  const subscribersLocal = plans.reduce((sum, p) => sum + p.activeSubscribers, 0)

  const total = pickCount(counts, 'total') ?? totalLocal
  const active = pickCount(counts, 'active') ?? activeLocal
  const subscribers =
    pickCount(counts, 'subscribers', 'active_subscribers', 'total_subscribers') ?? subscribersLocal

  return [
    {
      titleKey: 'packages.stats.total',
      value: String(total),
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
