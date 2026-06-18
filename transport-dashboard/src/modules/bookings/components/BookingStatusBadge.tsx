import { cn } from '@/shared/utils/cn'
import type { BookingStatus, PaymentStatus } from '@/modules/bookings/types'
import { useTranslation } from '@/shared/i18n/useTranslation'

type BookingStatusBadgeProps =
  | { kind: 'booking'; status: BookingStatus }
  | { kind: 'payment'; status: PaymentStatus }

function bookingClass(status: BookingStatus): string {
  if (status === 'confirmed') return 'bg-green-100 text-green-800'
  if (status === 'pending') return 'bg-amber-100 text-amber-900'
  if (status === 'cancelled') return 'bg-red-100 text-red-800'
  if (status === 'completed') return 'bg-blue-100 text-blue-800'
  return 'bg-surface-muted text-text-secondary'
}

function paymentClass(status: PaymentStatus): string {
  if (status === 'paid') return 'bg-green-100 text-green-800'
  if (status === 'pending') return 'bg-amber-100 text-amber-900'
  if (status === 'failed') return 'bg-red-100 text-red-800'
  return 'bg-surface-muted text-text-secondary'
}

export function BookingStatusBadge(props: BookingStatusBadgeProps) {
  const { t } = useTranslation()
  const label =
    props.kind === 'booking'
      ? t(`bookings.status.${props.status}`)
      : t(`bookings.payment.${props.status}`)
  const className =
    props.kind === 'booking' ? bookingClass(props.status) : paymentClass(props.status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {label}
    </span>
  )
}
