import type { BookingStatus, CompanyBooking, PaymentStatus } from '@/modules/bookings/types'

export type BookingListFilters = {
  search: string
  bookingStatus: 'all' | BookingStatus
  paymentStatus: 'all' | PaymentStatus
}

export const defaultBookingListFilters: BookingListFilters = {
  search: '',
  bookingStatus: 'all',
  paymentStatus: 'all',
}

export function filterBookings(
  bookings: CompanyBooking[],
  filters: BookingListFilters,
): CompanyBooking[] {
  const q = filters.search.trim().toLowerCase()
  return bookings.filter((booking) => {
    if (filters.bookingStatus !== 'all' && booking.bookingStatus !== filters.bookingStatus) {
      return false
    }
    if (filters.paymentStatus !== 'all' && booking.paymentStatus !== filters.paymentStatus) {
      return false
    }
    if (!q) return true
    const haystack = [
      booking.reference,
      booking.passengerName,
      booking.passengerPhone ?? '',
      booking.routeLabel,
      String(booking.id),
      booking.tripId != null ? String(booking.tripId) : '',
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
