import type { VehiclesManagementData } from '@/modules/vehicles/types'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'
import { mapCompanyVehicleToVehicle } from '@/modules/vehicles/utils/mapCompanyVehicle'
import { buildVehicleStats } from '@/modules/vehicles/utils/buildVehicleStats'

export { buildVehicleStats } from '@/modules/vehicles/utils/buildVehicleStats'

export const VEHICLES_PAGE_SIZE = 15

export const vehiclesManagementService = {
  async getVehiclesManagementData(page = 1): Promise<VehiclesManagementData> {
    const result = await vehiclesService.listVehiclesPage({
      page,
      perPage: VEHICLES_PAGE_SIZE,
    })
    const vehicles = result.vehicles.map(mapCompanyVehicleToVehicle)
    return {
      stats: buildVehicleStats(vehicles, result.counts),
      vehicles,
      pagination: {
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        perPage: result.perPage,
        total: result.total,
        from: result.from,
        to: result.to,
      },
    }
  },
}
