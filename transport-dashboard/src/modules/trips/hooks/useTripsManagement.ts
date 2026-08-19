import { useQuery } from '@tanstack/react-query'
import type { TripsManagementData, TripsStatCard } from '@/modules/trips/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import type { CompanyTripsListQuery } from '@/modules/trips/types/tripsListQuery'
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

export const tripsManagementQueryKey = (
  locale: string,
  page: number,
  perPage: number,
  filtersKey: string,
) => ['trips', 'management', locale, page, perPage, filtersKey] as const

export const tripsManagementAllQueryKey = (locale: string) =>
  ['trips', 'management', 'all', locale] as const

function stableFiltersKey(filters: CompanyTripsListQuery | undefined): string {
  if (!filters) return ''
  const { page: _page, perPage: _perPage, ...rest } = filters
  return JSON.stringify(rest)
}

export type UseTripsManagementOptions = {
  /** `page` = one API page (default). `all` = fetch every page (archive). */
  mode?: 'page' | 'all'
  page?: number
  perPage?: number
  /** Server-side list filters (search, status, route_id, …). */
  filters?: Omit<CompanyTripsListQuery, 'page' | 'perPage'>
}

export function useTripsManagement(options: UseTripsManagementOptions = {}) {
  const { locale, t } = useTranslation()
  const mode = options.mode ?? 'page'
  const page = Math.max(1, Math.floor(options.page ?? 1))
  const perPage = Math.min(
    TRIPS_PAGE_SIZE,
    Math.max(1, Math.floor(options.perPage ?? TRIPS_PAGE_SIZE)),
  )
  const filters = options.filters
  const filtersKey = stableFiltersKey(filters)

  const query = useQuery({
    queryKey:
      mode === 'all'
        ? ([...tripsManagementAllQueryKey(locale), filtersKey] as const)
        : tripsManagementQueryKey(locale, page, perPage, filtersKey),
    queryFn: async (): Promise<TripsManagementState> => {
      if (mode === 'all') {
        const next = await tripsManagementService.getTripsManagementData(locale, filters)
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
        ...filters,
        page,
        perPage,
      })
      const stats: TripsStatCard[] = buildTripsStats(next.trips, t, next.counts)
      return { ...next, stats }
    },
    // Keep previous page only while paginating the same filter set — never across filter changes.
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery) return undefined
      const prevKey = previousQuery.queryKey
      if (
        mode !== 'all' &&
        Array.isArray(prevKey) &&
        prevKey[0] === 'trips' &&
        prevKey[1] === 'management' &&
        prevKey[5] === filtersKey
      ) {
        return previousData
      }
      return undefined
    },
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
