import { useCallback, useEffect, useState } from 'react'
import type { PromoCodeInput, PromoCodesManagementData } from '@/modules/promo-codes/types'
import { platformPromoCodesService } from '@/modules/promo-codes/services/platformPromoCodesService'

export function usePlatformPromoCodes() {
  const [data, setData] = useState<PromoCodesManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const next = await platformPromoCodesService.getPromoCodesManagementData()
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform promo codes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createPromoCode = useCallback(
    async (input: PromoCodeInput) => {
      const created = await platformPromoCodesService.createPromoCode(input)
      await load()
      return created
    },
    [load],
  )

  const updatePromoCode = useCallback(
    async (id: number, input: PromoCodeInput) => {
      const updated = await platformPromoCodesService.updatePromoCode(id, input)
      await load()
      return updated
    },
    [load],
  )

  const deletePromoCode = useCallback(
    async (id: number) => {
      await platformPromoCodesService.deletePromoCode(id)
      await load()
    },
    [load],
  )

  return {
    data,
    isLoading,
    error,
    reload: load,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
  }
}
