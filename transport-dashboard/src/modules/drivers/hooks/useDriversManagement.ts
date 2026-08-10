import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Driver,
  DriverCreateInput,
  DriverUpdateInput,
  DriversManagementData,
} from '@/modules/drivers/types'
import { driversManagementService } from '@/modules/drivers/services/driversManagementService'
import { driversService } from '@/modules/drivers/services/driversService'
import { mapCompanyDriverToDriver } from '@/modules/drivers/utils/mapCompanyDriver'
import { useTranslation } from '@/shared/i18n/useTranslation'

export const driversManagementQueryKey = (locale: string) =>
  ['drivers', 'management', locale] as const

export function useDriversManagement() {
  const { t, locale } = useTranslation()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: driversManagementQueryKey(locale),
    queryFn: (): Promise<DriversManagementData> =>
      driversManagementService.getDriversManagementData(t),
  })

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: driversManagementQueryKey(locale) })
  }, [queryClient, locale])

  const createDriver = useCallback(
    async (input: DriverCreateInput): Promise<Driver> => {
      const created = await driversService.createDriver(input)
      await reload()
      return mapCompanyDriverToDriver(created)
    },
    [reload],
  )

  const updateDriver = useCallback(
    async (
      id: number,
      input: DriverUpdateInput,
      options?: { profileId?: number },
    ): Promise<Driver> => {
      const updated = await driversService.updateDriver(id, input, options)
      await reload()
      return mapCompanyDriverToDriver(updated)
    },
    [reload],
  )

  const deleteDriver = useCallback(
    async (id: number) => {
      await driversService.deleteDriver(id)
      await reload()
    },
    [reload],
  )

  const resolveDriver = useCallback(async (driver: Driver): Promise<Driver> => {
    const id = Number(driver.id)
    const profileId = driver.profileId ? Number(driver.profileId) : undefined

    for (const fetchId of [id, profileId].filter(
      (value): value is number => value != null && Number.isFinite(value) && value > 0,
    )) {
      try {
        const row = await driversService.getDriver(fetchId)
        if (row) return mapCompanyDriverToDriver(row)
      } catch {
        // try next id
      }
    }

    return driver
  }, [])

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load drivers management data'
      : null,
    reload,
    resolveDriver,
    createDriver,
    updateDriver,
    deleteDriver,
  }
}
