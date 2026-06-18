import { useMemo, useState } from 'react'
import { HelpCircle, User, X } from 'lucide-react'
import type { TripSeatMapEntry, TripSeatStats, TripVehicleLayout } from '@/modules/trips/types/companyTrip'
import { parseLayoutConfig } from '@/modules/vehicle-models/utils/parseLayoutConfig'
import { deriveSeatStatsFromMap } from '@/modules/trips/utils/deriveSeatStats'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Modal } from '@/shared/ui/Modal'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

type TripSeatMapProps = {
  vehicleLayout: TripVehicleLayout | null | undefined
  seatMap: TripSeatMapEntry[] | undefined
  stats?: TripSeatStats | null
  className?: string
}

type SelectedSeat = {
  seatNumber: number
  entry: TripSeatMapEntry
}

function buildSeatLookup(seatMap: TripSeatMapEntry[]): Map<number, TripSeatMapEntry> {
  const lookup = new Map<number, TripSeatMapEntry>()
  for (const seat of seatMap) {
    lookup.set(seat.seat_number, seat)
  }
  return lookup
}

export function TripSeatMap({ vehicleLayout, seatMap, stats, className }: TripSeatMapProps) {
  const { t, locale } = useTranslation()
  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'
  const [selectedSeat, setSelectedSeat] = useState<SelectedSeat | null>(null)

  const parsed = useMemo(() => {
    if (!vehicleLayout) return null
    return parseLayoutConfig(JSON.stringify(vehicleLayout))
  }, [vehicleLayout])

  const seatLookup = useMemo(
    () => buildSeatLookup(seatMap ?? []),
    [seatMap],
  )

  const displayStats = useMemo(() => {
    if (!parsed?.ok) return stats ?? null
    return deriveSeatStatsFromMap(seatMap ?? [], parsed.layout.seatCount, stats)
  }, [parsed, seatMap, stats])

  if (!parsed?.ok || !seatMap?.length) {
    return (
      <p className={cn('text-sm text-text-muted', className)}>{t('tripDetails.seatPlaceholder')}</p>
    )
  }

  const { layout } = parsed

  function openSeatDetail(seatNumber: number) {
    const entry = seatLookup.get(seatNumber)
    if (!entry) return
    setSelectedSeat({ seatNumber, entry })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {displayStats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SeatStat label={t('tripDetails.seatStats.total')} value={String(displayStats.total_seats)} />
          <SeatStat
            label={t('tripDetails.seatStats.available')}
            value={String(displayStats.available_seats)}
            valueClassName="text-emerald-700"
          />
          <SeatStat
            label={t('tripDetails.seatStats.booked')}
            value={String(displayStats.booked_seats)}
            valueClassName="text-red-700"
          />
          <SeatStat
            label={t('tripDetails.seatStats.revenue')}
            value={displayStats.total_revenue.toLocaleString(dateLocale)}
          />
        </div>
      ) : null}

      <div
        className="rounded-xl border border-border bg-surface-muted/40 px-4 py-5"
        dir="ltr"
      >
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary">
            <HelpCircle className="h-3.5 w-3.5 text-text-muted" aria-hidden />
            {t('tripDetails.seatDriver')}
          </span>
        </div>

        <div
          className="mx-auto flex flex-col items-center gap-1.5"
          style={{ maxWidth: layout.columns * 44 }}
        >
          {layout.cells.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 2.25rem))` }}
            >
              {row.map((cell, colIndex) => {
                if (cell.kind === 'aisle') {
                  return (
                    <div
                      key={`aisle-${rowIndex}-${colIndex}`}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-100/80"
                      aria-hidden
                    >
                      <span className="h-full w-0.5 rounded-full bg-slate-300" />
                    </div>
                  )
                }

                const seat = seatLookup.get(cell.seatNumber)
                const isBooked = seat?.is_booked ?? false
                const isSelected = selectedSeat?.seatNumber === cell.seatNumber

                return (
                  <button
                    key={`seat-${cell.seatNumber}`}
                    type="button"
                    aria-label={
                      isBooked
                        ? t('tripDetails.seatBookedTitle', { number: String(cell.seatNumber) })
                        : t('tripDetails.seatAvailableTitle', { number: String(cell.seatNumber) })
                    }
                    aria-pressed={isSelected}
                    onClick={() => openSeatDetail(cell.seatNumber)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isBooked ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700',
                      isSelected && 'ring-2 ring-brand-primary ring-offset-2',
                    )}
                  >
                    {cell.seatNumber}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-emerald-600" aria-hidden />
            {t('tripDetails.seatLegend.available')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-red-600" aria-hidden />
            {t('tripDetails.seatLegend.booked')}
          </span>
        </div>
        <p className="text-center text-xs text-text-muted">{t('tripDetails.seatClickHint')}</p>
      </div>

      <SeatDetailDialog
        open={selectedSeat !== null}
        seatNumber={selectedSeat?.seatNumber ?? 0}
        entry={selectedSeat?.entry ?? null}
        onClose={() => setSelectedSeat(null)}
      />
    </div>
  )
}

type SeatDetailDialogProps = {
  open: boolean
  seatNumber: number
  entry: TripSeatMapEntry | null
  onClose: () => void
}

function SeatDetailDialog({ open, seatNumber, entry, onClose }: SeatDetailDialogProps) {
  const { t } = useTranslation()

  if (!entry) return null

  const isBooked = entry.is_booked
  const empty = t('tripForm.notSet')

  function displayGender(gender: string | null): string {
    if (!gender) return empty
    const key = gender.toLowerCase()
    if (key === 'male') return t('tripDetails.seatDetail.genderMale')
    if (key === 'female') return t('tripDetails.seatDetail.genderFemale')
    return gender
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <Card className="border-0 shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-surface-muted pb-4">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span
                className={cn(
                  'rounded-md p-2 text-white',
                  isBooked ? 'bg-red-600' : 'bg-emerald-600',
                )}
              >
                <User className="h-4 w-4" aria-hidden />
              </span>
              {t('tripDetails.seatDetail.title', { number: String(seatNumber) })}
            </CardTitle>
            <p className="mt-1">
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                  isBooked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700',
                )}
              >
                {isBooked
                  ? t('tripDetails.seatLegend.booked')
                  : t('tripDetails.seatLegend.available')}
              </span>
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-9 shrink-0 px-0"
            onClick={onClose}
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {isBooked ? (
            <dl className="grid gap-3 text-sm">
              <DetailRow
                label={t('tripDetails.seatDetail.passengerName')}
                value={entry.passenger_name ?? empty}
              />
              <DetailRow
                label={t('tripDetails.seatDetail.passengerPhone')}
                value={entry.passenger_phone_number ?? empty}
                dir="ltr"
              />
              <DetailRow
                label={t('tripDetails.seatDetail.passengerGender')}
                value={displayGender(entry.passenger_gender)}
              />
              <DetailRow
                label={t('tripDetails.seatDetail.bookingReference')}
                value={entry.booking_reference ?? empty}
                dir="ltr"
              />
              <DetailRow
                label={t('tripDetails.seatDetail.ticketId')}
                value={entry.ticket_id ? String(entry.ticket_id) : empty}
                dir="ltr"
              />
            </dl>
          ) : (
            <p className="text-sm text-text-secondary">{t('tripDetails.seatDetail.availableMessage')}</p>
          )}

          <div className="flex justify-end border-t border-surface-muted pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}

function DetailRow({
  label,
  value,
  dir,
}: {
  label: string
  value: string
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className={cn('mt-1 font-medium text-text-primary', dir === 'ltr' && 'text-start')} dir={dir}>
        {value}
      </dd>
    </div>
  )
}

function SeatStat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg border border-surface-muted bg-background px-3 py-2">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={cn('mt-0.5 text-lg font-semibold text-text-primary', valueClassName)}>{value}</p>
    </div>
  )
}
