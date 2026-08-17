import {
  DriversIcons,
  type Driver,
  type DriversStatCard,
} from '@/modules/drivers/types'

type Translate = (key: string, params?: Record<string, string | number>) => string

function pickCount(counts: Record<string, unknown> | null | undefined, ...keys: string[]): number | undefined {
  if (!counts) return undefined
  for (const key of keys) {
    const value = counts[key]
    if (value == null || value === '') continue
    const n = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export function buildDriverStats(
  drivers: Driver[],
  t: Translate,
  counts?: Record<string, unknown> | null,
): DriversStatCard[] {
  const totalLocal = drivers.length
  const availableLocal = drivers.filter((d) => d.status === 'Available').length
  const onTripLocal = drivers.filter((d) => d.status === 'On Trip').length
  const offDutyLocal = drivers.filter((d) => d.status === 'Off Duty').length

  const total = pickCount(counts, 'total') ?? totalLocal
  const available = pickCount(counts, 'available', 'active') ?? availableLocal
  const onTrip = pickCount(counts, 'in_trip', 'on_trip', 'onTrip') ?? onTripLocal
  const offDuty =
    pickCount(counts, 'off_duty', 'offDuty', 'inactive') ??
    (counts
      ? Math.max(0, total - available - onTrip)
      : offDutyLocal)

  return [
    {
      title: t('drivers.stats.total'),
      value: String(total),
      note: t('drivers.stats.totalNote'),
      trend: '',
      Icon: DriversIcons.Total,
      variant: 'primary',
    },
    {
      title: t('drivers.stats.available'),
      value: String(available),
      note: t('drivers.stats.availableNote'),
      trend: '',
      Icon: DriversIcons.Available,
      variant: 'success',
    },
    {
      title: t('drivers.stats.onTrip'),
      value: String(onTrip),
      note: t('drivers.stats.onTripNote'),
      trend: '',
      Icon: DriversIcons.OnTrip,
      variant: 'info',
    },
    {
      title: t('drivers.stats.offDuty'),
      value: String(offDuty),
      note: t('drivers.stats.offDutyNote'),
      trend: '',
      Icon: DriversIcons.OffDuty,
      variant: 'neutral',
    },
  ]
}
