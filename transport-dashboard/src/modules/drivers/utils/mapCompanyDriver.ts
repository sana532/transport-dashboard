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
  if (key === 'on_trip' || key === 'in_trip' || key === 'on trip' || key === 'in trip' || key === 'busy') {
    return 'On Trip'
  }
  if (key === 'active' || key === 'available') return 'Available'
  return 'Off Duty'
}

/** Maps UI availability to API driver_profile.status */
export function mapDriverStatusToApi(status: DriverStatus): string {
  if (status === 'Off Duty') return 'inactive'
  return 'active'
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
  const ratingCount = profile?.rating_count
  const licenseNumber = profile?.license_number?.trim() || '—'
  const experienceYears = profile?.years_of_experience
  const licenseExpiry = profile?.license_expiration_date?.slice(0, 10)

  return {
    id: String(row.id),
    profileId: profile?.id ? String(profile.id) : undefined,
    listId: row.source_id ? String(row.source_id) : undefined,
    name: row.name,
    status: row.in_trip ? 'On Trip' : mapProfileStatus(profile?.status),
    phone: row.phone_number,
    licenseNumber,
    experienceYears:
      experienceYears != null && Number.isFinite(experienceYears)
        ? Math.round(experienceYears)
        : 0,
    avatarUrl: firstMediaUrl(
      profile?.avatar,
      profile?.media,
      profile,
      row,
      { parentId: profile?.id, collection: 'avatar' },
    ),
    avatarInitials: initialsFromName(row.name),
    email: row.email ?? undefined,
    username: row.username,
    licenseExpiry: licenseExpiry || undefined,
    assignedVehicle: undefined,
    driverCode: row.username ? row.username : `DRV-${row.id}`,
    joinDateLabel: formatJoinDate(profile?.created_at ?? row.created_at),
    totalTrips: profile?.total_trips ?? profile?.total_rides ?? 0,
    rating: Number.isFinite(rating) ? rating : undefined,
    ratingCount: ratingCount != null && Number.isFinite(ratingCount) ? ratingCount : 0,
  }
}
