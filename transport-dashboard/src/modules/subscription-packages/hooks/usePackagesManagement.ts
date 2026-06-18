import { useCallback, useEffect, useState } from 'react'
import type { PackagesManagementData } from '@/modules/subscription-packages/types'
import { packagesManagementService } from '@/modules/subscription-packages/services/packagesManagementService'
import { subscriptionPlansService } from '@/modules/subscription-packages/services/subscriptionPlansService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function usePackagesManagement() {
  const { t, locale } = useTranslation()
  const [data, setData] = useState<PackagesManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const next = await packagesManagementService.getPackagesManagementData(locale, t)
      setData(next)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load subscription packages data',
      )
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [locale, t])

  useEffect(() => {
    void load()
  }, [load])

  const deletePlan = useCallback(
    async (planId: string) => {
      const id = Number(planId)
      if (!Number.isFinite(id)) return
      await subscriptionPlansService.deletePlan(id)
      await load()
    },
    [load],
  )

  return { data, isLoading, error, reload: load, deletePlan }
}
