import type { PackageSubscriberRow } from '@/modules/subscription-packages/types'

export function countActivePackageSubscribers(rows: PackageSubscriberRow[]): number {
  return rows.filter((row) => row.status === 'active').length
}
