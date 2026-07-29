import { useCallback, useEffect, useState } from 'react'
import { platformRestAreasService } from '@/modules/geography/services/platformRestAreasService'
import type { RestArea, RestAreaFormInput } from '@/modules/geography/types'

export function usePlatformRestAreas() {
  const [restAreas, setRestAreas] = useState<RestArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await platformRestAreasService.listRestAreas()
      setRestAreas(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rest areas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createRestArea = useCallback(
    async (input: RestAreaFormInput) => {
      const created = await platformRestAreasService.createRestArea(input)
      await load()
      return created
    },
    [load],
  )

  const updateRestArea = useCallback(
    async (id: number, input: RestAreaFormInput) => {
      const updated = await platformRestAreasService.updateRestArea(id, input)
      await load()
      return updated
    },
    [load],
  )

  const deleteRestArea = useCallback(
    async (id: number) => {
      await platformRestAreasService.deleteRestArea(id)
      await load()
    },
    [load],
  )

  return {
    restAreas,
    isLoading,
    error,
    reload: load,
    createRestArea,
    updateRestArea,
    deleteRestArea,
  }
}
