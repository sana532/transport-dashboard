import { packagesManagementMockData } from '@/modules/subscription-packages/mock/packagesManagementData'
import {
  PackageSubscribersStatIcons,
  type PackageSubscribersManagementData,
  type PackageSubscriberRow,
} from '@/modules/subscription-packages/types'

function planTitleForId(packageId: string): string {
  const plan = packagesManagementMockData.plans.find((p) => p.id === packageId)
  if (plan) return plan.name
  return 'Package'
}

const SAMPLE_ROWS: PackageSubscriberRow[] = [
  {
    id: 's1',
    name: 'Sarah Johnson',
    phone: '+1 (555) 201-8891',
    avatarUrl: 'https://picsum.photos/seed/sub-s1/64/64',
    subscriptionDate: 'Jan 12, 2024',
    expirationDate: 'Jan 12, 2025',
    status: 'active',
  },
  {
    id: 's2',
    name: 'Michael Chen',
    phone: '+1 (555) 442-1022',
    avatarUrl: 'https://picsum.photos/seed/sub-s2/64/64',
    subscriptionDate: 'Mar 03, 2023',
    expirationDate: 'Mar 03, 2024',
    status: 'expired',
  },
  {
    id: 's3',
    name: 'Emily Rodriguez',
    phone: '+1 (555) 993-4410',
    avatarUrl: 'https://picsum.photos/seed/sub-s3/64/64',
    subscriptionDate: 'Nov 20, 2024',
    expirationDate: 'Nov 20, 2025',
    status: 'active',
  },
]

export function buildPackageSubscribersMock(packageId: string): PackageSubscribersManagementData {
  const baseTotal = packageId === 'plan-premium' ? 247 : packageId === 'plan-basic' ? 128 : 64
  const active =
    packageId === 'plan-premium' ? 198 : Math.max(0, Math.floor(baseTotal * 0.8))
  const expired =
    packageId === 'plan-premium' ? 49 : Math.max(0, baseTotal - active)

  return {
    packageId,
    packageTitle: planTitleForId(packageId),
    stats: [
      {
        title: 'Total Subscribers',
        value: String(baseTotal),
        note: 'All time',
        variant: 'info',
        Icon: PackageSubscribersStatIcons.Total,
      },
      {
        title: 'Active',
        value: String(active),
        note: 'Current term',
        variant: 'success',
        Icon: PackageSubscribersStatIcons.Active,
      },
      {
        title: 'Expired',
        value: String(expired),
        note: 'Needs renewal',
        variant: 'danger',
        Icon: PackageSubscribersStatIcons.Expired,
      },
      {
        title: 'This Month',
        value: packageId === 'plan-premium' ? '+23' : '+8',
        note: 'New signups',
        variant: 'month',
        Icon: PackageSubscribersStatIcons.Month,
      },
    ],
    rows: SAMPLE_ROWS,
    totalResults: baseTotal,
    page: 1,
    pageSize: 3,
  }
}
