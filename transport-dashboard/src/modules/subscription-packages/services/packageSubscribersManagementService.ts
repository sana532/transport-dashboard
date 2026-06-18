import type { PackageSubscribersManagementData } from '@/modules/subscription-packages/types'
import { subscriptionPlansService } from '@/modules/subscription-packages/services/subscriptionPlansService'
import { buildPackageSubscribersStats } from '@/modules/subscription-packages/utils/buildPackageSubscribersStats'
import { planDisplayName } from '@/modules/subscription-packages/utils/mapCompanySubscriptionPlan'

const DEFAULT_PAGE_SIZE = 10

export const packageSubscribersManagementService = {
  async getPackageSubscribersData(
    packageId: string,
    locale: string,
    t: (key: string, vars?: Record<string, string | number>) => string,
  ): Promise<PackageSubscribersManagementData> {
    const id = Number(packageId)
    if (!Number.isFinite(id)) {
      throw new Error('Invalid package id')
    }

    const [plan, rows] = await Promise.all([
      subscriptionPlansService.getPlan(id),
      subscriptionPlansService.listPlanSubscribers(id, locale),
    ])

    return {
      packageId,
      packageTitle: planDisplayName(plan, locale),
      stats: buildPackageSubscribersStats(rows, t),
      rows,
      totalResults: rows.length,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    }
  },
}
