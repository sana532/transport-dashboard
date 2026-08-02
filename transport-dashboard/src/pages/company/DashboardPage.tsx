import { motion } from 'framer-motion'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent } from '@/shared/ui/Card'
import { useDashboard } from '@/modules/dashboard/hooks/useDashboard'
import { DashboardStatsGrid } from '@/modules/dashboard/components/DashboardStatsGrid'
import { DashboardChartsRow } from '@/modules/dashboard/components/DashboardChartsRow'
import { useTranslation } from '@/shared/i18n/useTranslation'

const sectionMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-44 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-5">
        <div className="h-80 animate-pulse rounded-2xl bg-surface-muted xl:col-span-3" />
        <div className="h-80 animate-pulse rounded-2xl bg-surface-muted xl:col-span-2" />
      </div>
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
      className="space-y-6"
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.28, ease: 'easeOut', staggerChildren: 0.06 }}
      variants={sectionMotion}
    >
      <motion.div variants={sectionMotion}>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--title-h1)] sm:text-3xl">
          {t('dashboard.title')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('dashboard.subtitle')}</p>
      </motion.div>

      <motion.div variants={sectionMotion}>
        <DashboardStatsGrid statCards={data.statCards} />
      </motion.div>

      <motion.div variants={sectionMotion}>
        <DashboardChartsRow
          revenueTrendData={data.revenueTrendData}
          routePerformanceData={data.routePerformanceData}
        />
      </motion.div>
    </motion.div>
  )
}
