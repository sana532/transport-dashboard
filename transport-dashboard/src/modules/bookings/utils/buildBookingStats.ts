import type { BookingsManagementData, CompanyBooking } from '@/modules/bookings/types'

export function buildBookingStats(bookings: CompanyBooking[]): BookingsManagementData['stats'] {
  const total = bookings.length
  const confirmed = bookings.filter((b) => b.bookingStatus === 'confirmed').length
  const pendingPayment = bookings.filter((b) => b.paymentStatus === 'pending').length
  const cancelled = bookings.filter((b) => b.bookingStatus === 'cancelled').length

  return [
    {
      id: 'stat-total',
      titleKey: 'bookings.stats.total',
      value: String(total),
      variant: 'primary',
    },
    {
      id: 'stat-confirmed',
      titleKey: 'bookings.stats.confirmed',
      value: String(confirmed),
      variant: 'success',
    },
    {
      id: 'stat-pending-payment',
      titleKey: 'bookings.stats.pendingPayment',
      value: String(pendingPayment),
      variant: 'warning',
    },
    {
      id: 'stat-cancelled',
      titleKey: 'bookings.stats.cancelled',
      value: String(cancelled),
      variant: 'info',
    },
  ]
}
