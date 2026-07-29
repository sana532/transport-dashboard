import {
  Briefcase,
  CreditCard,
  Mail,
  Phone,
  Star,
  User,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { Driver, DriverStatus } from '@/modules/drivers/types'
import { useMediaImageSrc } from '@/shared/hooks/useMediaImageSrc'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Modal } from '@/shared/ui/Modal'
import { cn } from '@/shared/utils/cn'

export type DriverProfileDialogProps = {
  open: boolean
  onClose: () => void
  driver: Driver | null
  onEdit?: (driver: Driver) => void
}

function statusTextClass(status: DriverStatus): string {
  if (status === 'Available') return 'text-green-600'
  if (status === 'On Trip') return 'text-blue-600'
  return 'text-text-muted'
}

function statusLabel(status: DriverStatus, t: (key: string) => string): string {
  if (status === 'Available') return t('drivers.status.available')
  if (status === 'On Trip') return t('drivers.status.onTrip')
  return t('drivers.status.offDuty')
}

function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-surface-muted py-2.5 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-end text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}

export function DriverProfileDialog({
  open,
  onClose,
  driver,
  onEdit,
}: DriverProfileDialogProps) {
  const { t } = useTranslation()
  const { src: photoSrc, failed: photoFailed, onError: onPhotoError } = useMediaImageSrc(
    driver?.avatarUrl,
  )

  if (!driver) return null

  const showPhoto = Boolean(photoSrc) && !photoFailed
  const licenseLabel =
    driver.licenseNumber && driver.licenseNumber !== '—'
      ? driver.licenseNumber
      : t('drivers.card.noLicense')

  return (
    <Modal open={open} onClose={onClose} className="max-h-[min(92vh,880px)] max-w-2xl overflow-y-auto">
      <div className="border-b border-surface-muted px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{t('drivers.profile.title')}</h2>
            <p className="mt-1 text-sm text-text-muted">{t('drivers.profile.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-muted"
            aria-label={t('common.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          {showPhoto && photoSrc ? (
            <img
              src={photoSrc}
              alt={driver.name}
              className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-black/10"
              onError={onPhotoError}
            />
          ) : (
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-surface-muted text-2xl font-semibold text-[var(--brand-primary)]"
              aria-hidden
            >
              {driver.avatarInitials}
            </div>
          )}
          <div className="min-w-0 flex-1 text-center sm:text-start">
            <p className="text-2xl font-semibold text-text-primary">{driver.name}</p>
            <p className={cn('mt-1 text-sm font-medium', statusTextClass(driver.status))}>
              {statusLabel(driver.status, t)}
            </p>
            {driver.username ? (
              <p className="mt-1 font-mono text-xs text-text-muted">{driver.username}</p>
            ) : null}
          </div>
        </div>

        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-surface-muted px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
              {t('drivers.profile.contact')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <ProfileRow
              label={t('drivers.form.phone')}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                  {driver.phone}
                </span>
              }
            />
            <ProfileRow
              label={t('drivers.profile.email')}
              value={
                driver.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                    {driver.email}
                  </span>
                ) : (
                  '—'
                )
              }
            />
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-surface-muted px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CreditCard className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
              {t('drivers.profile.license')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <ProfileRow label={t('drivers.profile.licenseNumber')} value={licenseLabel} />
            <ProfileRow
              label={t('drivers.profile.licenseExpiry')}
              value={driver.licenseExpiry ?? '—'}
            />
            <ProfileRow
              label={t('drivers.experience')}
              value={t('drivers.profile.experienceYears', {
                count: String(driver.experienceYears),
              })}
            />
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-surface-muted px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Briefcase className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
              {t('drivers.profile.work')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <ProfileRow label={t('drivers.profile.driverId')} value={driver.driverCode ?? '—'} />
            <ProfileRow label={t('drivers.profile.joinDate')} value={driver.joinDateLabel ?? '—'} />
            <ProfileRow
              label={t('drivers.profile.totalTrips')}
              value={t('drivers.card.trips', { count: String(driver.totalTrips ?? 0) })}
            />
            <ProfileRow
              label={t('drivers.profile.rating')}
              value={
                driver.rating != null ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                    {driver.rating}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <ProfileRow
              label={t('common.status')}
              value={statusLabel(driver.status, t)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-surface-muted px-5 py-4 sm:px-6">
        {onEdit ? (
          <Button
            type="button"
            className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
            onClick={() => {
              onEdit(driver)
              onClose()
            }}
          >
            {t('drivers.profile.edit')}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </Modal>
  )
}
