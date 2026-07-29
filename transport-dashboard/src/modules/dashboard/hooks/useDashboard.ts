import { useCallback, useEffect, useState } from 'react'
import type { DashboardData } from '@/modules/dashboard/types'
import { dashboardService } from '@/modules/dashboard/services/dashboardService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function useDashboard() {
  const { locale } = useTranslation()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextData = await dashboardService.getDashboardData(locale)
      setData(nextData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [locale])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
