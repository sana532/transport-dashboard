import {
  VehiclesIcons,
  type Vehicle,
  type VehiclesStatCard,
} from '@/modules/vehicles/types'

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

export function buildVehicleStats(
  vehicles: Vehicle[],
  counts?: Record<string, unknown> | null,
): VehiclesStatCard[] {
  const totalLocal = vehicles.length
  const availableLocal = vehicles.filter((v) => v.status === 'Available').length
  const inTripLocal = vehicles.filter((v) => v.status === 'In Trip').length
  const maintenanceLocal = vehicles.filter((v) => v.status === 'Maintenance').length

  const total = pickCount(counts, 'total') ?? totalLocal
  const available = pickCount(counts, 'available', 'active') ?? availableLocal
  const inTrip = pickCount(counts, 'in_trip', 'on_trip', 'inTrip') ?? inTripLocal
  const maintenance =
    pickCount(counts, 'maintenance', 'inactive') ??
    (counts ? Math.max(0, total - available - inTrip) : maintenanceLocal)

  return [
    {
      titleKey: 'vehicles.stats.total',
      value: String(total),
      noteKey: 'vehicles.stats.totalNote',
      trend: '',
      Icon: VehiclesIcons.Total,
      variant: 'primary',
    },
    {
      titleKey: 'vehicles.stats.available',
      value: String(available),
      noteKey: 'vehicles.stats.availableNote',
      trend: '',
      Icon: VehiclesIcons.Available,
      variant: 'success',
    },
    {
      titleKey: 'vehicles.stats.inTrip',
      value: String(inTrip),
      noteKey: 'vehicles.stats.inTripNote',
      trend: '',
      Icon: VehiclesIcons.InTrip,
      variant: 'info',
    },
    {
      titleKey: 'vehicles.stats.maintenance',
      value: String(maintenance),
      noteKey: 'vehicles.stats.maintenanceNote',
      trend: '',
      Icon: VehiclesIcons.Maintenance,
      variant: 'warning',
    },
  ]
}
