import { useCallback, useEffect, useState } from 'react'
import type { DashboardData } from '@/modules/dashboard/types'
import { dashboardService } from '@/modules/dashboard/services/dashboardService'

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextData = await dashboardService.getDashboardData()
      setData(nextData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
