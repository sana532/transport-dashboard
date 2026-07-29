import { api } from '@/services/api'
import type { DashboardData } from '@/modules/dashboard/types'
import {
  mapDashboardKpis,
  mapRevenueTrend,
  mapRoutePerformance,
} from '@/modules/dashboard/utils/mapCompanyDashboard'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

export const dashboardService = {
  async getDashboardData(locale: string): Promise<DashboardData> {
    const [kpisResult, revenueResult, routesResult] = await Promise.allSettled([
      api.get<unknown>('/company/dashboard/kpis'),
      api.get<unknown>('/company/dashboard/charts/revenue-trend'),
      api.get<unknown>('/company/dashboard/charts/route-performance'),
    ])

    if (kpisResult.status === 'rejected') {
      throw new Error(
        getApiErrorMessage(kpisResult.reason, 'Failed to load dashboard KPIs'),
      )
    }

    return {
      statCards: mapDashboardKpis(kpisResult.value.data, locale),
      revenueTrendData:
        revenueResult.status === 'fulfilled'
          ? mapRevenueTrend(revenueResult.value.data)
          : [],
      routePerformanceData:
        routesResult.status === 'fulfilled'
          ? mapRoutePerformance(routesResult.value.data)
          : [],
      topDrivers: [],
      dailyBookings: [],
      recentTrips: [],
    }
  },
}
