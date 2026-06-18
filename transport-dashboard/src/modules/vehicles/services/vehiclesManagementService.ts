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
      title: 'Total Vehicles',
      value: String(total),
      note: 'Registered fleet',
      trend: '',
      Icon: VehiclesIcons.Total,
      variant: 'primary',
    },
    {
      title: 'Available',
      value: String(available),
      note: 'Operational & active',
      trend: '',
      Icon: VehiclesIcons.Available,
      variant: 'success',
    },
    {
      title: 'Pending Review',
      value: String(pending),
      note: 'Awaiting verification',
      trend: '',
      Icon: VehiclesIcons.Pending,
      variant: 'info',
    },
    {
      title: 'Maintenance',
      value: String(maintenance),
      note: 'Inactive or workshop',
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
