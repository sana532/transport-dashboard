import type { DriversManagementData } from '@/modules/drivers/types'
import { driversService } from '@/modules/drivers/services/driversService'
import { mapCompanyDriverToDriver } from '@/modules/drivers/utils/mapCompanyDriver'
import { buildDriverStats } from '@/modules/drivers/utils/buildDriverStats'

type Translate = (key: string, params?: Record<string, string | number>) => string

export const DRIVERS_PAGE_SIZE = 15

export const driversManagementService = {
  async getDriversManagementData(t: Translate, page = 1): Promise<DriversManagementData> {
    const result = await driversService.listDriversPage({
      page,
      perPage: DRIVERS_PAGE_SIZE,
    })
    const drivers = result.drivers.map(mapCompanyDriverToDriver)

    return {
      stats: buildDriverStats(drivers, t, result.counts),
      drivers,
      pagination: {
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        perPage: result.perPage,
        total: result.total,
        from: result.from,
        to: result.to,
      },
      defaultFilters: {
        search: '',
        status: 'All Status',
        experience: 'All Experience',
        licenseStatus: 'All License Status',
      },
    }
  },
}
