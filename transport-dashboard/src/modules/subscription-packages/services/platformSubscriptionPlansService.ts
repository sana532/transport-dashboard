import { api } from '@/services/api'
import type {
  CompanySubscriptionPlan,
  SubscriptionPlanInput,
} from '@/modules/subscription-packages/types'
import { normalizeCompanySubscriptionPlan } from '@/modules/subscription-packages/utils/mapCompanySubscriptionPlan'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function unwrapList(payload: unknown): CompanySubscriptionPlan[] {
  const items = collectApiListItems(payload)
  if (items.length > 0) {
    return items
      .map(normalizeCompanySubscriptionPlan)
      .filter((item): item is CompanySubscriptionPlan => item !== null)
  }

  if (Array.isArray(payload)) {
    return payload
      .map(normalizeCompanySubscriptionPlan)
      .filter((item): item is CompanySubscriptionPlan => item !== null)
  }

  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) {
    return root.data
      .map(normalizeCompanySubscriptionPlan)
      .filter((item): item is CompanySubscriptionPlan => item !== null)
  }
  const single = normalizeCompanySubscriptionPlan(root.data ?? root)
  return single ? [single] : []
}

function unwrapOne(payload: unknown): CompanySubscriptionPlan | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeCompanySubscriptionPlan(root.data)
  return normalizeCompanySubscriptionPlan(root)
}

/** Platform plans — Admin-Platform Postman → Promotions → Subscription Plans */
export const platformSubscriptionPlansService = {
  async listPlans(): Promise<CompanySubscriptionPlan[]> {
    try {
      const { data } = await api.get<unknown>('/platform/subscription-plans')
      return unwrapList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load platform subscription plans'))
    }
  },

  async getPlan(id: number): Promise<CompanySubscriptionPlan> {
    try {
      const { data } = await api.get<unknown>(`/platform/subscription-plans/${id}`)
      const plan = unwrapOne(data)
      if (!plan) throw new Error('Subscription plan not found')
      return plan
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load subscription plan'))
    }
  },

  async createPlan(input: SubscriptionPlanInput): Promise<CompanySubscriptionPlan> {
    try {
      const { data } = await api.post<unknown>('/platform/subscription-plans', input)
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating plan')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create subscription plan'))
    }
  },

  async updatePlan(id: number, input: SubscriptionPlanInput): Promise<CompanySubscriptionPlan> {
    try {
      const { data } = await api.put<unknown>(`/platform/subscription-plans/${id}`, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating plan')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update subscription plan'))
    }
  },

  async deletePlan(id: number): Promise<void> {
    try {
      await api.delete(`/platform/subscription-plans/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete subscription plan'))
    }
  },
}
