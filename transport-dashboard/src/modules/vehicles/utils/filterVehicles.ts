import type { Vehicle, VehicleOperationalStatus } from '@/modules/vehicles/types'

export type VehicleStatusFilter = 'all' | VehicleOperationalStatus

export type VehicleListFilters = {
  search: string
  status: VehicleStatusFilter
  modelName: string
}

export const defaultVehicleListFilters: VehicleListFilters = {
  search: '',
  status: 'all',
  modelName: 'all',
}

export function filterVehicles(vehicles: Vehicle[], filters: VehicleListFilters): Vehicle[] {
  const q = filters.search.trim().toLowerCase()

  return vehicles.filter((vehicle) => {
    if (filters.status !== 'all' && vehicle.status !== filters.status) return false
    if (filters.modelName !== 'all' && vehicle.model !== filters.modelName) return false

    if (!q) return true

    const statusAliases =
      vehicle.status === 'Available'
        ? 'available متاح تشغيلي'
        : vehicle.status === 'In Trip'
          ? 'in trip في رحلة'
          : 'maintenance صيانة'

    const haystack = [
      vehicle.code,
      vehicle.model,
      vehicle.plateNumber,
      vehicle.vehicleType,
      vehicle.status,
      statusAliases,
      vehicle.verifiedStatus,
      vehicle.mechanicalStatus,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })
}

export function uniqueVehicleModels(vehicles: Vehicle[]): string[] {
  const names = new Set(vehicles.map((v) => v.model).filter(Boolean))
  return [...names].sort((a, b) => a.localeCompare(b))
}
