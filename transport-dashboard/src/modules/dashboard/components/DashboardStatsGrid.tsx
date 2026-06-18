import { motion } from 'framer-motion'
import type { DashboardStatCard } from '@/modules/dashboard/types'
import { Card, CardContent } from '@/shared/ui/Card'
import { useTranslation } from '@/shared/i18n/useTranslation'

type DashboardStatsGridProps = {
  statCards: DashboardStatCard[]
}

const listMotion = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemMotion = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export function DashboardStatsGrid({ statCards }: DashboardStatsGridProps) {
  const { t } = useTranslation()
  return (
    <motion.div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      variants={listMotion}
    >
      {statCards.map(({ id, titleKey, value, trendKey, Icon }) => (
        <motion.div
          key={id}
          variants={itemMotion}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">{t(titleKey)}</p>
                  <p className="mt-1 text-[28px] font-semibold leading-none text-text-primary">
                    {value}
                  </p>
                </div>
                <Icon className="h-5 w-5 shrink-0 text-brand-primary" />
              </div>
              <p className="mt-2 text-xs text-green-700">{t(trendKey)}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
