import { useCallback, useEffect, useState } from 'react'
import type {
  Driver,
  DriverCreateInput,
  DriverUpdateInput,
  DriversManagementData,
} from '@/modules/drivers/types'
import { driversManagementService } from '@/modules/drivers/services/driversManagementService'
import { driversService } from '@/modules/drivers/services/driversService'
import { mapCompanyDriverToDriver } from '@/modules/drivers/utils/mapCompanyDriver'

export function useDriversManagement() {
  const [data, setData] = useState<DriversManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const next = await driversManagementService.getDriversManagementData()
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drivers management data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createDriver = useCallback(
    async (input: DriverCreateInput): Promise<Driver> => {
      const created = await driversService.createDriver(input)
      await load()
      return mapCompanyDriverToDriver(created)
    },
    [load],
  )

  const updateDriver = useCallback(
    async (id: number, input: DriverUpdateInput): Promise<Driver> => {
      const updated = await driversService.updateDriver(id, input)
      await load()
      return mapCompanyDriverToDriver(updated)
    },
    [load],
  )

  const deleteDriver = useCallback(
    async (id: number) => {
      await driversService.deleteDriver(id)
      await load()
    },
    [load],
  )

  return { data, isLoading, error, reload: load, createDriver, updateDriver, deleteDriver }
}
