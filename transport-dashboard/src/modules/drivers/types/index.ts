import {
  CheckCircle2,
  Clock,
  Route,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ID } from '@/shared/types'

export type DriverId = ID

export type DriverProfileStatus = 'active' | 'inactive' | 'on_trip' | string

export type DriverProfile = {
  id: number
  user_id: number
  company_id: number
  license_number: string | null
  license_expiration_date?: string | null
  license_status?: string | null
  years_of_experience?: number | null
  driving_since_date?: string | null
  rating: string
  rating_count: number
  total_rides: number
  total_trips?: number
  salary: string
  status: DriverProfileStatus
  avatar: string | null
  media?: unknown
  driver_license: string | null
  created_at?: string
  updated_at?: string
}

export type CompanyDriverRole = {
  id: number
  name: string
  guard_name: string
}

export type CompanyDriver = {
  id: number
  name: string
  username: string
  phone_number: string
  gender?: string | null
  address?: string | null
  city?: unknown
  email?: string | null
  company_id: number
  roles?: CompanyDriverRole[]
  driver_profile: DriverProfile | null
  /** True when the index marks the driver as currently on a trip. */
  in_trip?: boolean
  /** Original list/show row id before mapping to user id (DELETE often uses this). */
  source_id?: number
  created_at?: string
  updated_at?: string
}

export type DriverCreateInput = {
  name: string
  phone_number: string
  password: string
  password_confirmation: string
  license_number?: string
  license_expiration_date?: string
  years_of_experience?: number
  /** driver_profile.status in response — sent flat on create/update per Postman */
  status?: string
  avatar?: File
}

export type DriverUpdateInput = {
  name: string
  /** Omit when unchanged — avoids duplicate phone validation on PATCH */
  phone_number?: string
  license_number?: string
  license_expiration_date?: string
  years_of_experience?: number
  /** driver_profile.status in response — sent flat on create/update per Postman */
  status?: string
  avatar?: File
}

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty'

export type Driver = {
  id: DriverId
  /** driver_profile.id — used as fallback when PATCH by user id returns 404 */
  profileId?: string
  /** Original API row id from GET /company/drivers (may differ from user id). */
  listId?: string
  name: string
  status: DriverStatus
  phone: string
  licenseNumber: string
  experienceYears: number
  /** Profile photo URL from API or storage; when missing, initials are shown */
  avatarUrl?: string
  /** Two letters shown when there is no photo or the image fails to load */
  avatarInitials: string
  /** Account & detail fields (mock / API) for forms and Quick Info */
  email?: string
  username?: string
  licenseExpiry?: string
  assignedVehicle?: string
  driverCode?: string
  joinDateLabel?: string
  totalTrips?: number
  rating?: number
  ratingCount?: number
}

export type DriversStatVariant = 'primary' | 'success' | 'info' | 'neutral'

export type DriversStatCard = {
  title: string
  value: string
  note: string
  trend: string
  variant: DriversStatVariant
  Icon: LucideIcon
}

export type DriversFilters = {
  search: string
  status: string
  experience: string
  licenseStatus: string
}

export type DriversListPagination = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number
  to: number
}

export type DriversManagementData = {
  stats: DriversStatCard[]
  drivers: Driver[]
  defaultFilters: DriversFilters
  pagination: DriversListPagination
}

export const DriversIcons = {
  Total: Users,
  Available: CheckCircle2,
  OnTrip: Route,
  OffDuty: Clock,
} as const
