import { api } from '@/services/api'
import type {
  PlatformUser,
  PlatformUsersPage,
  PlatformUsersListQuery,
  PlatformUserStatus,
  UpdatePlatformUserInput,
  UpdateUserReliabilityInput,
  UserReliability,
} from '@/modules/users/types'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function pickString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value)
    }
  }
  return null
}

function pickBool(record: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'boolean') return value
    if (value === 1 || value === '1' || value === 'true') return true
    if (value === 0 || value === '0' || value === 'false') return false
  }
  return false
}

function normalizeStatus(raw: unknown): PlatformUserStatus {
  if (raw === 'active' || raw === 'suspended' || raw === 'inactive') return raw
  return 'active'
}

function nestedCompany(record: Record<string, unknown>): Record<string, unknown> | null {
  if (record.company && typeof record.company === 'object') {
    return record.company as Record<string, unknown>
  }
  return null
}

function nestedReliability(record: Record<string, unknown>): Record<string, unknown> | null {
  for (const key of ['reliability', 'user_reliability', 'reliability_profile']) {
    const value = record[key]
    if (value && typeof value === 'object') return value as Record<string, unknown>
  }
  return null
}

const ROLE_PRIORITY = ['platform_admin', 'company_admin', 'driver', 'passenger']

/** API returns `roles: [{ id, name }]`; older shapes may send a plain string */
function extractRoles(record: Record<string, unknown>): string[] {
  const raw = record.roles
  const names: string[] = []

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && item.trim()) {
        names.push(item.trim())
      } else if (item && typeof item === 'object') {
        const name = pickString(item as Record<string, unknown>, 'name', 'slug', 'role')
        if (name) names.push(name.trim())
      }
    }
  }

  const flat = pickString(record, 'role', 'user_role', 'type')
  if (flat && !names.includes(flat.trim())) names.push(flat.trim())

  return names
}

function primaryRole(roles: string[]): string {
  for (const candidate of ROLE_PRIORITY) {
    if (roles.includes(candidate)) return candidate
  }
  return roles[0] ?? 'passenger'
}

function isBanActive(bannedUntil: string | null): boolean {
  if (!bannedUntil) return false
  const parsed = new Date(bannedUntil)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getTime() > Date.now()
}

export function normalizePlatformUser(raw: unknown): PlatformUser | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const nested =
    record.user && typeof record.user === 'object'
      ? (record.user as Record<string, unknown>)
      : record

  const id = pickNumber(nested, 'id') ?? pickNumber(record, 'id')
  if (id == null) return null

  const company = nestedCompany(nested) ?? nestedCompany(record)
  const reliability = nestedReliability(nested) ?? nestedReliability(record)

  const score =
    pickNumber(nested, 'score', 'reliability_score') ??
    (reliability ? pickNumber(reliability, 'score', 'reliability_score') : null)

  const roles = extractRoles(nested)
  const rolesFromRoot = roles.length > 0 ? roles : extractRoles(record)

  const stats =
    nested.stats && typeof nested.stats === 'object'
      ? (nested.stats as Record<string, unknown>)
      : null

  const bannedUntil =
    pickString(nested, 'banned_until') ??
    (reliability ? pickString(reliability, 'banned_until') : undefined) ??
    null

  return {
    id,
    name: pickString(nested, 'name', 'full_name') ?? '—',
    username: pickString(nested, 'username') ?? null,
    email: pickString(nested, 'email') ?? '—',
    phone_number: pickString(nested, 'phone_number', 'phone') ?? '—',
    gender: pickString(nested, 'gender') ?? null,
    address: pickString(nested, 'address') ?? null,
    city: pickString(nested, 'city') ?? null,
    status: normalizeStatus(nested.status ?? record.status),
    role: primaryRole(rolesFromRoot),
    roles: rolesFromRoot,
    company_id:
      pickNumber(nested, 'company_id') ??
      (company ? pickNumber(company, 'id') : null) ??
      pickNumber(record, 'company_id'),
    company_name:
      pickString(nested, 'company_name') ??
      (company ? pickString(company, 'name') : null) ??
      null,
    score,
    admin_flagged:
      pickBool(nested, 'admin_flagged') ||
      (reliability ? pickBool(reliability, 'admin_flagged') : false),
    is_banned:
      pickBool(nested, 'is_banned', 'banned') ||
      (reliability ? pickBool(reliability, 'is_banned', 'banned') : false) ||
      isBanActive(bannedUntil),
    banned_until: bannedUntil,
    bookings_count: stats ? pickNumber(stats, 'bookings_count') : null,
    active_subscriptions_count: stats ? pickNumber(stats, 'active_subscriptions_count') : null,
    created_at: pickString(nested, 'created_at') ?? null,
  }
}

export function normalizeUserReliability(raw: unknown): UserReliability {
  if (!raw || typeof raw !== 'object') {
    return {
      score: null,
      admin_flagged: false,
      is_banned: false,
      banned_until: null,
      notes: null,
      raw,
    }
  }

  const root = raw as Record<string, unknown>
  const record =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root.reliability && typeof root.reliability === 'object'
        ? (root.reliability as Record<string, unknown>)
        : root

  const bannedUntil = pickString(record, 'banned_until') ?? null

  return {
    score: pickNumber(record, 'score', 'reliability_score'),
    admin_flagged: pickBool(record, 'admin_flagged'),
    is_banned: pickBool(record, 'is_banned', 'banned') || isBanActive(bannedUntil),
    banned_until: bannedUntil,
    notes: pickString(record, 'notes', 'admin_notes', 'reason') ?? null,
    raw,
  }
}

