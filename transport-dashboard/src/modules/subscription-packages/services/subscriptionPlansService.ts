import { api } from '@/services/api'
import type {
  CompanySubscriptionPlan,
  PackageSubscriberRow,
  SubscriptionPlanInput,
} from '@/modules/subscription-packages/types'
import { normalizeCompanySubscriptionPlan } from '@/modules/subscription-packages/utils/mapCompanySubscriptionPlan'
import { normalizeCompanySubscriptionSubscriber } from '@/modules/subscription-packages/utils/mapCompanySubscriptionSubscriber'
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

export type CompanySubscriptionPlansPage = {
  plans: CompanySubscriptionPlan[]
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

function readPlansPage(
  payload: unknown,
  fallbackPage: number,
  fallbackPerPage: number,
): CompanySubscriptionPlansPage {
  const plans = unwrapList(payload)
  const root = asRecord(payload)
  const meta = asRecord(root?.meta) ?? root
  const counts = asRecord(root?.counts) ?? asRecord(meta?.counts)

  const currentPage = (meta ? pickMetaNumber(meta, 'current_page') : null) ?? fallbackPage
  const perPage = (meta ? pickMetaNumber(meta, 'per_page') : null) ?? fallbackPerPage
  const total = (meta ? pickMetaNumber(meta, 'total') : null) ?? plans.length
  const lastPage =
    (meta ? pickMetaNumber(meta, 'last_page') : null) ??
    Math.max(1, perPage > 0 ? Math.ceil(total / perPage) : 1)
  const from =
    (meta ? pickMetaNumber(meta, 'from') : null) ??
    (plans.length > 0 ? (currentPage - 1) * perPage + 1 : 0)
  const to =
    (meta ? pickMetaNumber(meta, 'to') : null) ??
    (plans.length > 0 ? from + plans.length - 1 : 0)

  return { plans, currentPage, lastPage, perPage, total, from, to, counts }
}

export const subscriptionPlansService = {
  async listPlansPage(options?: { page?: number; perPage?: number }): Promise<CompanySubscriptionPlansPage> {
    const page = Math.max(1, Math.floor(options?.page ?? 1))
    const perPage = Math.min(50, Math.max(1, Math.floor(options?.perPage ?? 15)))

    try {
      const { data } = await api.get<unknown>('/company/subscription-plans', {
        params: { page, per_page: perPage },
      })
      return readPlansPage(data, page, perPage)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load subscription plans'))
    }
  },

  async listPlans(): Promise<CompanySubscriptionPlan[]> {
    try {
      const first = await this.listPlansPage({ page: 1, perPage: 15 })
      if (first.lastPage <= 1) return first.plans

      const remainingPages = Array.from(
        { length: first.lastPage - 1 },
        (_, index) => index + 2,
      )
      const rest = await Promise.all(
        remainingPages.map((page) => this.listPlansPage({ page, perPage: 15 })),
      )
      return first.plans.concat(...rest.map((item) => item.plans))
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load subscription plans'))
    }
  },

  async getPlan(id: number): Promise<CompanySubscriptionPlan> {
    try {
      const { data } = await api.get<unknown>(`/company/subscription-plans/${id}`)
      const plan = unwrapOne(data)
      if (!plan) throw new Error('Subscription plan not found')
      return plan
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load subscription plan'))
    }
  },

  async createPlan(input: SubscriptionPlanInput): Promise<CompanySubscriptionPlan> {
    try {
      const { data } = await api.post<unknown>('/company/subscription-plans', input)
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating plan')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create subscription plan'))
    }
  },

  async updatePlan(id: number, input: SubscriptionPlanInput): Promise<CompanySubscriptionPlan> {
    try {
      const { data } = await api.put<unknown>(`/company/subscription-plans/${id}`, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating plan')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update subscription plan'))
    }
  },

  async deletePlan(id: number): Promise<void> {
    try {
      await api.delete(`/company/subscription-plans/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete subscription plan'))
    }
  },

  async listPlanSubscribers(planId: number, locale: string): Promise<PackageSubscriberRow[]> {
    try {
      const { data } = await api.get<unknown>(`/company/subscription-plans/${planId}/subscribers`)
      const items = collectApiListItems(data)
      const rows = items
        .map((item) => normalizeCompanySubscriptionSubscriber(item, locale))
        .filter((item): item is PackageSubscriberRow => item !== null)

      if (rows.length > 0) return rows

      if (Array.isArray(data)) {
        return data
          .map((item) => normalizeCompanySubscriptionSubscriber(item, locale))
          .filter((item): item is PackageSubscriberRow => item !== null)
      }

      return []
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load plan subscribers'))
    }
  },
}
