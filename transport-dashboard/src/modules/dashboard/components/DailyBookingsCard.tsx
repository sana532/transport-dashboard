import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { DailyBooking } from '@/modules/dashboard/types'
import { exportRowsToCsv } from '@/modules/dashboard/utils/exportToCsv'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { useTranslation } from '@/shared/i18n/useTranslation'

type DailyBookingsCardProps = {
  dailyBookings: DailyBooking[]
}

export function DailyBookingsCard({ dailyBookings }: DailyBookingsCardProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return dailyBookings
    return dailyBookings.filter((row) => {
      const haystack =
        `${row.bookingId} ${row.customerName} ${row.customerPhone} ${row.route}`.toLowerCase()
      return haystack.includes(normalized)
    })
  }, [dailyBookings, query])

  const handleExport = () => {
    const headers = [
      t('dashboard.col.bookingId'),
      t('dashboard.col.customerName'),
      t('dashboard.col.phone'),
      t('dashboard.col.route'),
      t('dashboard.col.seats'),
      t('dashboard.col.paymentStatus'),
      t('dashboard.col.bookingStatus'),
      t('dashboard.col.date'),
    ]
    const rows = filteredRows.map((row) => [
      row.bookingId,
      row.customerName,
      row.customerPhone,
      row.route,
      row.seats,
      t(`dashboard.bookingPayment.${row.payment}`),
      t(`dashboard.bookingRowStatus.${row.booking}`),
      row.date,
    ])
    exportRowsToCsv('daily-bookings.csv', headers, rows)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('dashboard.dailyBookingsTitle')}</CardTitle>
        <div className="flex items-center gap-2">
          <Input
            type="search"
            name="booking-search"
            placeholder={t('dashboard.searchBookingsPlaceholder')}
            className="h-9 w-48"
            aria-label={t('dashboard.searchBookingsAria')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            className="h-9 min-w-[170px] border border-brand-primary/30 !bg-[var(--brand-primary)] px-3 !text-white shadow-sm hover:!bg-[var(--brand-primary-dark)]"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            {t('dashboard.exportToExcel') || 'Export to Excel'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="app-table w-full min-w-[760px] text-left text-sm">
            <thead className="border-y border-surface-muted bg-background text-text-muted">
              <tr>
                {[t('dashboard.col.bookingId'), t('dashboard.col.customerName'), t('dashboard.col.route'), t('dashboard.col.seats'), t('dashboard.col.paymentStatus'), t('dashboard.col.bookingStatus'), t('dashboard.col.date')].map((head) => (
                  <th key={head} className="px-4 py-3 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.bookingId} className="border-b border-surface-muted text-text-secondary">
                  <td className="px-4 py-3">{row.bookingId}</td>
                  <td className="px-4 py-3">{row.customerName}</td>
                  <td className="px-4 py-3">{row.route}</td>
                  <td className="px-4 py-3">{row.seats}</td>
                  <td className={cn('px-4 py-3', row.payment === 'Paid' ? 'text-green-700' : 'text-amber-700')}>
                    {t(`dashboard.bookingPayment.${row.payment}`)}
                  </td>
                  <td className={cn('px-4 py-3', row.booking === 'Confirmed' ? 'text-green-700' : 'text-amber-700')}>
                    {t(`dashboard.bookingRowStatus.${row.booking}`)}
                  </td>
                  <td className="px-4 py-3">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
