import { useCallback, useEffect, useRef, useState } from 'react'
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
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const next = await tripsManagementService.getTripsManagementData(locale)
      if (requestId !== requestIdRef.current) return

      const stats: TripsStatCard[] = buildTripsStats(next.trips, t)
      setData({ ...next, stats })
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(
        err instanceof Error ? err.message : 'Failed to load trips management data',
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [locale, t])

  useEffect(() => {
    void load()
    return () => {
      requestIdRef.current += 1
    }
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
