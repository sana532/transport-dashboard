import { useQuery } from '@tanstack/react-query'
import type { BookingsManagementData } from '@/modules/bookings/types'
import { bookingsService } from '@/modules/bookings/services/bookingsService'

export const bookingsManagementQueryKey = (page: number) =>
  ['bookings', 'management', page] as const

export function useBookingsManagement(page = 1) {
  const safePage = Math.max(1, Math.floor(page))

  const query = useQuery({
    queryKey: bookingsManagementQueryKey(safePage),
    queryFn: (): Promise<BookingsManagementData> =>
      bookingsService.getBookingsManagementData(safePage),
    placeholderData: (previousData) => previousData,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load bookings'
      : null,
    reload: () => {
      void query.refetch()
    },
  }
}
