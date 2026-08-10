import { useQuery } from '@tanstack/react-query'
import type { ComplaintStatus, ComplaintsManagementData } from '@/modules/complaints/types'
import { complaintsManagementService } from '@/modules/complaints/services/complaintsManagementService'
import { uiStatusToApiQuery } from '@/modules/complaints/utils/mapCompanyComplaint'
import { useTranslation } from '@/shared/i18n/useTranslation'

export type ComplaintsListFilters = {
  status: 'all' | ComplaintStatus
  categoryId: 'all' | number
}

export const defaultComplaintsListFilters: ComplaintsListFilters = {
  status: 'all',
  categoryId: 'all',
}

export const complaintsManagementQueryKey = (
  locale: string,
  filters: ComplaintsListFilters,
) =>
  ['complaints', 'management', locale, filters.status, filters.categoryId] as const

export function useComplaintsManagement(
  filters: ComplaintsListFilters = defaultComplaintsListFilters,
) {
  const { locale } = useTranslation()

  const query = useQuery({
    queryKey: complaintsManagementQueryKey(locale, filters),
    queryFn: (): Promise<ComplaintsManagementData> =>
      complaintsManagementService.getComplaintsManagementData(locale, {
        status: uiStatusToApiQuery(filters.status),
        complaint_category_id:
          filters.categoryId === 'all' ? undefined : filters.categoryId,
      }),
    placeholderData: (previous) => previous,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load complaints management data'
      : null,
    reload: () => {
      void query.refetch()
    },
  }
}
