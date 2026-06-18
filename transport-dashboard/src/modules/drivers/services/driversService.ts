import { api } from '@/services/api'
import type {
  CompanyDriver,
  DriverCreateInput,
  DriverUpdateInput,
} from '@/modules/drivers/types'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function flattenDriverRaw(raw: Record<string, unknown>): Record<string, unknown> {
  const nestedUser =
    raw.user && typeof raw.user === 'object'
      ? (raw.user as Record<string, unknown>)
      : null

  if (nestedUser) {
    const profile =
      raw.driver_profile ??
      nestedUser.driver_profile ??
      (typeof raw.status === 'string' || raw.license_number !== undefined ? raw : null)

    return {
      ...nestedUser,
      id: nestedUser.id ?? raw.user_id ?? raw.id,
      driver_profile: profile,
    }
  }

  if (
    nestedUser === null &&
    typeof raw.user_id === 'number' &&
    raw.driver_profile &&
    typeof raw.driver_profile === 'object'
  ) {
    const profile = raw.driver_profile as Record<string, unknown>
    return {
      id: raw.user_id,
      name: pickString(profile, 'name') || pickString(raw, 'name'),
      phone_number: pickString(profile, 'phone_number', 'phone') || pickString(raw, 'phone_number', 'phone'),
      username: pickString(profile, 'username') || pickString(raw, 'username'),
      email: profile.email ?? raw.email ?? null,
      company_id: profile.company_id ?? raw.company_id,
      roles: profile.roles ?? raw.roles,
      driver_profile: profile,
      created_at: profile.created_at ?? raw.created_at,
      updated_at: profile.updated_at ?? raw.updated_at,
    }
  }

  return raw
}

function normalizeDriverProfile(raw: unknown): CompanyDriver['driver_profile'] {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  return {
    id,
    user_id: Number(record.user_id) || 0,
    company_id: Number(record.company_id) || 0,
    license_number:
      typeof record.license_number === 'string' ? record.license_number : null,
    rating: typeof record.rating === 'string' ? record.rating : String(record.rating ?? '0'),
    rating_count: Number(record.rating_count) || 0,
    total_rides: Number(record.total_rides) || 0,
    salary: typeof record.salary === 'string' ? record.salary : String(record.salary ?? '0'),
    status: typeof record.status === 'string' ? record.status : 'active',
    avatar: typeof record.avatar === 'string' ? record.avatar : null,
    driver_license:
      typeof record.driver_license === 'string' ? record.driver_license : null,
    created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : undefined,
  }
}

export function normalizeCompanyDriver(raw: unknown): CompanyDriver | null {
  if (!raw || typeof raw !== 'object') return null
  const flattened = flattenDriverRaw(raw as Record<string, unknown>)
  const record = flattened
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const name = pickString(record, 'name', 'full_name')
  const phone_number = pickString(record, 'phone_number', 'phone')
  const username = pickString(record, 'username')
  if (!Number.isFinite(id) || !name) return null

  let roles: CompanyDriver['roles']
  if (Array.isArray(record.roles)) {
    roles = record.roles
      .map((role) => {
        if (!role || typeof role !== 'object') return null
        const r = role as Record<string, unknown>
        const roleId = typeof r.id === 'number' ? r.id : Number(r.id)
        const roleName = typeof r.name === 'string' ? r.name : ''
        const guard_name = typeof r.guard_name === 'string' ? r.guard_name : ''
        if (!Number.isFinite(roleId) || !roleName) return null
        return { id: roleId, name: roleName, guard_name }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }

  return {
    id,
    name,
    username,
    phone_number,
    gender: typeof record.gender === 'string' ? record.gender : null,
    address: typeof record.address === 'string' ? record.address : null,
    city: record.city ?? null,
    email: typeof record.email === 'string' ? record.email : null,
    company_id: Number(record.company_id) || 0,
    roles,
    driver_profile: normalizeDriverProfile(record.driver_profile),
    created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : undefined,
  }
}

function unwrapList(payload: unknown): CompanyDriver[] {
  const items = collectApiListItems(payload)
  const drivers = items
    .map(normalizeCompanyDriver)
    .filter((item): item is CompanyDriver => item !== null)

  const seen = new Set<number>()
  return drivers.filter((driver) => {
    if (seen.has(driver.id)) return false
    seen.add(driver.id)
    return true
  })
}

function unwrapOne(payload: unknown): CompanyDriver | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data && typeof root.data === 'object') {
    return normalizeCompanyDriver(root.data)
  }
  return normalizeCompanyDriver(root)
}

export const driversService = {
  async listDrivers(): Promise<CompanyDriver[]> {
    try {
      const { data } = await api.get<unknown>('/company/drivers')
      return unwrapList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load drivers'))
    }
  },

  async createDriver(input: DriverCreateInput): Promise<CompanyDriver> {
    try {
      const { data } = await api.post<unknown>('/company/drivers', input)
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating driver')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create driver'))
    }
  },

  async updateDriver(id: number, input: DriverUpdateInput): Promise<CompanyDriver> {
    try {
      const { data } = await api.patch<unknown>(`/company/drivers/${id}`, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating driver')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update driver'))
    }
  },

  async deleteDriver(id: number): Promise<void> {
    try {
      await api.delete(`/company/drivers/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete driver'))
    }
  },
}
