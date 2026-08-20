import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { WeeklyAiSummary } from '@/modules/dashboard/types/weeklySummary'
import { weeklySummaryService } from '@/modules/dashboard/services/weeklySummaryService'

export const weeklySummaryQueryKey = ['dashboard', 'weekly-summary'] as const

const WEEKLY_STALE_MS = 5 * 60_000
const WEEKLY_GC_MS = 30 * 60_000

export function useWeeklySummary() {
  const queryClient = useQueryClient()
  const cached = queryClient.getQueryData<WeeklyAiSummary>(weeklySummaryQueryKey)
  const [isOpen, setIsOpen] = useState(() => cached != null)

  const query = useQuery({
    queryKey: weeklySummaryQueryKey,
    queryFn: (): Promise<WeeklyAiSummary> => weeklySummaryService.getWeeklySummary(),
    enabled: isOpen,
    staleTime: WEEKLY_STALE_MS,
    gcTime: WEEKLY_GC_MS,
    placeholderData: (previousData) => previousData,
  })

  const load = useCallback(() => {
    setIsOpen(true)
  }, [])

  const reload = useCallback(async () => {
    setIsOpen(true)
    await queryClient.invalidateQueries({ queryKey: weeklySummaryQueryKey })
  }, [queryClient])

  const hide = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    data: query.data ?? null,
    isOpen,
    isLoading: isOpen && query.isPending,
    error:
      isOpen && query.isError
        ? query.error instanceof Error
          ? query.error.message
          : 'Failed to load weekly summary'
        : null,
    load,
    reload,
    hide,
  }
}
