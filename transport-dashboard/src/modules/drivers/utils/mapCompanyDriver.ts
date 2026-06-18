import type { CompanyDriver, Driver, DriverStatus } from '@/modules/drivers/types'
import { firstMediaUrl } from '@/shared/utils/pickMediaUrls'

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function mapProfileStatus(raw: string | undefined): DriverStatus {
  const key = (raw ?? '').toLowerCase().replace(/-/g, '_')
  if (key === 'active' || key === 'available') return 'Available'
  if (key === 'on_trip' || key === 'on trip' || key === 'busy') return 'On Trip'
  return 'Off Duty'
}

function formatJoinDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function mapCompanyDriverToDriver(row: CompanyDriver): Driver {
  const profile = row.driver_profile
  const rating = profile?.rating != null ? Number.parseFloat(String(profile.rating)) : undefined
  const licenseNumber = profile?.license_number?.trim() || '—'

  return {
    id: String(row.id),
    name: row.name,
    status: mapProfileStatus(profile?.status),
    phone: row.phone_number,
    licenseNumber,
    experienceYears: 0,
    avatarUrl: firstMediaUrl(profile?.avatar, profile),
    avatarInitials: initialsFromName(row.name),
    email: row.email ?? undefined,
    username: row.username,
    licenseExpiry: undefined,
    assignedVehicle: undefined,
    driverCode: row.username ? row.username : `DRV-${row.id}`,
    joinDateLabel: formatJoinDate(profile?.created_at ?? row.created_at),
    totalTrips: profile?.total_rides ?? 0,
    rating: Number.isFinite(rating) ? rating : undefined,
  }
}
