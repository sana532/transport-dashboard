import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { DashboardData } from '@/modules/dashboard/types'
import { dashboardService } from '@/modules/dashboard/services/dashboardService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export const dashboardQueryKey = (locale: string) => ['dashboard', locale] as const

const DASHBOARD_STALE_MS = 5 * 60_000
const DASHBOARD_GC_MS = 30 * 60_000

export function useDashboard() {
  const { locale } = useTranslation()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: dashboardQueryKey(locale),
    queryFn: (): Promise<DashboardData> => dashboardService.getDashboardData(locale),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    placeholderData: (previousData) => previousData,
  })

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: dashboardQueryKey(locale) })
  }, [locale, queryClient])

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load dashboard data'
      : null,
    reload,
  }
}
