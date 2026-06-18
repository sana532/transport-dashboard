import type { Driver, DriverStatus } from '@/modules/drivers/types'

export type DriverStatusFilter = 'all' | DriverStatus

export type DriverExperienceFilter = 'all' | '0-2' | '3-5' | '6+'

export type DriverLicenseFilter = 'all' | 'has' | 'missing'

export type DriverListFilters = {
  search: string
  status: DriverStatusFilter
  experience: DriverExperienceFilter
  licenseStatus: DriverLicenseFilter
}

export const defaultDriverListFilters: DriverListFilters = {
  search: '',
  status: 'all',
  experience: 'all',
  licenseStatus: 'all',
}

function hasLicenseOnFile(licenseNumber: string): boolean {
  const value = licenseNumber.trim()
  return value.length > 0 && value !== '—'
}

function matchesExperience(years: number, filter: DriverExperienceFilter): boolean {
  if (filter === 'all') return true
  if (filter === '0-2') return years >= 0 && years <= 2
  if (filter === '3-5') return years >= 3 && years <= 5
  return years >= 6
}

export function filterDrivers(drivers: Driver[], filters: DriverListFilters): Driver[] {
  const q = filters.search.trim().toLowerCase()

  return drivers.filter((driver) => {
    if (filters.status !== 'all' && driver.status !== filters.status) return false
    if (!matchesExperience(driver.experienceYears, filters.experience)) return false

    const licensed = hasLicenseOnFile(driver.licenseNumber)
    if (filters.licenseStatus === 'has' && !licensed) return false
    if (filters.licenseStatus === 'missing' && licensed) return false

    if (!q) return true

    const haystack = [
      driver.name,
      driver.phone,
      driver.username,
      driver.email,
      driver.driverCode,
      driver.licenseNumber,
      driver.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })
}
