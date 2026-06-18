import type { PackagesManagementData } from '@/modules/subscription-packages/types'
import { subscriptionPlansService } from '@/modules/subscription-packages/services/subscriptionPlansService'
import { buildPackagesStats } from '@/modules/subscription-packages/utils/buildPackagesStats'
import { mapPlanToCard } from '@/modules/subscription-packages/utils/mapCompanySubscriptionPlan'

export const packagesManagementService = {
  async getPackagesManagementData(
    locale: string,
    t: (key: string, vars?: Record<string, string | number>) => string,
  ): Promise<PackagesManagementData> {
    const plans = await subscriptionPlansService.listPlans()
    return {
      stats: buildPackagesStats(plans),
      plans: plans.map((plan) => mapPlanToCard(plan, locale, t)),
    }
  },
}
