import type { PackagesManagementData } from '@/modules/subscription-packages/types'
import { subscriptionPlansService } from '@/modules/subscription-packages/services/subscriptionPlansService'
import { buildPackagesStats } from '@/modules/subscription-packages/utils/buildPackagesStats'
import { countActivePackageSubscribers } from '@/modules/subscription-packages/utils/countActivePackageSubscribers'
import { mapPlanToCard } from '@/modules/subscription-packages/utils/mapCompanySubscriptionPlan'

async function enrichPlansWithSubscriberCounts(
  plans: Awaited<ReturnType<typeof subscriptionPlansService.listPlans>>,
  locale: string,
) {
  const counts = await Promise.all(
    plans.map(async (plan) => {
      if (plan.activeSubscribers > 0) return plan.activeSubscribers
      try {
        const rows = await subscriptionPlansService.listPlanSubscribers(plan.id, locale)
        return countActivePackageSubscribers(rows)
      } catch {
        return plan.activeSubscribers
      }
    }),
  )

  return plans.map((plan, index) => ({
    ...plan,
    activeSubscribers: counts[index] ?? plan.activeSubscribers,
  }))
}

export const packagesManagementService = {
  async getPackagesManagementData(
    locale: string,
    t: (key: string, vars?: Record<string, string | number>) => string,
  ): Promise<PackagesManagementData> {
    const plans = await enrichPlansWithSubscriberCounts(
      await subscriptionPlansService.listPlans(),
      locale,
    )
    return {
      stats: buildPackagesStats(plans),
      plans: plans.map((plan) => mapPlanToCard(plan, locale, t)),
    }
  },
}
