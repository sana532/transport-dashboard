import { dashboardMockData } from '@/modules/dashboard/mock/dashboardData'
import type { DashboardData } from '@/modules/dashboard/types'

const MOCK_DELAY_MS = 250

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    // Simulate network latency while backend endpoints are not ready.
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
    return dashboardMockData
  },
}
