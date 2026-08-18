import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { PromoCodesManagementData } from '@/modules/promo-codes/types'
import { promoCodesService } from '@/modules/promo-codes/services/promoCodesService'

export const promoCodesManagementQueryKey = (page: number) =>
  ['promo-codes', 'management', page] as const

export function usePromoCodesManagement(page = 1) {
  const queryClient = useQueryClient()
  const safePage = Math.max(1, Math.floor(page))

  const query = useQuery({
    queryKey: promoCodesManagementQueryKey(safePage),
    queryFn: (): Promise<PromoCodesManagementData> =>
      promoCodesService.getPromoCodesManagementData(safePage),
    placeholderData: (previousData) => previousData,
  })

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
    data: query.data ?? null,
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
