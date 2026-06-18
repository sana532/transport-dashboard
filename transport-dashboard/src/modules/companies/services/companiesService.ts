import { api } from '@/services/api'
import type {
  CreateCompanyInput,
  CreateCompanyResult,
  PlatformCompany,
} from '@/modules/companies/types'

const RECENT_STORAGE_KEY = 'admin_recent_companies'

type ApiValidationErrors = Record<string, string[]>

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return fallback
  }

  const response = (error as { response?: { status?: number; data?: { message?: string; errors?: ApiValidationErrors } } })
    .response

  if (response?.status === 401) {
    return 'Session expired or not signed in. Sign out, then log in again as a platform admin.'
  }

  const data = response?.data

  if (typeof data?.message === 'string' && data.message.trim()) {
    const message = data.message.trim()
    if (message.toLowerCase() === 'unauthenticated') {
      return 'Session expired or not signed in. Sign out, then log in again as a platform admin.'
    }
    return message
  }

  if (data?.errors) {
    for (const messages of Object.values(data.errors)) {
      if (Array.isArray(messages) && messages[0]) return messages[0]
    }
  }

  return fallback
}

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

function normalizeCompany(raw: unknown, fallback: Partial<PlatformCompany>): PlatformCompany {
  const record =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}

  const nested =
    record.company && typeof record.company === 'object'
      ? (record.company as Record<string, unknown>)
      : record

  const id =
    typeof nested.id === 'number'
      ? nested.id
      : typeof record.id === 'number'
        ? record.id
        : fallback.id ?? Date.now()

  return {
    id,
    name: pickString(nested, 'name') ?? fallback.name ?? '—',
    email: pickString(nested, 'email') ?? fallback.email ?? '—',
    phone: pickString(nested, 'phone') ?? fallback.phone ?? '—',
    address: pickString(nested, 'address') ?? fallback.address ?? null,
    description: pickString(nested, 'description') ?? fallback.description ?? null,
    status:
      nested.status === 'inactive' || nested.status === 'active'
        ? nested.status
        : (fallback.status ?? 'active'),
    logo_url: pickString(nested, 'logo_url') ?? pickString(nested, 'logo') ?? null,
    cover_image_url:
      pickString(nested, 'cover_image_url') ?? pickString(nested, 'cover_image') ?? null,
    created_at: pickString(nested, 'created_at') ?? new Date().toISOString(),
  }
}

function parseCreateResponse(
  data: unknown,
  input: CreateCompanyInput,
): PlatformCompany {
  if (data && typeof data === 'object') {
    const root = data as Record<string, unknown>
    if (root.data && typeof root.data === 'object') {
      return normalizeCompany(root.data, {
        name: input.company.name,
        email: input.company.email,
        phone: input.company.phone,
        address: input.company.address,
        description: input.company.description,
        status: input.company.status,
      })
    }
    return normalizeCompany(root, {
      name: input.company.name,
      email: input.company.email,
      phone: input.company.phone,
      address: input.company.address,
      description: input.company.description,
      status: input.company.status,
    })
  }

  return normalizeCompany(null, {
    name: input.company.name,
    email: input.company.email,
    phone: input.company.phone,
    address: input.company.address,
    description: input.company.description,
    status: input.company.status,
  })
}

export const companiesService = {
  readRecentCompanies(): PlatformCompany[] {
    try {
      const raw = sessionStorage.getItem(RECENT_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed.filter(
        (item): item is PlatformCompany =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as PlatformCompany).id === 'number' &&
          typeof (item as PlatformCompany).name === 'string',
      )
    } catch {
      return []
    }
  },

  saveRecentCompany(company: PlatformCompany): PlatformCompany[] {
    const existing = companiesService.readRecentCompanies()
    const next = [company, ...existing.filter((c) => c.id !== company.id)].slice(0, 50)
    sessionStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next))
    return next
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
      const recent = companiesService.saveRecentCompany(company)
      return { company, raw: data ?? { recentCount: recent.length } }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create company'))
    }
  },
}
