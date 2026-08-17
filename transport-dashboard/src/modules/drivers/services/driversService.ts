import { api } from '@/services/api'
import type {
  CompanyDriver,
  DriverCreateInput,
  DriverUpdateInput,
} from '@/modules/drivers/types'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'
import { firstMediaUrl } from '@/shared/utils/pickMediaUrls'

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function pickOnTripFlag(record: Record<string, unknown>): boolean {
  if (
    record.in_trip === true ||
    record.is_on_trip === true ||
    record.on_trip === true ||
    record.in_trip === 1 ||
    record.is_on_trip === 1 ||
    record.on_trip === 1 ||
    record.in_trip === '1' ||
    record.in_trip === 'true'
  ) {
    return true
  }
  const status = typeof record.status === 'string' ? record.status.toLowerCase().replace(/-/g, '_') : ''
  return status === 'in_trip' || status === 'on_trip'
}

function hasDriverProfileFields(record: Record<string, unknown>): boolean {
  return (
    record.license_number !== undefined ||
    record.years_of_experience !== undefined ||
    record.total_trips !== undefined ||
    record.total_rides !== undefined ||
    typeof record.license_expiration_date === 'string' ||
    typeof record.driving_since_date === 'string' ||
    typeof record.license_status === 'string'
  )
}

function resolveDriverUserId(record: Record<string, unknown>): number {
  const profile = record.driver_profile
  if (profile && typeof profile === 'object') {
    const profileUserId = Number((profile as Record<string, unknown>).user_id)
    if (Number.isFinite(profileUserId) && profileUserId > 0) return profileUserId
  }

  const explicitUserId = Number(record.user_id)
  if (Number.isFinite(explicitUserId) && explicitUserId > 0) return explicitUserId

  const rootId = Number(record.id)
  // User-shaped rows from GET /company/drivers/{id} — top-level id is the account id.
  if (
    Number.isFinite(rootId) &&
    rootId > 0 &&
    (Array.isArray(record.roles) || typeof record.username === 'string' || typeof record.email === 'string')
  ) {
    return rootId
  }

  return rootId
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
      (hasDriverProfileFields(raw) ? raw : null)

    return {
      ...nestedUser,
      id: resolveDriverUserId({
        ...nestedUser,
        user_id: nestedUser.id ?? raw.user_id,
        driver_profile: profile,
      }),
      in_trip: pickOnTripFlag(raw) || pickOnTripFlag(nestedUser),
      driver_profile: profile,
    }
  }

  const userId = Number(raw.user_id)

  // List rows keyed by driver_profile id — PATCH/DELETE must use user_id.
  if (Number.isFinite(userId) && userId > 0) {
    const profile =
      raw.driver_profile && typeof raw.driver_profile === 'object'
        ? (raw.driver_profile as Record<string, unknown>)
        : hasDriverProfileFields(raw) || raw.status !== undefined
          ? raw
          : null

    return {
      id: userId,
      name: pickString(raw, 'name', 'full_name'),
      phone_number: pickString(raw, 'phone_number', 'phone'),
      username: pickString(raw, 'username'),
      gender: raw.gender,
      address: raw.address,
      city: raw.city,
      email: raw.email ?? null,
      company_id: raw.company_id,
      roles: raw.roles,
      in_trip: pickOnTripFlag(raw),
      driver_profile: profile,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    }
  }

  if (
    raw.driver_profile &&
    typeof raw.driver_profile === 'object'
  ) {
    const profile = raw.driver_profile as Record<string, unknown>
    return {
      ...raw,
      id: resolveDriverUserId(raw),
      driver_profile: profile,
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
    license_expiration_date:
      typeof record.license_expiration_date === 'string'
        ? record.license_expiration_date
        : null,
    license_status:
      typeof record.license_status === 'string' ? record.license_status : null,
    years_of_experience:
      typeof record.years_of_experience === 'number'
        ? record.years_of_experience
        : Number(record.years_of_experience) || null,
    driving_since_date:
      typeof record.driving_since_date === 'string' ? record.driving_since_date : null,
    rating: typeof record.rating === 'string' ? record.rating : String(record.rating ?? '0'),
    rating_count: Number(record.rating_count) || 0,
    total_rides: Number(record.total_rides) || Number(record.total_trips) || 0,
    total_trips: Number(record.total_trips) || Number(record.total_rides) || 0,
    salary: typeof record.salary === 'string' ? record.salary : String(record.salary ?? '0'),
    status: typeof record.status === 'string' ? record.status : 'active',
    avatar:
      firstMediaUrl(
        record.avatar,
        record.media,
        record.images,
        record,
        { parentId: id, collection: 'avatar' },
      ) ?? null,
    driver_license:
      firstMediaUrl(record.driver_license, record, { parentId: id, collection: 'photos' }) ??
      (typeof record.driver_license === 'string' ? record.driver_license : null),
    created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : undefined,
  }
}

