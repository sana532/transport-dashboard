export type PlatformUserStatus = 'active' | 'suspended' | 'inactive'

export type PlatformUserRole = 'passenger' | 'driver' | 'company_manager' | 'admin' | string

export type PlatformUserGender = 'male' | 'female' | string

export type PlatformUser = {
  id: number
  name: string
  email: string
  phone_number: string
  gender: PlatformUserGender | null
  address: string | null
  city: string | null
  status: PlatformUserStatus
  role: PlatformUserRole
  company_id: number | null
  company_name: string | null
  score: number | null
  admin_flagged: boolean
  is_banned: boolean
  created_at: string | null
}

export type UserReliability = {
  score: number | null
  admin_flagged: boolean
  is_banned: boolean
  notes: string | null
  raw: unknown
}

export type PlatformUsersListQuery = {
  search?: string
  role?: string
  status?: PlatformUserStatus | ''
  company_id?: number
  min_score?: number
  max_score?: number
  admin_flagged?: boolean
  is_banned?: boolean
}

export type UpdatePlatformUserInput = {
  name: string
  email: string
  phone_number: string
  gender: string
  address: string
  city: string
  status: PlatformUserStatus
}

export type UpdateUserReliabilityInput = {
  admin_flagged?: boolean
  clear_ban?: boolean
}

export const PLATFORM_USER_ROLES = ['passenger', 'driver', 'company_manager', 'admin'] as const

export const PLATFORM_USER_STATUSES: PlatformUserStatus[] = ['active', 'suspended', 'inactive']
