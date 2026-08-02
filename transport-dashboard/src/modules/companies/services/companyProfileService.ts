import { api } from '@/services/api'
import type { CompanyStatus, PlatformCompany } from '@/modules/companies/types'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl'

export type CompanyProfile = {
  id: number
  name: string
  email: string
  phone: string
  address: string | null
  description: string | null
  status: CompanyStatus
  logoUrl: string | null
  coverImageUrl: string | null
}

export type UpdateCompanyProfileInput = {
  name: string
  coverImage?: File | null
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function pickId(record: Record<string, unknown>): number | null {
  const value = record.id
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

function normalizeStatus(raw: unknown): CompanyStatus {
  if (raw === 'active' || raw === 'inactive' || raw === 'suspended') return raw
  return 'active'
}

function mediaUrl(raw: string | undefined): string | null {
  return resolveMediaUrl(raw) ?? null
}

export function normalizeCompanyProfile(raw: unknown): CompanyProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const root = raw as Record<string, unknown>
  const nested =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root.company && typeof root.company === 'object'
        ? (root.company as Record<string, unknown>)
        : root

  const id = pickId(nested) ?? pickId(root)
  if (id == null) return null

  const coverFromMedia = (() => {
    const media = nested.media ?? nested.cover ?? nested.covers
    if (!Array.isArray(media) || media.length === 0) return undefined
    const first = media[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object') {
      return pickString(first as Record<string, unknown>, 'url', 'original_url', 'path', 'src')
    }
    return undefined
  })()

  return {
    id,
    name: pickString(nested, 'name') ?? '—',
    email: pickString(nested, 'email') ?? '—',
    phone: pickString(nested, 'phone') ?? '—',
    address: pickString(nested, 'address') ?? null,
    description: pickString(nested, 'description') ?? null,
    status: normalizeStatus(nested.status),
    logoUrl: mediaUrl(pickString(nested, 'logo_url', 'logo')),
    coverImageUrl: mediaUrl(
      pickString(nested, 'cover_image_url', 'cover_image', 'cover') ?? coverFromMedia,
    ),
  }
}

function toPlatformShape(profile: CompanyProfile): PlatformCompany {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    description: profile.description,
    status: profile.status,
    logo_url: profile.logoUrl,
    cover_image_url: profile.coverImageUrl,
  }
}

/** Company Postman → Profile (`GET/PATCH /company/profile`) */
export const companyProfileService = {
  async getProfile(): Promise<CompanyProfile> {
    try {
      const { data } = await api.get<unknown>('/company/profile')
      const profile = normalizeCompanyProfile(data)
      if (!profile) throw new Error('Company profile not found')
      return profile
    } catch (error) {
      if (error instanceof Error && error.message === 'Company profile not found') throw error
      throw new Error(getApiErrorMessage(error, 'Failed to load company profile'))
    }
  },

  async updateProfile(input: UpdateCompanyProfileInput): Promise<CompanyProfile> {
    const form = new FormData()
    form.append('name', input.name.trim())
    if (input.coverImage) {
      form.append('cover_image', input.coverImage)
    }

    try {
      // Multipart + real PATCH is unreliable on Laravel/PHP — same as vehicles/drivers.
      form.append('_method', 'PATCH')
      await api.post<unknown>('/company/profile', form)
      // Reload so cover_image_url reflects the new file
      return companyProfileService.getProfile()
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update company profile'))
    }
  },

  /** Helper when admin-shaped company objects are needed */
  asPlatformCompany(profile: CompanyProfile): PlatformCompany {
    return toPlatformShape(profile)
  },
}
