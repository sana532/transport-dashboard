import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BookingStatusBadge } from '@/modules/bookings/components/BookingStatusBadge'
import type { CompanyBooking } from '@/modules/bookings/types'
import {
  formatBookingAmount,
  formatBookingDate,
  formatPaymentMethodLabel,
} from '@/modules/bookings/utils/mapCompanyBooking'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'

type TripBookingsTableProps = {
  bookings: CompanyBooking[]
}

export function TripBookingsTable({ bookings }: TripBookingsTableProps) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'

  if (bookings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-surface-muted bg-background px-4 py-8 text-center text-sm text-text-muted">
        {t('tripDetails.bookingsEmpty')}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-start text-sm">
        <thead className="border-y border-surface-muted bg-background text-text-muted">
          <tr>
            {[
              t('bookings.col.reference'),
              t('bookings.col.passenger'),
              t('bookings.col.phone'),
              t('bookings.col.seats'),
              t('tripDetails.col.seatNumbers'),
              t('bookings.col.amount'),
              t('bookings.col.payment'),
              t('bookings.col.bookingStatus'),
              t('bookings.col.bookedAt'),
              t('common.actions'),
            ].map((head) => (
              <th key={head} className="px-4 py-3 font-medium">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((row) => (
            <tr key={row.id} className="border-b border-surface-muted text-text-secondary">
              <td className="px-4 py-3 font-mono text-xs font-medium text-text-primary">
                {row.reference}
              </td>
              <td className="px-4 py-3 font-medium text-text-primary">{row.passengerName}</td>
              <td className="px-4 py-3 font-mono text-xs">{row.passengerPhone ?? '—'}</td>
              <td className="px-4 py-3">{row.seatCount}</td>
              <td className="px-4 py-3">{row.seatNumbers ?? '—'}</td>
              <td className="px-4 py-3">
                {formatBookingAmount(row.totalAmount, dateLocale, row.currency ?? 'SYP')}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  {row.paymentMethod ? (
                    <span className="text-sm text-text-primary">
                      {formatPaymentMethodLabel(row.paymentMethod, t)}
                    </span>
                  ) : null}
                  <BookingStatusBadge kind="payment" status={row.paymentStatus} />
                </div>
              </td>
              <td className="px-4 py-3">
                <BookingStatusBadge kind="booking" status={row.bookingStatus} />
              </td>
              <td className="px-4 py-3">{formatBookingDate(row.bookedAt, dateLocale)}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-text-primary hover:bg-surface-muted"
                  aria-label={`${t('bookings.aria.view')} ${row.reference}`}
                  onClick={() => navigate(paths.company.bookingDetails(String(row.id)))}
                >
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
