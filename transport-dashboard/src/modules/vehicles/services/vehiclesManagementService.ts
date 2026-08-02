import {
  VehiclesIcons,
  type Vehicle,
  type VehiclesManagementData,
  type VehiclesStatCard,
} from '@/modules/vehicles/types'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'
import { mapCompanyVehicleToVehicle } from '@/modules/vehicles/utils/mapCompanyVehicle'

export function buildVehicleStats(vehicles: Vehicle[]): VehiclesStatCard[] {
  const total = vehicles.length
  const available = vehicles.filter((v) => v.status === 'Available').length
  const maintenance = vehicles.filter((v) => v.status === 'Maintenance').length
  const pending = vehicles.filter((v) => v.verifiedStatus.toLowerCase() === 'pending').length

  return [
    {
      titleKey: 'vehicles.stats.total',
      value: String(total),
      noteKey: 'vehicles.stats.totalNote',
      trend: '',
      Icon: VehiclesIcons.Total,
      variant: 'primary',
    },
    {
      titleKey: 'vehicles.stats.available',
      value: String(available),
      noteKey: 'vehicles.stats.availableNote',
      trend: '',
      Icon: VehiclesIcons.Available,
      variant: 'success',
    },
    {
      titleKey: 'vehicles.stats.pending',
      value: String(pending),
      noteKey: 'vehicles.stats.pendingNote',
      trend: '',
      Icon: VehiclesIcons.Pending,
      variant: 'info',
    },
    {
      titleKey: 'vehicles.stats.maintenance',
      value: String(maintenance),
      noteKey: 'vehicles.stats.maintenanceNote',
      trend: '',
      Icon: VehiclesIcons.Maintenance,
      variant: 'warning',
    },
  ]
}

export const vehiclesManagementService = {
  async getVehiclesManagementData(): Promise<VehiclesManagementData> {
    const rows = await vehiclesService.listVehicles()
    const vehicles = rows.map(mapCompanyVehicleToVehicle)
    return {
      stats: buildVehicleStats(vehicles),
      vehicles,
    }
  },
}
