import { ArrowLeft, Calendar, CreditCard, MapPin, Ticket, User } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BookingStatusBadge } from '@/modules/bookings/components/BookingStatusBadge'
import { useBookingDetail } from '@/modules/bookings/hooks/useBookingDetail'
import {
  formatBookingAmount,
  formatBookingDate,
  formatPaymentMethodLabel,
} from '@/modules/bookings/utils/mapCompanyBooking'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

function DetailLoading() {
  return (
    <div className="space-y-5">
      <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-surface-muted" />
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-secondary">{label}</p>
      <p className="mt-1 text-sm text-text-primary">{value}</p>
    </div>
  )
}

export function BookingDetailsPage() {
  const { t, locale } = useTranslation()
  const { bookingId } = useParams()
  const { booking, isLoading, error, reload } = useBookingDetail(bookingId)
  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'

  if (isLoading) return <DetailLoading />

  if (error || !booking) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-red-700">{error ?? t('bookings.notFound')}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reload} className="bg-brand-primary text-white hover:bg-brand-primary-dark">
              {t('common.retry')}
            </Button>
            <Link to={paths.company.bookings}>
              <Button variant="outline">{t('bookings.backToList')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={paths.company.bookings}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('bookings.backToList')}
          </Link>
          <h1 className="text-[34px] font-semibold tracking-tight text-text-primary">
            {t('bookings.detailsTitle')}
          </h1>
          <p className="mt-1 font-mono text-sm text-text-muted">{booking.reference}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge kind="booking" status={booking.bookingStatus} />
          <BookingStatusBadge kind="payment" status={booking.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <User className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle className="text-lg">{t('bookings.section.passenger')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5">
            <Field label={t('bookings.col.passenger')} value={booking.passengerName} />
            <Field
              label={t('bookings.col.phone')}
              value={booking.passengerPhone ?? '—'}
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <MapPin className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle className="text-lg">{t('bookings.section.trip')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5">
            <Field label={t('bookings.col.route')} value={booking.routeLabel} />
            <Field
              label={t('bookings.field.tripId')}
              value={booking.tripId != null ? String(booking.tripId) : '—'}
            />
            <Field
              label={t('bookings.field.departure')}
              value={
                booking.departureTime
                  ? formatBookingDate(booking.departureTime, dateLocale)
                  : '—'
              }
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
              <Ticket className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle className="text-lg">{t('bookings.section.tickets')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5">
            <Field label={t('bookings.col.seats')} value={String(booking.seatCount)} />
            <Field
              label={t('bookings.field.seatNumbers')}
              value={booking.seatNumbers ?? '—'}
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted pb-4">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                'bg-violet-100 text-violet-800',
              )}
            >
              <CreditCard className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle className="text-lg">{t('bookings.section.payment')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5">
            <Field
              label={t('bookings.col.amount')}
              value={formatBookingAmount(
                booking.totalAmount,
                dateLocale,
                booking.currency ?? 'SYP',
              )}
            />
            <div>
              <p className="text-sm font-semibold text-text-secondary">
                {t('bookings.col.payment')}
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {booking.paymentMethod ? (
                  <span className="text-sm text-text-primary">
                    {formatPaymentMethodLabel(booking.paymentMethod, t)}
                  </span>
                ) : null}
                <BookingStatusBadge kind="payment" status={booking.paymentStatus} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-secondary">
                {t('bookings.col.bookingStatus')}
              </p>
              <div className="mt-2">
                <BookingStatusBadge kind="booking" status={booking.bookingStatus} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-text-secondary">
            <Calendar className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle className="text-lg">{t('bookings.section.dates')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <Field
            label={t('bookings.col.bookedAt')}
            value={formatBookingDate(booking.bookedAt, dateLocale)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
