import { Download } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { RecentTrip } from '@/modules/dashboard/types'
import { exportRowsToCsv } from '@/modules/dashboard/utils/exportToCsv'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { useTranslation } from '@/shared/i18n/useTranslation'

type RecentTripsCardProps = {
  recentTrips: RecentTrip[]
}

export function RecentTripsCard({ recentTrips }: RecentTripsCardProps) {
  const { t } = useTranslation()

  const handleExport = () => {
    const headers = [
      t('dashboard.col.tripId'),
      t('dashboard.col.busId'),
      t('dashboard.col.driverName'),
      t('dashboard.col.route'),
      t('dashboard.col.departureTime'),
      t('common.status'),
      t('dashboard.col.revenue'),
    ]
    const rows = recentTrips.map((row) => [
      row.tripId,
      row.busId,
      row.driver,
      row.route,
      row.departure,
      t(`dashboard.tripRowStatus.${row.status}`),
      row.revenue,
    ])
    exportRowsToCsv('recent-trips.csv', headers, rows)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('dashboard.recentTripsTitle')}</CardTitle>
        <Button
          className="h-9 min-w-[170px] border border-brand-primary/30 !bg-[var(--brand-primary)] px-3 !text-white shadow-sm hover:!bg-[var(--brand-primary-dark)]"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          {t('dashboard.exportToExcel') || 'Export to Excel'}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-y border-surface-muted bg-background text-text-muted">
              <tr>
                {[t('dashboard.col.tripId'), t('dashboard.col.busId'), t('dashboard.col.driverName'), t('dashboard.col.route'), t('dashboard.col.departureTime'), t('common.status'), t('dashboard.col.revenue')].map((head) => (
                  <th key={head} className="px-4 py-3 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((row) => (
                <tr key={row.tripId} className="border-b border-surface-muted text-text-secondary">
                  <td className="px-4 py-3">{row.tripId}</td>
                  <td className="px-4 py-3">{row.busId}</td>
                  <td className="px-4 py-3">{row.driver}</td>
                  <td className="px-4 py-3">{row.route}</td>
                  <td className="px-4 py-3">{row.departure}</td>
                  <td
                    className={cn(
                      'px-4 py-3',
                      row.status === 'completed' ? 'text-green-700' : 'text-blue-700',
                    )}
                  >
                    {t(`dashboard.tripRowStatus.${row.status}`)}
                  </td>
                  <td className="px-4 py-3">{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
