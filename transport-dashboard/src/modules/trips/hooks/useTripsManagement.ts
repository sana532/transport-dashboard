import { useQuery } from '@tanstack/react-query'
import type { TripsManagementData, TripsStatCard } from '@/modules/trips/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import {
  tripsManagementService,
  type TripsListPagination,
} from '@/modules/trips/services/tripsManagementService'
import { buildTripsStats } from '@/modules/trips/utils/buildTripsStats'
import { useTranslation } from '@/shared/i18n/useTranslation'

export type TripsManagementState = TripsManagementData & {
  trips: CompanyTrip[]
  pagination: TripsListPagination
}

export const TRIPS_PAGE_SIZE = 20

export const tripsManagementQueryKey = (locale: string, page: number, perPage: number) =>
  ['trips', 'management', locale, page, perPage] as const

export const tripsManagementAllQueryKey = (locale: string) =>
  ['trips', 'management', 'all', locale] as const

export type UseTripsManagementOptions = {
  /** `page` = one API page (default). `all` = fetch every page (archive). */
  mode?: 'page' | 'all'
  page?: number
  perPage?: number
}

export function useTripsManagement(options: UseTripsManagementOptions = {}) {
  const { locale, t } = useTranslation()
  const mode = options.mode ?? 'page'
  const page = Math.max(1, Math.floor(options.page ?? 1))
  const perPage = Math.min(
    TRIPS_PAGE_SIZE,
    Math.max(1, Math.floor(options.perPage ?? TRIPS_PAGE_SIZE)),
  )

  const query = useQuery({
    queryKey:
      mode === 'all'
        ? tripsManagementAllQueryKey(locale)
        : tripsManagementQueryKey(locale, page, perPage),
    queryFn: async (): Promise<TripsManagementState> => {
      if (mode === 'all') {
        const next = await tripsManagementService.getTripsManagementData(locale)
        const stats: TripsStatCard[] = buildTripsStats(next.trips, t)
        return {
          ...next,
          stats,
          pagination: {
            currentPage: 1,
            lastPage: 1,
            perPage: next.trips.length,
            total: next.trips.length,
            from: next.trips.length > 0 ? 1 : 0,
            to: next.trips.length,
          },
        }
      }

      const next = await tripsManagementService.getTripsManagementPage(locale, {
        page,
        perPage,
      })
      const stats: TripsStatCard[] = buildTripsStats(next.trips, t)
      return { ...next, stats }
    },
    placeholderData: (previous) => previous,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load trips management data'
      : null,
    reload: () => {
      void query.refetch()
    },
  }
}