export function normalizeCompanyDriver(raw: unknown): CompanyDriver | null {
  if (!raw || typeof raw !== 'object') return null
  const flattened = flattenDriverRaw(raw as Record<string, unknown>)
  const record = flattened
  const id = resolveDriverUserId(record)
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
    in_trip:
      pickOnTripFlag(record) ||
      (record.driver_profile && typeof record.driver_profile === 'object'
        ? pickOnTripFlag(record.driver_profile as Record<string, unknown>)
        : false),
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

export type CompanyDriversPage = {
  drivers: CompanyDriver[]
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number
  to: number
  counts: Record<string, unknown> | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function pickMetaNumber(meta: Record<string, unknown>, key: string): number | null {
  const value = Number(meta[key])
  return Number.isFinite(value) ? value : null
}

function readDriversPage(
  payload: unknown,
  fallbackPage: number,
  fallbackPerPage: number,
): CompanyDriversPage {
  const drivers = unwrapList(payload)
  const root = asRecord(payload)
  const meta = asRecord(root?.meta) ?? root
  const counts = asRecord(root?.counts) ?? asRecord(meta?.counts)

  const currentPage = (meta ? pickMetaNumber(meta, 'current_page') : null) ?? fallbackPage
  const perPage = (meta ? pickMetaNumber(meta, 'per_page') : null) ?? fallbackPerPage
  const total = (meta ? pickMetaNumber(meta, 'total') : null) ?? drivers.length
  const lastPage =
    (meta ? pickMetaNumber(meta, 'last_page') : null) ??
    Math.max(1, perPage > 0 ? Math.ceil(total / perPage) : 1)
  const from =
    (meta ? pickMetaNumber(meta, 'from') : null) ??
    (drivers.length > 0 ? (currentPage - 1) * perPage + 1 : 0)
  const to =
    (meta ? pickMetaNumber(meta, 'to') : null) ??
    (drivers.length > 0 ? from + drivers.length - 1 : 0)

  return { drivers, currentPage, lastPage, perPage, total, from, to, counts }
}

/** Optional flat fields — Postman uses root-level keys, same as create. */
function appendDriverOptionalFields(
  target: FormData | Record<string, unknown>,
  input: { status?: string; avatar?: File },
): void {
  if (input.status?.trim()) {
    const status = input.status.trim()
    // on_trip is set by the backend when a driver is assigned to a trip.
    if (status === 'on_trip') return

    if (target instanceof FormData) {
      target.append('status', status)
    } else {
      target.status = status
    }
  }

  if (input.avatar && target instanceof FormData) {
    target.append('avatar', input.avatar)
  }
}

/** Fields accepted on driver update (no password). */
function appendDriverUpdateFields(form: FormData, input: DriverUpdateInput): void {
  form.append('name', input.name.trim())
  if (input.phone_number?.trim()) {
    form.append('phone_number', input.phone_number.trim())
  }

  if (input.license_number?.trim()) {
    form.append('license_number', input.license_number.trim())
  }
  if (input.license_expiration_date?.trim()) {
    form.append('license_expiration_date', input.license_expiration_date.trim())
  }
  appendDriverOptionalFields(form, input)
}

/** Fields for creating a driver account. */
function appendDriverCreateFields(form: FormData, input: DriverCreateInput): void {
  appendDriverUpdateFields(form, input)
  if (input.years_of_experience != null && Number.isFinite(input.years_of_experience)) {
    form.append('years_of_experience', String(input.years_of_experience))
  }
  form.append('password', input.password)
  form.append('password_confirmation', input.password_confirmation)
}

function buildDriverCreateFormData(input: DriverCreateInput): FormData {
  const form = new FormData()
  appendDriverCreateFields(form, input)
  return form
}

function buildDriverUpdateFormData(input: DriverUpdateInput): FormData {
  const form = new FormData()
  appendDriverUpdateFields(form, input)
  return form
}

function buildDriverUpdateBody(input: DriverUpdateInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.name.trim(),
  }

  if (input.phone_number?.trim()) {
    body.phone_number = input.phone_number.trim()
  }

  if (input.license_number?.trim()) body.license_number = input.license_number.trim()
  if (input.license_expiration_date?.trim()) {
    body.license_expiration_date = input.license_expiration_date.trim()
  }
  appendDriverOptionalFields(body, input)

  return body
}

function buildDriverCreateBody(input: DriverCreateInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.name.trim(),
    phone_number: input.phone_number.trim(),
    password: input.password,
    password_confirmation: input.password_confirmation,
  }

  if (input.license_number?.trim()) body.license_number = input.license_number.trim()
  if (input.license_expiration_date?.trim()) {
    body.license_expiration_date = input.license_expiration_date.trim()
  }
  if (input.years_of_experience != null && Number.isFinite(input.years_of_experience)) {
    body.years_of_experience = input.years_of_experience
  }
  appendDriverOptionalFields(body, input)

  return body
}

