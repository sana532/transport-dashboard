import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { PromoCodesManagementData } from '@/modules/promo-codes/types'
import { promoCodesService } from '@/modules/promo-codes/services/promoCodesService'
import { buildPromoStats } from '@/modules/promo-codes/utils/buildPromoStats'
import { filterHiddenRecords, useHiddenRecordsRevision } from '@/shared/utils/hiddenRecords'

export const promoCodesManagementQueryKey = (page: number) =>
  ['promo-codes', 'management', page] as const

export function usePromoCodesManagement(page = 1) {
  const queryClient = useQueryClient()
  const hiddenRevision = useHiddenRecordsRevision()
  const safePage = Math.max(1, Math.floor(page))

  const query = useQuery({
    queryKey: promoCodesManagementQueryKey(safePage),
    queryFn: (): Promise<PromoCodesManagementData> =>
      promoCodesService.getPromoCodesManagementData(safePage),
    placeholderData: (previousData) => previousData,
  })

  const data = useMemo(() => {
    if (!query.data) return null
    const promoCodes = filterHiddenRecords('promos', query.data.promoCodes, (row) => [
      row.id,
      row.code,
    ])
    if (promoCodes.length === query.data.promoCodes.length) return query.data
    return {
      ...query.data,
      promoCodes,
      stats: buildPromoStats(promoCodes),
    }
  }, [hiddenRevision, query.data])

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['promo-codes', 'management'] })
  }, [queryClient])

  const deletePromoCode = useCallback(
    async (id: number) => {
      await promoCodesService.deletePromoCode(id)
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
        : 'Failed to load promo codes'
      : null,
    reload,
    deletePromoCode,
  }
}
