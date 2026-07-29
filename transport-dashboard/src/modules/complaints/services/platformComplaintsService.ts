import { api } from '@/services/api'
import type {
  ComplaintCategory,
  ComplaintManagementRow,
  ComplaintsManagementData,
} from '@/modules/complaints/types'
import {
  normalizeCompanyComplaint,
  normalizeComplaintCategory,
} from '@/modules/complaints/utils/mapCompanyComplaint'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

export type PlatformComplaintsListQuery = {
  status?: string
  complaint_category_id?: number
  company_id?: number
}

export type PlatformComplaintCategoryInput = {
  name_en: string
  name_ar: string
  icon_url?: string | null
  visibility_scope?: 'platform_only' | 'company_and_platform' | string
  is_active?: boolean
}

function unwrapComplaintList(payload: unknown, locale: string): ComplaintManagementRow[] {
  const items = collectApiListItems(payload)
  if (items.length > 0) {
    return items
      .map((item) => normalizeCompanyComplaint(item, locale))
      .filter((item): item is ComplaintManagementRow => item !== null)
  }

  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeCompanyComplaint(item, locale))
      .filter((item): item is ComplaintManagementRow => item !== null)
  }

  return []
}

function unwrapComplaintOne(payload: unknown, locale: string): ComplaintManagementRow | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeCompanyComplaint(root.data, locale)
  return normalizeCompanyComplaint(root, locale)
}

function unwrapCategoryList(payload: unknown, locale: string): ComplaintCategory[] {
  const items = collectApiListItems(payload)
  const fromItems = items
    .map((item) => normalizeComplaintCategory(item, locale))
    .filter((item): item is ComplaintCategory => item !== null)

  if (fromItems.length > 0) return fromItems

  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeComplaintCategory(item, locale))
      .filter((item): item is ComplaintCategory => item !== null)
  }

  return []
}

function unwrapCategoryOne(payload: unknown, locale: string): ComplaintCategory | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeComplaintCategory(root.data, locale)
  return normalizeComplaintCategory(root, locale)
}

function buildListParams(query?: PlatformComplaintsListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (query?.status) params.status = query.status
  if (query?.complaint_category_id != null) {
    params.complaint_category_id = query.complaint_category_id
  }
  if (query?.company_id != null) params.company_id = query.company_id
  return params
}

/** Admin-Platform Postman → Complaints + Complaint Categories */
export const platformComplaintsService = {
  async listComplaints(
    locale: string,
    query?: PlatformComplaintsListQuery,
  ): Promise<ComplaintManagementRow[]> {
    try {
      const { data } = await api.get<unknown>('/platform/complaints', {
        params: buildListParams(query),
      })
      return unwrapComplaintList(data, locale)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load platform complaints'))
    }
  },

  async getComplaint(id: number, locale: string): Promise<ComplaintManagementRow> {
    try {
      const { data } = await api.get<unknown>(`/platform/complaints/${id}`)
      const complaint = unwrapComplaintOne(data, locale)
      if (!complaint) throw new Error('Complaint not found')
      return complaint
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load complaint'))
    }
  },

  async listCategories(locale: string): Promise<ComplaintCategory[]> {
    try {
      const { data } = await api.get<unknown>('/platform/complaint-categories')
      return unwrapCategoryList(data, locale)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load complaint categories'))
    }
  },

  async createCategory(
    input: PlatformComplaintCategoryInput,
    locale: string,
  ): Promise<ComplaintCategory> {
    try {
      const { data } = await api.post<unknown>('/platform/complaint-categories', input)
      const created = unwrapCategoryOne(data, locale)
      if (!created) throw new Error('Invalid response when creating category')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create complaint category'))
    }
  },

  async updateCategory(
    id: number,
    input: PlatformComplaintCategoryInput,
    locale: string,
  ): Promise<ComplaintCategory> {
    try {
      const { data } = await api.patch<unknown>(`/platform/complaint-categories/${id}`, input)
      const updated = unwrapCategoryOne(data, locale)
      if (!updated) throw new Error('Invalid response when updating category')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update complaint category'))
    }
  },

  async deleteCategory(id: number): Promise<void> {
    try {
      await api.delete(`/platform/complaint-categories/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete complaint category'))
    }
  },

  async getComplaintsManagementData(
    locale: string,
    query?: PlatformComplaintsListQuery,
  ): Promise<ComplaintsManagementData> {
    const [rows, categories] = await Promise.all([
      this.listComplaints(locale, query),
      this.listCategories(locale).catch(() => [] as ComplaintCategory[]),
    ])
    return {
      rows,
      categories,
      totalResults: rows.length,
      page: 1,
      pageSize: 10,
    }
  },
}
