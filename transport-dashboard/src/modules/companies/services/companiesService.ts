import { api } from '@/services/api'
import type {
  CompaniesListQuery,
  CompanyStatus,
  CreateCompanyInput,
  CreateCompanyResult,
  PlatformCompany,
  UpdateCompanyInput,
} from '@/modules/companies/types'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function appendIfPresent(form: FormData, key: string, value: string | File | null | undefined) {
  if (value === null || value === undefined) return
  if (typeof value === 'string' && !value.trim()) return
  form.append(key, value)
}

function buildCreateCompanyFormData(input: CreateCompanyInput): FormData {
  const { company, manager } = input
  const form = new FormData()

  appendIfPresent(form, 'company[name]', company.name.trim())
  appendIfPresent(form, 'company[email]', company.email.trim())
  appendIfPresent(form, 'company[phone]', company.phone.trim())
  appendIfPresent(form, 'company[address]', company.address.trim())
  appendIfPresent(form, 'company[description]', company.description.trim())
  appendIfPresent(form, 'company[status]', company.status)
  if (company.logo) form.append('company[logo]', company.logo)
  if (company.coverImage) form.append('company[cover_image]', company.coverImage)

  appendIfPresent(form, 'manager[name]', manager.name.trim())
  appendIfPresent(form, 'manager[username]', manager.username.trim())
  appendIfPresent(form, 'manager[phone_number]', manager.phoneNumber.trim())
  appendIfPresent(form, 'manager[email]', manager.email.trim())
  appendIfPresent(form, 'manager[password]', manager.password)
  appendIfPresent(form, 'manager[password_confirmation]', manager.passwordConfirmation)

  return form
}

function pickString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

function pickId(record: Record<string, unknown>): number | null {
  const value = record.id
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

function normalizeStatus(raw: unknown, fallback: CompanyStatus = 'active'): CompanyStatus {
  if (raw === 'active' || raw === 'inactive' || raw === 'suspended') return raw
  return fallback
}

function normalizeCompany(raw: unknown, fallback: Partial<PlatformCompany> = {}): PlatformCompany | null {
  if (!raw || typeof raw !== 'object') {
    if (fallback.id == null) return null
    return {
      id: fallback.id,
      name: fallback.name ?? '—',
      email: fallback.email ?? '—',
      phone: fallback.phone ?? '—',
      address: fallback.address ?? null,
      description: fallback.description ?? null,
      status: fallback.status ?? 'active',
      logo_url: fallback.logo_url ?? null,
      cover_image_url: fallback.cover_image_url ?? null,
      created_at: fallback.created_at,
    }
  }

  const record = raw as Record<string, unknown>
  const nested =
    record.company && typeof record.company === 'object'
      ? (record.company as Record<string, unknown>)
      : record

  const id = pickId(nested) ?? pickId(record) ?? fallback.id ?? null
  if (id == null) return null

  return {
    id,
    name: pickString(nested, 'name') ?? fallback.name ?? '—',
    email: pickString(nested, 'email') ?? fallback.email ?? '—',
    phone: pickString(nested, 'phone') ?? fallback.phone ?? '—',
    address: pickString(nested, 'address') ?? fallback.address ?? null,
    description: pickString(nested, 'description') ?? fallback.description ?? null,
    status: normalizeStatus(nested.status ?? record.status, fallback.status ?? 'active'),
    logo_url: pickString(nested, 'logo_url') ?? pickString(nested, 'logo') ?? fallback.logo_url ?? null,
    cover_image_url:
      pickString(nested, 'cover_image_url') ??
      pickString(nested, 'cover_image') ??
      fallback.cover_image_url ??
      null,
    created_at: pickString(nested, 'created_at') ?? fallback.created_at,
  }
}

function unwrapCompanyList(payload: unknown): PlatformCompany[] {
  const items = collectApiListItems(payload)
  const fromItems = items
    .map((item) => normalizeCompany(item))
    .filter((item): item is PlatformCompany => item !== null)

  if (fromItems.length > 0) return fromItems

  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeCompany(item))
      .filter((item): item is PlatformCompany => item !== null)
  }

  return []
}

function unwrapCompanyOne(payload: unknown): PlatformCompany | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data != null) return normalizeCompany(root.data)
  return normalizeCompany(root)
}

function buildListParams(query?: CompaniesListQuery): Record<string, string> {
  const params: Record<string, string> = {}
  const search = query?.search?.trim()
  if (search) params.search = search

  if (Array.isArray(query?.status) && query.status.length > 0) {
    params.status = query.status.join(',')
  } else if (typeof query?.status === 'string' && query.status) {
    params.status = query.status
  }

  return params
}

function buildUpdatePayload(input: UpdateCompanyInput): Record<string, string> {
  const payload: Record<string, string> = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    status: input.status,
  }
  if (input.address.trim()) payload.address = input.address.trim()
  if (input.description.trim()) payload.description = input.description.trim()
  return payload
}

function parseCreateResponse(data: unknown, input: CreateCompanyInput): PlatformCompany {
  const fromApi = unwrapCompanyOne(data)
  if (fromApi) return fromApi

  return {
    id: Date.now(),
    name: input.company.name,
    email: input.company.email,
    phone: input.company.phone,
    address: input.company.address || null,
    description: input.company.description || null,
    status: input.company.status,
  }
}

/** Admin-Platform Postman → Companies */
export const companiesService = {
  async listCompanies(query?: CompaniesListQuery): Promise<PlatformCompany[]> {
    try {
      const { data } = await api.get<unknown>('/platform/companies', {
        params: buildListParams(query),
      })
      return unwrapCompanyList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load companies'))
    }
  },

  async getCompany(id: number): Promise<PlatformCompany> {
    try {
      const { data } = await api.get<unknown>(`/platform/companies/${id}`)
      const company = unwrapCompanyOne(data)
      if (!company) throw new Error('Company not found')
      return company
    } catch (error) {
      if (error instanceof Error && error.message === 'Company not found') throw error
      throw new Error(getApiErrorMessage(error, 'Failed to load company'))
    }
  },

  async createCompany(input: CreateCompanyInput): Promise<CreateCompanyResult> {
    if (input.manager.password !== input.manager.passwordConfirmation) {
      throw new Error('Manager password confirmation does not match')
    }

    try {
      const { data } = await api.post<unknown>(
        '/platform/companies',
        buildCreateCompanyFormData(input),
      )
      const company = parseCreateResponse(data, input)
      return { company, raw: data }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create company'))
    }
  },

  async updateCompany(id: number, input: UpdateCompanyInput): Promise<PlatformCompany> {
    try {
      const { data } = await api.patch<unknown>(
        `/platform/companies/${id}`,
        buildUpdatePayload(input),
      )
      const updated = unwrapCompanyOne(data)
      if (updated) return updated
      return {
        id,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        address: input.address.trim() || null,
        description: input.description.trim() || null,
        status: input.status,
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update company'))
    }
  },
}
