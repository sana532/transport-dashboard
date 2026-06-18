import { Bus, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'

type TripCrewSummaryProps = {
  title: string
  driverLabel: string
  driverName: string
  vehicleLabel: string
  vehicleName: string
  className?: string
}

function CrewInfoTile({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: typeof User
  label: string
  value: string
  iconClassName: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-surface-muted bg-surface-muted/35 px-4 py-3.5">
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          iconClassName,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="truncate text-base font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  )
}

export function TripCrewSummary({
  title,
  driverLabel,
  driverName,
  vehicleLabel,
  vehicleName,
  className,
}: TripCrewSummaryProps) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="border-b border-surface-muted pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-brand-primary" aria-hidden />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
        <CrewInfoTile
          icon={User}
          label={driverLabel}
          value={driverName}
          iconClassName="bg-brand-primary/10 text-brand-primary"
        />
        <CrewInfoTile
          icon={Bus}
          label={vehicleLabel}
          value={vehicleName}
          iconClassName="bg-emerald-100 text-emerald-800"
        />
      </CardContent>
    </Card>
  )
}
