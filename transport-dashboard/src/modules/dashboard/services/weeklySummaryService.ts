import { api } from '@/services/api'
import type { WeeklyAiSummary } from '@/modules/dashboard/types/weeklySummary'
import { mapWeeklySummary } from '@/modules/dashboard/utils/mapWeeklySummary'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

export const weeklySummaryService = {
  async getWeeklySummary(): Promise<WeeklyAiSummary> {
    try {
      const { data } = await api.get<unknown>('/company/dashboard/weekly-summary')
      const mapped = mapWeeklySummary(data)
      if (!mapped) {
        throw new Error('Weekly summary payload was empty')
      }
      return mapped
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load weekly summary'))
    }
  },
}
