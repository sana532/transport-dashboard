import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { PackagesManagementData } from '@/modules/subscription-packages/types'
import { packagesManagementService } from '@/modules/subscription-packages/services/packagesManagementService'
import { subscriptionPlansService } from '@/modules/subscription-packages/services/subscriptionPlansService'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { filterHiddenRecords, useHiddenRecordsRevision } from '@/shared/utils/hiddenRecords'

export const packagesManagementQueryKey = (locale: string, page: number) =>
  ['packages', 'management', locale, page] as const

export function usePackagesManagement(page = 1) {
  const { t, locale } = useTranslation()
  const queryClient = useQueryClient()
  const hiddenRevision = useHiddenRecordsRevision()
  const safePage = Math.max(1, Math.floor(page))

  const query = useQuery({
    queryKey: packagesManagementQueryKey(locale, safePage),
    queryFn: (): Promise<PackagesManagementData> =>
      packagesManagementService.getPackagesManagementData(locale, t, safePage),
    placeholderData: (previousData) => previousData,
  })

  const data = useMemo(() => {
    if (!query.data) return null
    const plans = filterHiddenRecords('packages', query.data.plans, (plan) => [plan.id])
    if (plans.length === query.data.plans.length) return query.data
    return {
      ...query.data,
      plans,
      stats: query.data.stats.map((stat) => {
        if (stat.titleKey === 'packages.stats.total') {
          return { ...stat, value: String(plans.length) }
        }
        if (stat.titleKey === 'packages.stats.active') {
          return {
            ...stat,
            value: String(plans.filter((plan) => plan.status === 'active').length),
          }
        }
        return stat
      }),
    }
  }, [hiddenRevision, query.data])

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['packages', 'management'] })
  }, [queryClient])

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
    data,
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
