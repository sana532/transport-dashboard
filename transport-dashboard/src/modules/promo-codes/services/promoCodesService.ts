import { api } from '@/services/api'
import type { CompanyPromoCode, PromoCodeInput, PromoCodesManagementData } from '@/modules/promo-codes/types'
import { buildPromoStats } from '@/modules/promo-codes/utils/buildPromoStats'
import { normalizeCompanyPromoCode } from '@/modules/promo-codes/utils/mapCompanyPromoCode'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function unwrapList(payload: unknown): CompanyPromoCode[] {
  const items = collectApiListItems(payload)
  if (items.length > 0) {
    return items
      .map(normalizeCompanyPromoCode)
      .filter((item): item is CompanyPromoCode => item !== null)
  }

  if (Array.isArray(payload)) {
    return payload
      .map(normalizeCompanyPromoCode)
      .filter((item): item is CompanyPromoCode => item !== null)
  }

  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) {
    return root.data
      .map(normalizeCompanyPromoCode)
      .filter((item): item is CompanyPromoCode => item !== null)
  }
  const single = normalizeCompanyPromoCode(root.data ?? root)
  return single ? [single] : []
}

function unwrapOne(payload: unknown): CompanyPromoCode | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeCompanyPromoCode(root.data)
  return normalizeCompanyPromoCode(root)
}

export type CompanyPromoCodesPage = {
  promoCodes: CompanyPromoCode[]
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

function readPromoCodesPage(
  payload: unknown,
  fallbackPage: number,
  fallbackPerPage: number,
): CompanyPromoCodesPage {
  const promoCodes = unwrapList(payload)
  const root = asRecord(payload)
  const meta = asRecord(root?.meta) ?? root
  const counts = asRecord(root?.counts) ?? asRecord(meta?.counts)

  const currentPage = (meta ? pickMetaNumber(meta, 'current_page') : null) ?? fallbackPage
  const perPage = (meta ? pickMetaNumber(meta, 'per_page') : null) ?? fallbackPerPage
  const total = (meta ? pickMetaNumber(meta, 'total') : null) ?? promoCodes.length
  const lastPage =
    (meta ? pickMetaNumber(meta, 'last_page') : null) ??
    Math.max(1, perPage > 0 ? Math.ceil(total / perPage) : 1)
  const from =
    (meta ? pickMetaNumber(meta, 'from') : null) ??
    (promoCodes.length > 0 ? (currentPage - 1) * perPage + 1 : 0)
  const to =
    (meta ? pickMetaNumber(meta, 'to') : null) ??
    (promoCodes.length > 0 ? from + promoCodes.length - 1 : 0)

  return { promoCodes, currentPage, lastPage, perPage, total, from, to, counts }
}

export const promoCodesService = {
  async listPromoCodesPage(options?: { page?: number; perPage?: number }): Promise<CompanyPromoCodesPage> {
    const page = Math.max(1, Math.floor(options?.page ?? 1))
    const perPage = Math.min(50, Math.max(1, Math.floor(options?.perPage ?? 15)))

    try {
      const { data } = await api.get<unknown>('/company/promo-codes', {
        params: { page, per_page: perPage },
      })
      return readPromoCodesPage(data, page, perPage)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load promo codes'))
    }
  },

  async listPromoCodes(): Promise<CompanyPromoCode[]> {
    try {
      const first = await this.listPromoCodesPage({ page: 1, perPage: 15 })
      if (first.lastPage <= 1) return first.promoCodes

      const remainingPages = Array.from(
        { length: first.lastPage - 1 },
        (_, index) => index + 2,
      )
      const rest = await Promise.all(
        remainingPages.map((page) => this.listPromoCodesPage({ page, perPage: 15 })),
      )
      return first.promoCodes.concat(...rest.map((item) => item.promoCodes))
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load promo codes'))
    }
  },

  async getPromoCode(id: number): Promise<CompanyPromoCode> {
    try {
      const { data } = await api.get<unknown>(`/company/promo-codes/${id}`)
      const promo = unwrapOne(data)
      if (!promo) throw new Error('Promo code not found')
      return promo
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load promo code'))
    }
  },

  async createPromoCode(input: PromoCodeInput): Promise<CompanyPromoCode> {
    try {
      const { data } = await api.post<unknown>('/company/promo-codes', input)
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating promo code')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create promo code'))
    }
  },

  async updatePromoCode(id: number, input: PromoCodeInput): Promise<CompanyPromoCode> {
    try {
      const { data } = await api.patch<unknown>(`/company/promo-codes/${id}`, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating promo code')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update promo code'))
    }
  },

  async deletePromoCode(id: number): Promise<void> {
    try {
      await api.delete(`/company/promo-codes/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete promo code'))
    }
  },

  async getPromoCodesManagementData(page = 1): Promise<PromoCodesManagementData> {
    const result = await this.listPromoCodesPage({ page, perPage: 15 })
    return {
      promoCodes: result.promoCodes,
      stats: buildPromoStats(result.promoCodes, result.counts),
      pagination: {
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        perPage: result.perPage,
        total: result.total,
        from: result.from,
        to: result.to,
      },
    }
  },
}
