import { useCallback, useMemo } from 'react'
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
import { buildDriverStats } from '@/modules/drivers/utils/buildDriverStats'
import { useTranslation } from '@/shared/i18n/useTranslation'
import {
  filterHiddenRecords,
  phoneHideKey,
  useHiddenRecordsRevision,
} from '@/shared/utils/hiddenRecords'

export const driversManagementQueryKey = (locale: string, page: number) =>
  ['drivers', 'management', locale, page] as const

function driverHideIds(driver: Driver) {
  return [driver.id, driver.profileId, driver.listId, phoneHideKey(driver.phone)]
}

export function useDriversManagement(page = 1) {
  const { t, locale } = useTranslation()
  const queryClient = useQueryClient()
  const hiddenRevision = useHiddenRecordsRevision()
  const safePage = Math.max(1, Math.floor(page))

  const query = useQuery({
    queryKey: driversManagementQueryKey(locale, safePage),
    queryFn: (): Promise<DriversManagementData> =>
      driversManagementService.getDriversManagementData(t, safePage),
    placeholderData: (previousData) => previousData,
  })

  const data = useMemo(() => {
    if (!query.data) return null
    const drivers = filterHiddenRecords('drivers', query.data.drivers, driverHideIds)
    if (drivers.length === query.data.drivers.length) return query.data
    return {
      ...query.data,
      drivers,
      stats: buildDriverStats(drivers, t),
    }
  }, [hiddenRevision, query.data, t])

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['drivers', 'management'] })
  }, [queryClient])

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
    async (
      id: number,
      options?: { profileId?: number; listId?: number; phone?: string },
    ) => {
      await driversService.deleteDriver(id, options)
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
    data,
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
