import type { SubscriptionPackage } from '@/modules/subscription-packages/types'

type PackageSummaryProps = {
  pkg: SubscriptionPackage
}

export function PackageSummary({ pkg }: PackageSummaryProps) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <p className="font-medium text-slate-900 dark:text-slate-100">{pkg.name}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        ${pkg.priceMonthly}/mo · up to {pkg.maxTrips} trips
      </p>
    </div>
  )
}
