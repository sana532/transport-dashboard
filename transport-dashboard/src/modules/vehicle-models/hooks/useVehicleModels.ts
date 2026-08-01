import { useCallback, useEffect, useState } from 'react'
import { vehicleModelsService } from '@/modules/vehicle-models/services/vehicleModelsService'
import type {
  CreateVehicleModelInput,
  UpdateVehicleModelInput,
  VehicleModel,
} from '@/modules/vehicle-models/types'

export function useVehicleModels() {
  const [models, setModels] = useState<VehicleModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await vehicleModelsService.listVehicleModels()
      setModels(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicle models')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createModel = useCallback(
    async (input: CreateVehicleModelInput) => {
      const created = await vehicleModelsService.createVehicleModel(input)
      await vehicleModelsService.syncModelSeatsFromLayout(created.id, input.layoutConfigJson)
      await load()
      return created
    },
    [load],
  )

  const updateModel = useCallback(
    async (id: number, input: UpdateVehicleModelInput) => {
      const updated = await vehicleModelsService.updateVehicleModel(id, input)
      await vehicleModelsService.syncModelSeatsFromLayout(id, input.layoutConfigJson)
      await load()
      return updated
    },
    [load],
  )

  const deleteModel = useCallback(
    async (id: number) => {
      await vehicleModelsService.deleteVehicleModel(id)
      await load()
    },
    [load],
  )

  return {
    models,
    isLoading,
    error,
    reload: load,
    createModel,
    updateModel,
    deleteModel,
  }
}