async function submitDriverUpdate(id: number, input: DriverUpdateInput): Promise<unknown> {
  if (input.avatar) {
    const form = buildDriverUpdateFormData(input)
    form.append('_method', 'PATCH')
    const { data } = await api.post<unknown>(`/company/drivers/${id}`, form)
    return data
  }

  const { data } = await api.patch<unknown>(`/company/drivers/${id}`, buildDriverUpdateBody(input))
  return data
}

async function resolveDriverApiId(id: number, profileId?: number): Promise<number | null> {
  const candidates = [id, profileId].filter(
    (value): value is number => value != null && Number.isFinite(value) && value > 0,
  )
  const seen = new Set<number>()

  for (const fetchId of candidates) {
    if (seen.has(fetchId)) continue
    seen.add(fetchId)

    try {
      const { data } = await api.get<unknown>(`/company/drivers/${fetchId}`)
      const row = unwrapOne(data)
      if (row) return row.id
    } catch {
      // try next candidate
    }
  }

  return null
}

function readHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined
  const status = (error as { response?: { status?: number } }).response?.status
  return typeof status === 'number' ? status : undefined
}

export const driversService = {
  async listDriversPage(options?: { page?: number; perPage?: number }): Promise<CompanyDriversPage> {
    const page = Math.max(1, Math.floor(options?.page ?? 1))
    const perPage = Math.min(50, Math.max(1, Math.floor(options?.perPage ?? 15)))

    try {
      const { data } = await api.get<unknown>('/company/drivers', {
        params: { page, per_page: perPage },
      })
      return readDriversPage(data, page, perPage)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load drivers'))
    }
  },

  async listDrivers(): Promise<CompanyDriver[]> {
    try {
      const first = await this.listDriversPage({ page: 1, perPage: 15 })
      if (first.lastPage <= 1) return first.drivers

      const remainingPages = Array.from(
        { length: first.lastPage - 1 },
        (_, index) => index + 2,
      )
      const rest = await Promise.all(
        remainingPages.map((page) => this.listDriversPage({ page, perPage: 15 })),
      )
      return first.drivers.concat(...rest.map((item) => item.drivers))
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load drivers'))
    }
  },

  async getDriver(id: number): Promise<CompanyDriver | null> {
    try {
      const { data } = await api.get<unknown>(`/company/drivers/${id}`)
      return unwrapOne(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load driver'))
    }
  },

  async createDriver(input: DriverCreateInput): Promise<CompanyDriver> {
    try {
      const { data } = input.avatar
        ? await api.post<unknown>('/company/drivers', buildDriverCreateFormData(input))
        : await api.post<unknown>('/company/drivers', buildDriverCreateBody(input))
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating driver')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create driver'))
    }
  },

  async updateDriver(
    id: number,
    input: DriverUpdateInput,
    options?: { profileId?: number },
  ): Promise<CompanyDriver> {
    const tryUpdate = async (targetId: number) => {
      const data = await submitDriverUpdate(targetId, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating driver')
      return updated
    }

    try {
      return await tryUpdate(id)
    } catch (error) {
      const status = readHttpStatus(error)
      const fallbackId = options?.profileId

      if (status === 404 || status === 403) {
        if (fallbackId != null && fallbackId > 0 && fallbackId !== id) {
          try {
            return await tryUpdate(fallbackId)
          } catch (retryError) {
            if (readHttpStatus(retryError) !== 404 && readHttpStatus(retryError) !== 403) {
              throw new Error(getApiErrorMessage(retryError, 'Failed to update driver'))
            }
          }
        }

        const resolvedId = await resolveDriverApiId(id, fallbackId)
        if (resolvedId != null && resolvedId !== id) {
          try {
            return await tryUpdate(resolvedId)
          } catch (retryError) {
            throw new Error(getApiErrorMessage(retryError, 'Failed to update driver'))
          }
        }
      }

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
