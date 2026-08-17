import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Download, Eye, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BookingStatusBadge } from '@/modules/bookings/components/BookingStatusBadge'
import { useBookingsManagement } from '@/modules/bookings/hooks/useBookingsManagement'
import type { BookingsStatVariant } from '@/modules/bookings/types'
import {
  defaultBookingListFilters,
  filterBookings,
  type BookingListFilters,
} from '@/modules/bookings/utils/filterBookings'
import {
  formatBookingAmount,
  formatBookingDate,
  formatBookingTripId,
  formatPaymentMethodLabel,
} from '@/modules/bookings/utils/mapCompanyBooking'
import { exportRowsToCsv } from '@/modules/dashboard/utils/exportToCsv'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-primary shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function statCardClass(variant: BookingsStatVariant): string {
  if (variant === 'primary') return 'bg-[#2F3E1F] text-white border-[#2F3E1F]'
  if (variant === 'success') return 'border-l-4 border-l-green-500'
  if (variant === 'warning') return 'border-l-4 border-l-amber-500'
  return 'border-l-4 border-l-blue-500'
}

function BookingsLoadingBody() {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-28 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-xl bg-surface-muted" />
    </>
  )
}

function BookingsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm text-red-700">{message}</p>
        <Button
          onClick={onRetry}
          className="bg-brand-primary text-white hover:bg-brand-primary-dark"
        >
          {t('common.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function BookingsManagementPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<BookingListFilters>(defaultBookingListFilters)
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error, reload } = useBookingsManagement(page)

  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-US'

  const filteredRows = useMemo(() => {
    if (!data) return []
    return filterBookings(data.bookings, filters)
  }, [data, filters])

  const pagination = data?.pagination
  const lastPage = pagination?.lastPage ?? 1
  const safePage = Math.min(page, lastPage)

  useEffect(() => {
    if (!pagination) return
    if (page > pagination.lastPage) setPage(pagination.lastPage)
  }, [page, pagination])

  const visiblePages = useMemo(() => {
    if (!pagination) return [] as number[]
    const start = Math.max(1, Math.min(pagination.currentPage - 2, pagination.lastPage - 4))
    const end = Math.min(pagination.lastPage, start + 4)
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
  }, [pagination])

  const from = pagination?.from ?? (filteredRows.length === 0 ? 0 : 1)
  const to = pagination?.to ?? filteredRows.length
  const totalLabel = (pagination?.total ?? filteredRows.length).toLocaleString(dateLocale)

  const handleExport = () => {
    const headers = [
      t('bookings.col.reference'),
      t('bookings.col.passenger'),
      t('bookings.col.phone'),
      t('bookings.col.route'),
      t('bookings.col.tripId'),
      t('bookings.col.seats'),
      t('bookings.col.amount'),
      t('bookings.col.payment'),
      t('bookings.col.bookingStatus'),
      t('bookings.col.bookedAt'),
    ]
    const rows = filteredRows.map((row) => [
      row.reference,
      row.passengerName,
      row.passengerPhone ?? '',
      row.routeLabel,
      row.tripId != null ? String(row.tripId) : '',
      String(row.seatCount),
      formatBookingAmount(row.totalAmount, dateLocale, row.currency ?? 'SYP'),
      t(`bookings.payment.${row.paymentStatus}`),
      t(`bookings.status.${row.bookingStatus}`),
      formatBookingDate(row.bookedAt, dateLocale),
    ])
    exportRowsToCsv('company-bookings.csv', headers, rows)
  }

  if (error && !data) {
    return (
      <BookingsErrorState
        message={error ?? t('bookings.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
              {t('bookings.title')}
            </h1>
            <p className="mt-1 text-sm text-text-muted">{t('bookings.subtitle')}</p>
          </div>
        </div>
        <BookingsLoadingBody />
      </div>
    )
  }

  if (!data) {
    return (
      <BookingsErrorState
        message={t('bookings.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
            {t('bookings.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t('bookings.subtitle')}</p>
        </div>
        <Button
          type="button"
          className="h-9 min-w-[170px] border border-brand-primary/30 !bg-[var(--brand-primary)] px-3 !text-white shadow-sm hover:!bg-[var(--brand-primary-dark)]"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          {t('common.export')}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <Card key={stat.id} className={cn('shadow-md', statCardClass(stat.variant))}>
            <CardContent className="p-5">
              <p
                className={cn(
                  'text-sm font-medium',
                  stat.variant === 'primary' ? 'text-white/80' : 'text-text-muted',
                )}
              >
                {t(stat.titleKey)}
              </p>
              <p
                className={cn(
                  'mt-2 text-3xl font-semibold tracking-tight',
                  stat.variant === 'primary' ? 'text-white' : 'text-text-primary',
                )}
              >
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col gap-4 border-b border-surface-muted pb-4 lg:flex-row lg:items-end lg:justify-between">
          <CardTitle className="text-xl">{t('bookings.allBookings')}</CardTitle>
          <div className="flex w-full flex-col gap-3 lg:max-w-3xl lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                <Search className="h-4 w-4 text-text-muted" aria-hidden />
              </span>
              <Input
                name="booking-search"
                placeholder={t('bookings.searchPlaceholder')}
                aria-label={t('bookings.searchAria')}
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <div className="relative w-full sm:max-w-[180px]">
              <label htmlFor="booking-status-filter" className="sr-only">
                {t('bookings.filterBookingStatus')}
              </label>
              <select
                id="booking-status-filter"
                value={filters.bookingStatus}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    bookingStatus: e.target.value as BookingListFilters['bookingStatus'],
                  }))
                }
                className={selectClass}
              >
                <option value="all">{t('bookings.allBookingStatus')}</option>
                <option value="confirmed">{t('bookings.status.confirmed')}</option>
                <option value="pending">{t('bookings.status.pending')}</option>
                <option value="completed">{t('bookings.status.completed')}</option>
                <option value="cancelled">{t('bookings.status.cancelled')}</option>
                <option value="unknown">{t('bookings.status.unknown')}</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
            </div>
            <div className="relative w-full sm:max-w-[180px]">
              <label htmlFor="payment-status-filter" className="sr-only">
                {t('bookings.filterPaymentStatus')}
              </label>
              <select
                id="payment-status-filter"
                value={filters.paymentStatus}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    paymentStatus: e.target.value as BookingListFilters['paymentStatus'],
                  }))
                }
                className={selectClass}
              >
                <option value="all">{t('bookings.allPaymentStatus')}</option>
                <option value="paid">{t('bookings.payment.paid')}</option>
                <option value="pending">{t('bookings.payment.pending')}</option>
                <option value="failed">{t('bookings.payment.failed')}</option>
                <option value="unknown">{t('bookings.payment.unknown')}</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-medium text-text-primary">{t('bookings.emptyTitle')}</p>
              <p className="mt-2 text-sm text-text-muted">{t('bookings.emptyHint')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="app-table w-full min-w-[960px] text-left text-sm">
                  <thead className="border-y border-surface-muted bg-background text-text-muted">
                    <tr>
                      {[
                        t('bookings.col.reference'),
                        t('bookings.col.passenger'),
                        t('bookings.col.phone'),
                        t('bookings.col.route'),
                        t('bookings.col.tripId'),
                        t('bookings.col.seats'),
                        t('bookings.col.amount'),
                        t('bookings.col.payment'),
                        t('bookings.col.bookingStatus'),
                        t('bookings.col.bookedAt'),
                        t('common.actions'),
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-surface-muted text-text-secondary"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-text-primary">
                          {row.reference}
                        </td>
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {row.passengerName}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {row.passengerPhone ?? '—'}
                        </td>
                        <td className="px-4 py-3">{row.routeLabel}</td>
                        <td className="px-4 py-3">
                          {row.tripId != null ? (
                            <button
                              type="button"
                              className="font-mono text-xs font-semibold text-brand-primary hover:underline"
                              onClick={() =>
                                navigate(paths.company.tripDetails(String(row.tripId)))
                              }
                            >
                              {formatBookingTripId(row.tripId)}
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3">{row.seatCount}</td>
                        <td className="px-4 py-3">
                          {formatBookingAmount(
                            row.totalAmount,
                            dateLocale,
                            row.currency ?? 'SYP',
                          )}
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
                        <td className="px-4 py-3">
                          {formatBookingDate(row.bookedAt, dateLocale)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-text-primary hover:bg-surface-muted"
                            aria-label={`${t('bookings.aria.view')} ${row.reference}`}
                            onClick={() =>
                              navigate(paths.company.bookingDetails(String(row.id)))
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-surface-muted px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-text-muted">
                  {t('bookings.pagination.showing', {
                    from,
                    to,
                    total: totalLabel,
                  })}
                  {isFetching ? ' …' : null}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t('common.previous')}
                  </Button>
                  {visiblePages.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={n === safePage ? 'primary' : 'outline'}
                      className="h-8 min-w-8 px-2 text-xs"
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    disabled={safePage >= lastPage}
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
