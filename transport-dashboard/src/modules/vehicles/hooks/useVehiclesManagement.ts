import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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

export type VehiclesManagementState = {
  data: VehiclesManagementData
  vehicleModels: CompanyVehicleModel[]
}

export const vehiclesManagementQueryKey = ['vehicles', 'management'] as const

export function useVehiclesManagement() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: vehiclesManagementQueryKey,
    queryFn: async (): Promise<VehiclesManagementState> => {
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

      return {
        data: {
          stats: buildVehicleStats(vehicles),
          vehicles,
        },
        vehicleModels: [...modelMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
      }
    },
  })

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: vehiclesManagementQueryKey })
  }, [queryClient])

  const createVehicle = useCallback(
    async (input: VehicleCreateInput) => {
      const created = await vehiclesService.createVehicle(input)
      await reload()
      return mapCompanyVehicleToVehicle(created)
    },
    [reload],
  )

  const updateVehicle = useCallback(
    async (id: number, input: VehicleUpdateInput) => {
      const updated = await vehiclesService.updateVehicle(id, input)
      await reload()
      return mapCompanyVehicleToVehicle(updated)
    },
    [reload],
  )

  const deleteVehicle = useCallback(
    async (id: number) => {
      await vehiclesService.deleteVehicle(id)
      await reload()
    },
    [reload],
  )

  return {
    data: query.data?.data ?? null,
    vehicleModels: query.data?.vehicleModels ?? [],
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load vehicles management data'
      : null,
    reload,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  }
}
