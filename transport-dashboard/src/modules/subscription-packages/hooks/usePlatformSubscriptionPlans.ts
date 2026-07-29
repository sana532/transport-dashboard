import { useCallback, useEffect, useState } from 'react'
import type {
  CompanySubscriptionPlan,
  SubscriptionPlanInput,
} from '@/modules/subscription-packages/types'
import { platformSubscriptionPlansService } from '@/modules/subscription-packages/services/platformSubscriptionPlansService'

export function usePlatformSubscriptionPlans() {
  const [plans, setPlans] = useState<CompanySubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await platformSubscriptionPlansService.listPlans()
      setPlans(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform plans')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createPlan = useCallback(
    async (input: SubscriptionPlanInput) => {
      const created = await platformSubscriptionPlansService.createPlan(input)
      await load()
      return created
    },
    [load],
  )

  const updatePlan = useCallback(
    async (id: number, input: SubscriptionPlanInput) => {
      const updated = await platformSubscriptionPlansService.updatePlan(id, input)
      await load()
      return updated
    },
    [load],
  )

  const deletePlan = useCallback(
    async (id: number) => {
      await platformSubscriptionPlansService.deletePlan(id)
      await load()
    },
    [load],
  )

  return {
    plans,
    isLoading,
    error,
    reload: load,
    createPlan,
    updatePlan,
    deletePlan,
  }
}
