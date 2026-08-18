import type { PackagesManagementData } from '@/modules/subscription-packages/types'
import { subscriptionPlansService } from '@/modules/subscription-packages/services/subscriptionPlansService'
import { buildPackagesStats } from '@/modules/subscription-packages/utils/buildPackagesStats'
import { countActivePackageSubscribers } from '@/modules/subscription-packages/utils/countActivePackageSubscribers'
import { mapPlanToCard } from '@/modules/subscription-packages/utils/mapCompanySubscriptionPlan'

export const PACKAGES_PAGE_SIZE = 15

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
    page = 1,
  ): Promise<PackagesManagementData> {
    const result = await subscriptionPlansService.listPlansPage({
      page,
      perPage: PACKAGES_PAGE_SIZE,
    })

    const hasSubscriberTotal =
      result.counts != null &&
      (result.counts.subscribers != null ||
        result.counts.active_subscribers != null ||
        result.counts.total_subscribers != null)

    const plans = hasSubscriberTotal
      ? result.plans
      : await enrichPlansWithSubscriberCounts(result.plans, locale)

    return {
      stats: buildPackagesStats(plans, result.counts),
      plans: plans.map((plan) => mapPlanToCard(plan, locale, t)),
      pagination: {
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        perPage: result.perPage,
        total: result.total,
        from: result.from,
        to: result.to,
      },
    }
  },
}
