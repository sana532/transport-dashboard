import type { CompanyBooking } from '@/modules/bookings/types'

export type TripCancelImpact = {
  bookingsCount: number
  activeBookingsCount: number
  paidBookingsCount: number
  paidAmount: number
  currency: string | null
}

/** Bookings that still need cancel/refund handling (not already cancelled). */
export function summarizeTripCancelImpact(bookings: CompanyBooking[]): TripCancelImpact {
  const active = bookings.filter((b) => b.bookingStatus !== 'cancelled')
  const paid = active.filter((b) => b.paymentStatus === 'paid')
  const currency = paid.find((b) => b.currency)?.currency ?? active.find((b) => b.currency)?.currency ?? null
  const paidAmount = paid.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0)

  return {
    bookingsCount: bookings.length,
    activeBookingsCount: active.length,
    paidBookingsCount: paid.length,
    paidAmount,
    currency,
  }
}

export function formatCancelMoney(amount: number, currency: string | null, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: currency ? 'currency' : 'decimal',
      currency: currency || undefined,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return amount.toLocaleString(locale)
  }
}
