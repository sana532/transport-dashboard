import { useCallback, useEffect, useState } from 'react'
import type { TripsManagementData, TripsStatCard } from '@/modules/trips/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import { tripsManagementService } from '@/modules/trips/services/tripsManagementService'
import { buildTripsStats } from '@/modules/trips/utils/buildTripsStats'
import { useTranslation } from '@/shared/i18n/useTranslation'

export type TripsManagementState = TripsManagementData & { trips: CompanyTrip[] }

export function useTripsManagement() {
  const { locale, t } = useTranslation()
  const [data, setData] = useState<TripsManagementState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const next = await tripsManagementService.getTripsManagementData(locale)
      const stats: TripsStatCard[] = buildTripsStats(next.trips, t)
      setData({ ...next, stats })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load trips management data',
      )
    } finally {
      setIsLoading(false)
    }
  }, [locale, t])

  useEffect(() => {
    void load()
  }, [load])

  const deleteTrip = useCallback(
    async (id: number) => {
      await companyTripsService.deleteTrip(id)
      await load()
    },
    [load],
  )

  return { data, isLoading, error, reload: load, deleteTrip }
}
