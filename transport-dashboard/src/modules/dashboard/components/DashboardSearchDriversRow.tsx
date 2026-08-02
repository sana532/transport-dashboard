import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { DailyBooking, DashboardDriver } from '@/modules/dashboard/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { useTranslation } from '@/shared/i18n/useTranslation'

type DashboardSearchDriversRowProps = {
  topDrivers: DashboardDriver[]
  dailyBookings: DailyBooking[]
}

export function DashboardSearchDriversRow({
  topDrivers,
  dailyBookings,
}: DashboardSearchDriversRowProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')

  const customerRows = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; bookings: number }>()
    for (const booking of dailyBookings) {
      const key = booking.customerName.toLowerCase()
      const current = map.get(key)
      if (!current) {
        map.set(key, {
          name: booking.customerName,
          phone: booking.customerPhone,
          bookings: 1,
        })
      } else {
        current.bookings += 1
      }
    }
    return Array.from(map.values())
  }, [dailyBookings])

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return customerRows
    return customerRows.filter(
      (row) =>
        row.name.toLowerCase().includes(normalized) ||
        row.phone.toLowerCase().includes(normalized),
    )
  }, [customerRows, query])

  const customerBookings = useMemo(() => {
    if (!selectedCustomer) return []
    const normalized = selectedCustomer.toLowerCase()
    return dailyBookings.filter((row) => row.customerName.toLowerCase() === normalized)
  }, [dailyBookings, selectedCustomer])

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.customerSearchTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              type="search"
              name="customer-search"
              placeholder={t('dashboard.customerSearchPlaceholder')}
              className="pl-9"
              aria-label={t('dashboard.customerSearchAria')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="overflow-hidden rounded-lg border border-surface-muted">
            <table className="app-table w-full text-left text-xs">
              <thead className="bg-background text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('dashboard.col.customerName')}</th>
                  <th className="px-3 py-2 font-medium">{t('dashboard.col.phone')}</th>
                  <th className="px-3 py-2 font-medium">{t('dashboard.col.bookings')}</th>
                  <th className="px-3 py-2 font-medium">{t('dashboard.col.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((row) => (
                  <tr key={row.name} className="border-t border-surface-muted text-text-secondary">
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.phone}</td>
                    <td className="px-3 py-2">{row.bookings}</td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setSelectedCustomer(row.name)}
                      >
                        {t('dashboard.viewDetails')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedCustomer ? (
            <div className="space-y-2 rounded-lg border border-surface-muted bg-background p-3">
              <p className="text-xs font-medium text-text-primary">
                {t('dashboard.customerBookingsTitle', { name: selectedCustomer })}
              </p>
              <ul className="space-y-1 text-xs text-text-secondary">
                {customerBookings.map((booking) => (
                  <li key={booking.bookingId} className="flex items-center justify-between gap-2">
                    <span>{booking.bookingId}</span>
                    <span>{booking.route}</span>
                    <span>{booking.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.topDriversTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {topDrivers.map((driver) => (
            <div
              key={driver.name}
              className="flex items-center justify-between rounded-lg border border-surface-muted bg-background px-3 py-2"
            >
              <p className="text-sm font-medium text-text-primary">{driver.name}</p>
              <p className="text-xs text-text-muted">
                {t('dashboard.driver.statsLine', {
                  trips: driver.trips,
                  rating: driver.rating,
                  revenue: driver.revenue,
                })}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
