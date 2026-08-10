import { useQuery } from '@tanstack/react-query'
import type { BookingsManagementData } from '@/modules/bookings/types'
import { bookingsService } from '@/modules/bookings/services/bookingsService'

export const bookingsManagementQueryKey = ['bookings', 'management'] as const

export function useBookingsManagement() {
  const query = useQuery({
    queryKey: bookingsManagementQueryKey,
    queryFn: (): Promise<BookingsManagementData> =>
      bookingsService.getBookingsManagementData(),
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
