import { useCallback, useEffect, useState } from 'react'
import type { PromoCodesManagementData } from '@/modules/promo-codes/types'
import { promoCodesService } from '@/modules/promo-codes/services/promoCodesService'

export function usePromoCodesManagement() {
  const [data, setData] = useState<PromoCodesManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const next = await promoCodesService.getPromoCodesManagementData()
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promo codes')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const deletePromoCode = useCallback(
    async (id: number) => {
      await promoCodesService.deletePromoCode(id)
      await load()
    },
    [load],
  )

  return { data, isLoading, error, reload: load, deletePromoCode }
}
