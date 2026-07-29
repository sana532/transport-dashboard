import { motion } from 'framer-motion'
import type { DashboardStatCard } from '@/modules/dashboard/types'
import { Card, CardContent } from '@/shared/ui/Card'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'

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

function gridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1 md:max-w-md'
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (count === 3) return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
  if (count === 4) return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
  return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-5'
}

export function DashboardStatsGrid({ statCards }: DashboardStatsGridProps) {
  const { t } = useTranslation()

  if (statCards.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-[120px] items-center justify-center p-6 text-sm text-text-muted">
          {t('dashboard.emptyKpis')}
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div className={cn('grid gap-4', gridClass(statCards.length))} variants={listMotion}>
      {statCards.map(({ id, titleKey, value, trendLabel, trendTone, Icon }, index) => {
        const featured = index === 0
        return (
          <motion.div
            key={id}
            variants={itemMotion}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <Card
              className={cn(
                'h-full overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md',
                featured && 'border-[#2F3E1F]/25 bg-gradient-to-br from-[#2F3E1F] to-[#3F5429] text-white',
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        featured ? 'text-white/75' : 'text-text-muted',
                      )}
                    >
                      {t(titleKey)}
                    </p>
                    <p
                      className={cn(
                        'mt-2 truncate text-3xl font-semibold tracking-tight tabular-nums',
                        featured ? 'text-white' : 'text-text-primary',
                      )}
                    >
                      {value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                      featured ? 'bg-white/15 text-white' : 'bg-[#2F3E1F]/10 text-[#2F3E1F]',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                </div>
                {trendLabel ? (
                  <p
                    className={cn(
                      'mt-3 text-xs',
                      featured
                        ? 'text-white/80'
                        : trendTone === 'down'
                          ? 'text-red-600'
                          : trendTone === 'up'
                            ? 'text-green-700'
                            : 'text-text-muted',
                    )}
                  >
                    {trendLabel}
                  </p>
                ) : (
                  <p className={cn('mt-3 text-xs', featured ? 'text-white/55' : 'text-text-muted')}>
                    {t('dashboard.stats.liveHint')}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
