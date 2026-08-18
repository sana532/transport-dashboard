import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { CompanyVehicleModel } from '@/modules/vehicles/types'
import type {
  VehicleCreateInput,
  VehicleUpdateInput,
  VehiclesManagementData,
} from '@/modules/vehicles/types'
import { companyVehicleModelsService } from '@/modules/vehicles/services/companyVehicleModelsService'
import { buildVehicleStats } from '@/modules/vehicles/utils/buildVehicleStats'
import { vehiclesService } from '@/modules/vehicles/services/vehiclesService'
import { mapCompanyVehicleToVehicle } from '@/modules/vehicles/utils/mapCompanyVehicle'

export type VehiclesManagementState = {
  data: VehiclesManagementData
  vehicleModels: CompanyVehicleModel[]
}

export const vehiclesManagementQueryKey = (page: number) =>
  ['vehicles', 'management', page] as const

export function useVehiclesManagement(page = 1) {
  const queryClient = useQueryClient()
  const safePage = Math.max(1, Math.floor(page))

  const query = useQuery({
    queryKey: vehiclesManagementQueryKey(safePage),
    queryFn: async (): Promise<VehiclesManagementState> => {
      const pageResult = await vehiclesService.listVehiclesPage({
        page: safePage,
        perPage: 15,
      })
      const vehicles = pageResult.vehicles.map(mapCompanyVehicleToVehicle)

      // Catalog is optional; platform list often returns 403 for company accounts.
      const catalogModels = await companyVehicleModelsService.listForCompany()

      const modelMap = new Map<number, CompanyVehicleModel>()
      for (const model of catalogModels) modelMap.set(model.id, model)
      for (const row of pageResult.vehicles) {
        if (row.vehicle_model && !modelMap.has(row.vehicle_model.id)) {
          modelMap.set(row.vehicle_model.id, row.vehicle_model)
        }
      }

      return {
        data: {
          stats: buildVehicleStats(vehicles, pageResult.counts),
          vehicles,
          pagination: {
            currentPage: pageResult.currentPage,
            lastPage: pageResult.lastPage,
            perPage: pageResult.perPage,
            total: pageResult.total,
            from: pageResult.from,
            to: pageResult.to,
          },
        },
        vehicleModels: [...modelMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['vehicles', 'management'] })
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
