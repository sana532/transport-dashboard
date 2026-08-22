import { useEffect, useId, useMemo, useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { bookingsService } from '@/modules/bookings/services/bookingsService'
import type { CompanyBooking } from '@/modules/bookings/types'
import { companyTripsService } from '@/modules/trips/services/companyTripsService'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import { formatTripRouteLabel } from '@/modules/trips/utils/mapCompanyTrip'
import {
  formatCancelMoney,
  summarizeTripCancelImpact,
} from '@/modules/trips/utils/tripCancelImpact'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { useTranslation } from '@/shared/i18n/useTranslation'

type CancelTripDialogProps = {
  open: boolean
  tripId: number | null
  tripLabel?: string
  onClose: () => void
  onRemoved?: () => void
}

export function CancelTripDialog({
  open,
  tripId,
  tripLabel,
  onClose,
  onRemoved,
}: CancelTripDialogProps) {
  const { t, locale } = useTranslation()
  const titleId = useId()
  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'

  const [trip, setTrip] = useState<CompanyTrip | null>(null)
  const [bookings, setBookings] = useState<CompanyBooking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const impact = useMemo(() => summarizeTripCancelImpact(bookings), [bookings])
  const hasPaidBookings = impact.paidBookingsCount > 0
  const hasActiveBookings = impact.activeBookingsCount > 0
  const canSubmit = !isLoading && !isSaving

  useEffect(() => {
    if (!open || tripId == null) return

    const id = tripId
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setSaveError(null)
      setTrip(null)
      setBookings([])

      const [tripResult, bookingsResult] = await Promise.allSettled([
        companyTripsService.getTrip(id),
        bookingsService.listBookingsForTrip(id),
      ])
      if (cancelled) return

      if (tripResult.status === 'fulfilled') setTrip(tripResult.value)
      if (bookingsResult.status === 'fulfilled') setBookings(bookingsResult.value)
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, tripId])

  async function handleConfirm() {
    if (tripId == null || !canSubmit) return

    setIsSaving(true)
    setSaveError(null)
    try {
      await companyTripsService.deleteTrip(tripId)
      onRemoved?.()
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('trips.cancel.deleteFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const routeLabel =
    tripLabel ||
    (trip ? formatTripRouteLabel(trip, locale) : tripId != null ? `#${tripId}` : '—')

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg p-0">
      <div className="border-b border-surface-muted px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="flex items-center gap-2 text-lg font-semibold text-[var(--title-h2)]">
              <Trash2 className="h-5 w-5 text-red-600" aria-hidden />
              {t('trips.cancel.deleteTitle')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{t('trips.cancel.deleteSubtitle')}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary"
            onClick={onClose}
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {isLoading ? (
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-surface-muted/40 px-4 py-3 text-sm">
              <p className="font-medium text-text-primary">{routeLabel}</p>
              {trip ? (
                <p className="mt-1 text-text-secondary">
                  {t('trips.cancel.tripId', { id: trip.id })}
                  {trip.departure_time
                    ? ` · ${new Date(trip.departure_time).toLocaleString(dateLocale)}`
                    : ''}
                </p>
              ) : tripId != null ? (
                <p className="mt-1 text-text-secondary">
                  {t('trips.cancel.tripId', { id: tripId })}
                </p>
              ) : null}
            </div>

            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                hasActiveBookings
                  ? 'border-amber-200 bg-amber-50 text-amber-950'
                  : 'border-border bg-surface text-text-secondary'
              }`}
            >
              <div className="flex items-start gap-2">
                {hasActiveBookings ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                ) : null}
                <div className="space-y-1">
                  {hasActiveBookings ? (
                    <>
                      <p>
                        {t('trips.cancel.bookingsSummary', {
                          count: impact.activeBookingsCount,
                        })}
                      </p>
                      {hasPaidBookings ? (
                        <p className="font-medium">
                          {t('trips.cancel.paidSummary', {
                            count: impact.paidBookingsCount,
                            amount: formatCancelMoney(
                              impact.paidAmount,
                              impact.currency,
                              dateLocale,
                            ),
                          })}
                        </p>
                      ) : null}
                      <p className="text-xs">{t('trips.cancel.autoActions')}</p>
                    </>
                  ) : (
                    <p>{t('trips.cancel.noBookingsHint')}</p>
                  )}
                </div>
              </div>
            </div>

            {saveError ? (
              <p className="text-sm text-red-700" role="alert">
                {saveError}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-surface-muted px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          className="bg-red-700 text-white hover:bg-red-800 disabled:opacity-60"
          onClick={() => void handleConfirm()}
          disabled={!canSubmit}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {isSaving ? t('trips.cancel.deleting') : t('trips.cancel.deleteConfirm')}
        </Button>
      </div>
    </Modal>
  )
}
