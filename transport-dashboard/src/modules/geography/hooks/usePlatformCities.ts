import { useCallback, useEffect, useState } from 'react'
import { platformCitiesService } from '@/modules/geography/services/platformCitiesService'
import type { City, CityFormInput } from '@/modules/geography/types'

export function usePlatformCities() {
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await platformCitiesService.listCities()
      setCities(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cities')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createCity = useCallback(
    async (input: CityFormInput) => {
      const created = await platformCitiesService.createCity(input)
      await load()
      return created
    },
    [load],
  )

  const updateCity = useCallback(
    async (id: number, input: CityFormInput) => {
      const updated = await platformCitiesService.updateCity(id, input)
      await load()
      return updated
    },
    [load],
  )

  return {
    cities,
    isLoading,
    error,
    reload: load,
    createCity,
    updateCity,
  }
}
