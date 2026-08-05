import { useEffect, useId, useMemo, useState } from 'react'
import { AlertTriangle, Ban, X } from 'lucide-react'
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
  onCancelled?: (trip: CompanyTrip) => void
}

export function CancelTripDialog({
  open,
  tripId,
  tripLabel,
  onClose,
  onCancelled,
}: CancelTripDialogProps) {
  const { t, locale } = useTranslation()
  const titleId = useId()
  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'

  const [trip, setTrip] = useState<CompanyTrip | null>(null)
  const [bookings, setBookings] = useState<CompanyBooking[]>([])
  const [reason, setReason] = useState('')
  const [notifyPassengers, setNotifyPassengers] = useState(true)
  const [refund, setRefund] = useState(true)
  const [acknowledged, setAcknowledged] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const impact = useMemo(() => summarizeTripCancelImpact(bookings), [bookings])
  const hasPaidBookings = impact.paidBookingsCount > 0
  const hasActiveBookings = impact.activeBookingsCount > 0
  const canSubmit = !isLoading && !isSaving && (!hasActiveBookings || acknowledged)

  useEffect(() => {
    if (!open || tripId == null) return

    const id = tripId
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError(null)
      setSaveError(null)
      setReason('')
      setNotifyPassengers(true)
      setRefund(true)
      setAcknowledged(false)
      setTrip(null)
      setBookings([])

      try {
        const [tripData, tripBookings] = await Promise.all([
          companyTripsService.getTrip(id),
          bookingsService.listBookingsForTrip(id).catch(() => [] as CompanyBooking[]),
        ])
        if (cancelled) return
        setTrip(tripData)
        setBookings(tripBookings)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t('trips.cancel.loadFailed'))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, tripId, t])

  async function handleConfirm() {
    if (tripId == null || !canSubmit) return
    if (hasActiveBookings && !acknowledged) {
      setSaveError(t('trips.cancel.ackRequired'))
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const result = await companyTripsService.cancelTrip(tripId, {
        reason,
        notify_passengers: hasActiveBookings ? notifyPassengers : false,
        refund: hasPaidBookings ? refund : false,
      })
      onCancelled?.(result.trip)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('trips.cancel.failed'))
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
              <Ban className="h-5 w-5 text-red-600" aria-hidden />
              {t('trips.cancel.title')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{t('trips.cancel.subtitle')}</p>
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
        ) : loadError ? (
          <p className="text-sm text-red-700" role="alert">
            {loadError}
          </p>
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
                  <p>
                    {t('trips.cancel.bookingsSummary', {
                      count: impact.activeBookingsCount,
                    })}
                  </p>
                  {hasPaidBookings ? (
                    <p className="font-medium">
                      {t('trips.cancel.paidSummary', {
                        count: impact.paidBookingsCount,
                        amount: formatCancelMoney(impact.paidAmount, impact.currency, dateLocale),
                      })}
                    </p>
                  ) : null}
                  {hasActiveBookings ? (
                    <p className="text-xs">{t('trips.cancel.backendExpectation')}</p>
                  ) : (
                    <p className="text-xs">{t('trips.cancel.noBookingsHint')}</p>
                  )}
                </div>
              </div>
            </div>

            {hasActiveBookings ? (
              <div className="space-y-3 rounded-lg border border-border px-4 py-3">
                <label className="flex items-start gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-border text-[#2F3E1F] focus:ring-[#2F3E1F]/30"
                    checked={notifyPassengers}
                    onChange={(e) => setNotifyPassengers(e.target.checked)}
                  />
                  <span>{t('trips.cancel.notifyPassengers')}</span>
                </label>
                {hasPaidBookings ? (
                  <label className="flex items-start gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-border text-[#2F3E1F] focus:ring-[#2F3E1F]/30"
                      checked={refund}
                      onChange={(e) => setRefund(e.target.checked)}
                    />
                    <span>{t('trips.cancel.refundPaid')}</span>
                  </label>
                ) : null}
                <label className="flex items-start gap-2 text-sm font-medium text-text-primary">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-border text-[#2F3E1F] focus:ring-[#2F3E1F]/30"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                  />
                  <span>{t('trips.cancel.acknowledge')}</span>
                </label>
              </div>
            ) : null}

            <div className="grid gap-1.5">
              <label htmlFor="trip-cancel-reason" className="text-sm font-medium text-text-secondary">
                {t('trips.cancel.reason')}
              </label>
              <textarea
                id="trip-cancel-reason"
                rows={3}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('trips.cancel.reasonPlaceholder')}
              />
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
          disabled={!canSubmit || Boolean(loadError)}
        >
          <Ban className="h-4 w-4" aria-hidden />
          {isSaving ? t('trips.cancel.submitting') : t('trips.cancel.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
