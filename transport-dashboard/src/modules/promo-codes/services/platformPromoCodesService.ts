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

/** Platform-wide promos — live API: /api/platform/promo-codes (Postman still lists /admin/) */
export const platformPromoCodesService = {
  async listPromoCodes(): Promise<CompanyPromoCode[]> {
    try {
      const { data } = await api.get<unknown>('/platform/promo-codes')
      return unwrapList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load platform promo codes'))
    }
  },

  async getPromoCode(id: number): Promise<CompanyPromoCode> {
    try {
      const { data } = await api.get<unknown>(`/platform/promo-codes/${id}`)
      const promo = unwrapOne(data)
      if (!promo) throw new Error('Promo code not found')
      return promo
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load promo code'))
    }
  },

  async createPromoCode(input: PromoCodeInput): Promise<CompanyPromoCode> {
    try {
      const { data } = await api.post<unknown>('/platform/promo-codes', input)
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating promo code')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create promo code'))
    }
  },

  async updatePromoCode(id: number, input: PromoCodeInput): Promise<CompanyPromoCode> {
    try {
      const { data } = await api.patch<unknown>(`/platform/promo-codes/${id}`, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating promo code')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update promo code'))
    }
  },

  async deletePromoCode(id: number): Promise<void> {
    try {
      await api.delete(`/platform/promo-codes/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete promo code'))
    }
  },

  async getPromoCodesManagementData(): Promise<PromoCodesManagementData> {
    const promoCodes = await this.listPromoCodes()
    return {
      promoCodes,
      stats: buildPromoStats(promoCodes),
    }
  },
}
