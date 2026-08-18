import { useCallback, useState } from 'react'
import type { WeeklyAiSummary } from '@/modules/dashboard/types/weeklySummary'
import { weeklySummaryService } from '@/modules/dashboard/services/weeklySummaryService'

export function useWeeklySummary() {
  const [data, setData] = useState<WeeklyAiSummary | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsOpen(true)
    setIsLoading(true)
    setError(null)

    try {
      const next = await weeklySummaryService.getWeeklySummary()
      setData(next)
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : 'Failed to load weekly summary')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const hide = useCallback(() => {
    setIsOpen(false)
  }, [])

  return { data, isOpen, isLoading, error, load, hide }
}
