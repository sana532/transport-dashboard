import { motion } from 'framer-motion'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent } from '@/shared/ui/Card'
import { useDashboard } from '@/modules/dashboard/hooks/useDashboard'
import { DashboardStatsGrid } from '@/modules/dashboard/components/DashboardStatsGrid'
import { DashboardChartsRow } from '@/modules/dashboard/components/DashboardChartsRow'
import { DashboardSearchDriversRow } from '@/modules/dashboard/components/DashboardSearchDriversRow'
import { DailyBookingsCard } from '@/modules/dashboard/components/DailyBookingsCard'
import { RecentTripsCard } from '@/modules/dashboard/components/RecentTripsCard'
import { useTranslation } from '@/shared/i18n/useTranslation'

const sectionMotion = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

function DashboardLoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-surface-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-24 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-80 animate-pulse rounded-xl bg-surface-muted" />
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-72 animate-pulse rounded-xl bg-surface-muted" />
    </div>
  )
}

function DashboardErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm text-red-700">{message}</p>
        <Button onClick={onRetry} className="bg-brand-primary text-white hover:bg-brand-primary-dark">
          {t('common.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, reload } = useDashboard()

  if (isLoading) {
    return <DashboardLoadingState />
  }

  if (error || !data) {
    return <DashboardErrorState message={error ?? t('dashboard.errorUnavailable')} onRetry={reload} />
  }

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.28, ease: 'easeOut' }}
      variants={sectionMotion}
    >
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3"
        variants={sectionMotion}
      >
        <h1 className="text-xl font-semibold text-text-primary">{t('dashboard.title')}</h1>
        <div className="w-full max-w-xs">
          <Input
            type="search"
            name="dashboard-search"
            placeholder={t('dashboard.searchPlaceholder')}
            aria-label={t('dashboard.searchAria')}
            className="h-10"
          />
        </div>
      </motion.div>

      <DashboardStatsGrid statCards={data.statCards} />

      <motion.div variants={sectionMotion}>
        <DashboardChartsRow
          revenueTrendData={data.revenueTrendData}
          routePerformanceData={data.routePerformanceData}
        />
      </motion.div>

      <motion.div variants={sectionMotion}>
        <DashboardSearchDriversRow
          topDrivers={data.topDrivers}
          dailyBookings={data.dailyBookings}
        />
      </motion.div>

      <motion.div variants={sectionMotion}>
        <DailyBookingsCard dailyBookings={data.dailyBookings} />
      </motion.div>

      <motion.div variants={sectionMotion}>
        <RecentTripsCard recentTrips={data.recentTrips} />
      </motion.div>
    </motion.div>
  )
}
