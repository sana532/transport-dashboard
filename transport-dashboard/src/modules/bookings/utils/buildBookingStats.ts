import type { BookingsManagementData, CompanyBooking } from '@/modules/bookings/types'

function pickCount(counts: Record<string, unknown> | null | undefined, ...keys: string[]): number | undefined {
  if (!counts) return undefined
  for (const key of keys) {
    const value = counts[key]
    if (value == null || value === '') continue
    const n = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export function buildBookingStats(
  bookings: CompanyBooking[],
  counts?: Record<string, unknown> | null,
): BookingsManagementData['stats'] {
  const total =
    pickCount(counts, 'total') ?? bookings.length
  const confirmed =
    pickCount(counts, 'confirmed') ??
    bookings.filter((b) => b.bookingStatus === 'confirmed').length
  const pendingPayment =
    pickCount(counts, 'pending_payment', 'pendingPayment', 'unpaid', 'pending') ??
    bookings.filter((b) => b.paymentStatus === 'pending').length
  const cancelled =
    pickCount(counts, 'cancelled', 'canceled') ??
    bookings.filter((b) => b.bookingStatus === 'cancelled').length

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