function unwrapUserList(payload: unknown): PlatformUser[] {
  const items = collectApiListItems(payload)
  const fromItems = items
    .map((item) => normalizePlatformUser(item))
    .filter((item): item is PlatformUser => item !== null)

  if (fromItems.length > 0) return fromItems

  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizePlatformUser(item))
      .filter((item): item is PlatformUser => item !== null)
  }

  return []
}

function unwrapUserPage(payload: unknown): PlatformUsersPage {
  const users = unwrapUserList(payload)
  const root =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : null
  const meta =
    root?.meta && typeof root.meta === 'object'
      ? (root.meta as Record<string, unknown>)
      : root

  const currentPage = (meta ? pickNumber(meta, 'current_page') : null) ?? 1
  const perPage = (meta ? pickNumber(meta, 'per_page') : null) ?? users.length
  const total = (meta ? pickNumber(meta, 'total') : null) ?? users.length
  const lastPage =
    (meta ? pickNumber(meta, 'last_page') : null) ??
    Math.max(1, perPage > 0 ? Math.ceil(total / perPage) : 1)
  const from =
    (meta ? pickNumber(meta, 'from') : null) ??
    (users.length > 0 ? (currentPage - 1) * perPage + 1 : 0)
  const to =
    (meta ? pickNumber(meta, 'to') : null) ??
    (users.length > 0 ? from + users.length - 1 : 0)

  return { users, currentPage, lastPage, perPage, total, from, to }
}

function unwrapUserOne(payload: unknown): PlatformUser | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data != null) return normalizePlatformUser(root.data)
  return normalizePlatformUser(root)
}

function buildListParams(query?: PlatformUsersListQuery): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {}
  if (query?.page != null && Number.isFinite(query.page) && query.page > 0) {
    params.page = Math.floor(query.page)
  }
  const search = query?.search?.trim()
  if (search) params.search = search
  if (query?.role) params.role = query.role
  if (query?.status) params.status = query.status
  if (query?.company_id != null) params.company_id = query.company_id
  if (query?.min_score != null && Number.isFinite(query.min_score)) {
    params.min_score = query.min_score
  }
  if (query?.max_score != null && Number.isFinite(query.max_score)) {
    params.max_score = query.max_score
  }
  if (typeof query?.admin_flagged === 'boolean') {
    params.admin_flagged = query.admin_flagged ? 1 : 0
  }
  if (typeof query?.is_banned === 'boolean') {
    params.is_banned = query.is_banned ? 1 : 0
  }
  return params
}

function buildUpdatePayload(input: UpdatePlatformUserInput): Record<string, string> {
  const payload: Record<string, string> = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone_number: input.phone_number.trim(),
    status: input.status,
  }
  if (input.gender.trim()) payload.gender = input.gender.trim()
  if (input.address.trim()) payload.address = input.address.trim()
  if (input.city.trim()) payload.city = input.city.trim()
  return payload
}

/** Admin-Platform Postman → Users */
export const platformUsersService = {
  async listUsers(query?: PlatformUsersListQuery): Promise<PlatformUsersPage> {
    try {
      const { data } = await api.get<unknown>('/platform/users', {
        params: buildListParams(query),
      })
      return unwrapUserPage(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load users'))
    }
  },

  async getUser(id: number): Promise<PlatformUser> {
    try {
      const { data } = await api.get<unknown>(`/platform/users/${id}`)
      const user = unwrapUserOne(data)
      if (!user) throw new Error('User not found')
      return user
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') throw error
      throw new Error(getApiErrorMessage(error, 'Failed to load user'))
    }
  },

  async getUserReliability(id: number): Promise<UserReliability> {
    try {
      const { data } = await api.get<unknown>(`/platform/users/${id}/reliability`)
      return normalizeUserReliability(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load user reliability'))
    }
  },

  async updateUser(id: number, input: UpdatePlatformUserInput): Promise<PlatformUser> {
    try {
      const { data } = await api.patch<unknown>(`/platform/users/${id}`, buildUpdatePayload(input))
      const updated = unwrapUserOne(data)
      if (updated) return updated
      return {
        id,
        name: input.name.trim(),
        username: null,
        email: input.email.trim(),
        phone_number: input.phone_number.trim(),
        gender: input.gender.trim() || null,
        address: input.address.trim() || null,
        city: input.city.trim() || null,
        status: input.status,
        role: 'passenger',
        roles: [],
        company_id: null,
        company_name: null,
        score: null,
        admin_flagged: false,
        is_banned: false,
        banned_until: null,
        bookings_count: null,
        active_subscriptions_count: null,
        created_at: null,
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update user'))
    }
  },

  async updateUserReliability(
    id: number,
    input: UpdateUserReliabilityInput,
  ): Promise<UserReliability> {
    try {
      const payload: UpdateUserReliabilityInput = {}
      if (typeof input.admin_flagged === 'boolean') payload.admin_flagged = input.admin_flagged
      if (typeof input.clear_ban === 'boolean') payload.clear_ban = input.clear_ban

      const { data } = await api.patch<unknown>(`/platform/users/${id}/reliability`, payload)
      return normalizeUserReliability(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update user reliability'))
    }
  },

  async resetUserReliability(id: number): Promise<UserReliability> {
    try {
      const { data } = await api.patch<unknown>(`/platform/users/${id}/reliability/reset`)
      return normalizeUserReliability(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to reset user reliability'))
    }
  },
}
