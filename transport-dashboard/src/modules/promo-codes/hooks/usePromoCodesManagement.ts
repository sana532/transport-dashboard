import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { PromoCodesManagementData } from '@/modules/promo-codes/types'
import { promoCodesService } from '@/modules/promo-codes/services/promoCodesService'

export const promoCodesManagementQueryKey = ['promo-codes', 'management'] as const

export function usePromoCodesManagement() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: promoCodesManagementQueryKey,
    queryFn: (): Promise<PromoCodesManagementData> =>
      promoCodesService.getPromoCodesManagementData(),
  })

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: promoCodesManagementQueryKey })
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
