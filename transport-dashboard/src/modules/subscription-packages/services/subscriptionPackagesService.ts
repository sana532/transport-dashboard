import { subscriptionPlansService } from '@/modules/subscription-packages/services/subscriptionPlansService'

/** @deprecated Use subscriptionPlansService */
export const subscriptionPackagesService = {
  listPackages: () => subscriptionPlansService.listPlans(),
}
