import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { PackagesManagementData } from '@/modules/subscription-packages/types'
import { packagesManagementService } from '@/modules/subscription-packages/services/packagesManagementService'
import { subscriptionPlansService } from '@/modules/subscription-packages/services/subscriptionPlansService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export const packagesManagementQueryKey = (locale: string) =>
  ['packages', 'management', locale] as const

export function usePackagesManagement() {
  const { t, locale } = useTranslation()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: packagesManagementQueryKey(locale),
    queryFn: (): Promise<PackagesManagementData> =>
      packagesManagementService.getPackagesManagementData(locale, t),
  })

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: packagesManagementQueryKey(locale) })
  }, [queryClient, locale])

  const deletePlan = useCallback(
    async (planId: string) => {
      const id = Number(planId)
      if (!Number.isFinite(id)) return
      await subscriptionPlansService.deletePlan(id)
      await reload()
    },
    [reload],
  )

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load subscription packages data'
      : null,
    reload,
    deletePlan,
  }
}
