import { CreditCard, Eye, Pencil, Phone, Trash2 } from 'lucide-react'
import type { Driver, DriverStatus } from '@/modules/drivers/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent } from '@/shared/ui/Card'
import { useMediaImageSrc } from '@/shared/hooks/useMediaImageSrc'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'

type DriverCardProps = {
  driver: Driver
  onView?: (driver: Driver) => void
  onEdit?: (driver: Driver) => void
  onDelete?: (driver: Driver) => void
}

function statusTextClass(status: DriverStatus): string {
  if (status === 'Available') return 'text-green-600'
  if (status === 'On Trip') return 'text-blue-600'
  return 'text-text-muted'
}

export function DriverCard({ driver, onView, onEdit, onDelete }: DriverCardProps) {
  const { t } = useTranslation()
  const { src: photoSrc, failed: photoFailed, onError: onPhotoError } =
    useMediaImageSrc(driver.avatarUrl)
  const licenseLabel =
    driver.licenseNumber && driver.licenseNumber !== '—'
      ? driver.licenseNumber
      : t('drivers.card.noLicense')

  const statusLabel =
    driver.status === 'Available'
      ? t('drivers.status.available')
      : driver.status === 'On Trip'
        ? t('drivers.status.onTrip')
        : t('drivers.status.offDuty')

  const showPhoto = Boolean(photoSrc) && !photoFailed

  return (
    <Card className="shadow-md">
      <CardContent className="space-y-4 p-4">
        <div className="flex gap-3">
          {showPhoto && photoSrc ? (
            <img
              src={photoSrc}
              alt={driver.name}
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-black/10"
              loading="lazy"
              decoding="async"
              onError={onPhotoError}
            />
          ) : (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-[var(--brand-primary)]"
              aria-hidden
            >
              {driver.avatarInitials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-text-primary">{driver.name}</p>
            <p className={cn('text-sm font-medium', statusTextClass(driver.status))}>
              {statusLabel}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-text-secondary">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
            <span className="truncate">{driver.phone}</span>
          </p>
          <p className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
            <span className="font-mono">{licenseLabel}</span>
          </p>
          <p className="text-text-muted">
            {t('drivers.card.trips', { count: String(driver.totalTrips ?? 0) })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="min-w-0 flex-1 bg-[var(--brand-primary)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-primary-dark)]"
            onClick={() => onView?.(driver)}
          >
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
            {t('drivers.card.viewProfile')}
          </Button>
          <button
            type="button"
            className="rounded-lg border border-border bg-surface p-2 text-text-muted hover:bg-surface-muted"
            aria-label={t('drivers.profile.edit')}
            onClick={() => onEdit?.(driver)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg border border-border bg-surface p-2 text-red-600 hover:bg-red-50"
            aria-label={t('drivers.actions.delete', { name: driver.name })}
            onClick={() => onDelete?.(driver)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
