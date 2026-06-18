import { useCallback, useEffect, useState } from 'react'
import type { CompanyVehicleModel } from '@/modules/vehicles/types'
import type {
  VehicleCreateInput,
  VehicleUpdateInput,
  VehiclesManagementData,
} from '@/modules/vehicles/types'
import { companyVehicleModelsService } from '@/modules/vehicles/services/companyVehicleModelsService'
import { buildVehicleStats } from '@/modules/vehicles/services/vehiclesManagementService'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'
import { mapCompanyVehicleToVehicle } from '@/modules/vehicles/utils/mapCompanyVehicle'

export function useVehiclesManagement() {
  const [data, setData] = useState<VehiclesManagementData | null>(null)
  const [vehicleModels, setVehicleModels] = useState<CompanyVehicleModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const rows = await vehiclesService.listVehicles()
      const vehicles = rows.map(mapCompanyVehicleToVehicle)

      // Catalog is optional; platform list often returns 403 for company accounts.
      const catalogModels = await companyVehicleModelsService.listForCompany()

      const modelMap = new Map<number, CompanyVehicleModel>()
      for (const model of catalogModels) modelMap.set(model.id, model)
      for (const row of rows) {
        if (row.vehicle_model && !modelMap.has(row.vehicle_model.id)) {
          modelMap.set(row.vehicle_model.id, row.vehicle_model)
        }
      }

      setData({
        stats: buildVehicleStats(vehicles),
        vehicles,
      })
      setVehicleModels([...modelMap.values()].sort((a, b) => a.name.localeCompare(b.name)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles management data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createVehicle = useCallback(
    async (input: VehicleCreateInput) => {
      const created = await vehiclesService.createVehicle(input)
      await load()
      return mapCompanyVehicleToVehicle(created)
    },
    [load],
  )

  const updateVehicle = useCallback(
    async (id: number, input: VehicleUpdateInput) => {
      const updated = await vehiclesService.updateVehicle(id, input)
      await load()
      return mapCompanyVehicleToVehicle(updated)
    },
    [load],
  )

  const deleteVehicle = useCallback(
    async (id: number) => {
      await vehiclesService.deleteVehicle(id)
      await load()
    },
    [load],
  )

  return {
    data,
    vehicleModels,
    isLoading,
    error,
    reload: load,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  }
}
