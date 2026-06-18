import { useCallback, useEffect, useState } from 'react'
import type { ComplaintStatus, ComplaintsManagementData } from '@/modules/complaints/types'
import { complaintsManagementService } from '@/modules/complaints/services/complaintsManagementService'
import { uiStatusToApiQuery } from '@/modules/complaints/utils/mapCompanyComplaint'
import { useTranslation } from '@/shared/i18n/useTranslation'

export type ComplaintsListFilters = {
  status: 'all' | ComplaintStatus
  categoryId: 'all' | number
}

export const defaultComplaintsListFilters: ComplaintsListFilters = {
  status: 'all',
  categoryId: 'all',
}

export function useComplaintsManagement(filters: ComplaintsListFilters = defaultComplaintsListFilters) {
  const { locale } = useTranslation()
  const [data, setData] = useState<ComplaintsManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const next = await complaintsManagementService.getComplaintsManagementData(locale, {
        status: uiStatusToApiQuery(filters.status),
        complaint_category_id:
          filters.categoryId === 'all' ? undefined : filters.categoryId,
      })
      setData(next)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load complaints management data',
      )
    } finally {
      setIsLoading(false)
    }
  }, [locale, filters.status, filters.categoryId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
