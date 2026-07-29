import {
  PackageSubscribersStatIcons,
  type PackageSubscriberRow,
  type PackageSubscribersStatCard,
} from '@/modules/subscription-packages/types'
import { countActivePackageSubscribers } from '@/modules/subscription-packages/utils/countActivePackageSubscribers'

function countNewThisMonth(rows: PackageSubscriberRow[]): number {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  return rows.filter((row) => {
    if (!row.subscribedAtRaw) return false
    const parsed = new Date(
      row.subscribedAtRaw.includes('T')
        ? row.subscribedAtRaw
        : row.subscribedAtRaw.replace(' ', 'T'),
    )
    if (Number.isNaN(parsed.getTime())) return false
    return parsed.getMonth() === month && parsed.getFullYear() === year
  }).length
}

export function buildPackageSubscribersStats(
  rows: PackageSubscriberRow[],
  t: (key: string, vars?: Record<string, string | number>) => string,
): PackageSubscribersStatCard[] {
  const active = countActivePackageSubscribers(rows)
  const expired = rows.filter((row) => row.status === 'expired').length
  const thisMonth = countNewThisMonth(rows)

  return [
    {
      title: t('packageSubscribers.stats.total'),
      value: String(rows.length),
      note: t('packageSubscribers.stats.totalNote'),
      variant: 'info',
      Icon: PackageSubscribersStatIcons.Total,
    },
    {
      title: t('packageSubscribers.stats.active'),
      value: String(active),
      note: t('packageSubscribers.stats.activeNote'),
      variant: 'success',
      Icon: PackageSubscribersStatIcons.Active,
    },
    {
      title: t('packageSubscribers.stats.expired'),
      value: String(expired),
      note: t('packageSubscribers.stats.expiredNote'),
      variant: 'danger',
      Icon: PackageSubscribersStatIcons.Expired,
    },
    {
      title: t('packageSubscribers.stats.thisMonth'),
      value: thisMonth > 0 ? `+${thisMonth}` : '0',
      note: t('packageSubscribers.stats.thisMonthNote'),
      variant: 'month',
      Icon: PackageSubscribersStatIcons.Month,
    },
  ]
}
