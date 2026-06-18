import { useCallback, useEffect, useState } from 'react'
import { platformStationsService } from '@/modules/geography/services/platformStationsService'
import type { Station, StationFormInput } from '@/modules/geography/types'

export function usePlatformStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await platformStationsService.listStations()
      setStations(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createStation = useCallback(
    async (input: StationFormInput) => {
      const created = await platformStationsService.createStation(input)
      await load()
      return created
    },
    [load],
  )

  const updateStation = useCallback(
    async (id: number, input: StationFormInput) => {
      const updated = await platformStationsService.updateStation(id, input)
      await load()
      return updated
    },
    [load],
  )

  const deleteStation = useCallback(
    async (id: number) => {
      await platformStationsService.deleteStation(id)
      await load()
    },
    [load],
  )

  return {
    stations,
    isLoading,
    error,
    reload: load,
    createStation,
    updateStation,
    deleteStation,
  }
}
