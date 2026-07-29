import { useCallback, useEffect, useState } from 'react'
import type { ComplaintStatus, ComplaintsManagementData } from '@/modules/complaints/types'
import { platformComplaintsService } from '@/modules/complaints/services/platformComplaintsService'
import { uiStatusToApiQuery } from '@/modules/complaints/utils/mapCompanyComplaint'
import { useTranslation } from '@/shared/i18n/useTranslation'

export type PlatformComplaintsListFilters = {
  status: 'all' | ComplaintStatus
  categoryId: 'all' | number
  companyId: string
}

export const defaultPlatformComplaintsFilters: PlatformComplaintsListFilters = {
  status: 'all',
  categoryId: 'all',
  companyId: '',
}

export function usePlatformComplaints(
  filters: PlatformComplaintsListFilters = defaultPlatformComplaintsFilters,
) {
  const { locale } = useTranslation()
  const [data, setData] = useState<ComplaintsManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const companyIdNum = filters.companyId.trim() ? Number(filters.companyId.trim()) : NaN
      const next = await platformComplaintsService.getComplaintsManagementData(locale, {
        status: uiStatusToApiQuery(filters.status),
        complaint_category_id:
          filters.categoryId === 'all' ? undefined : filters.categoryId,
        company_id: Number.isFinite(companyIdNum) && companyIdNum > 0 ? companyIdNum : undefined,
      })
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform complaints')
    } finally {
      setIsLoading(false)
    }
  }, [locale, filters.status, filters.categoryId, filters.companyId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
