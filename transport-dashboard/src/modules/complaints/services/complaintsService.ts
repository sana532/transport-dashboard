import { api } from '@/services/api'
import type { ComplaintCategory, ComplaintManagementRow, ComplaintStatusUpdateInput } from '@/modules/complaints/types'
import {
  normalizeCompanyComplaint,
  normalizeComplaintCategory,
} from '@/modules/complaints/utils/mapCompanyComplaint'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

export type ComplaintsListQuery = {
  status?: string
  complaint_category_id?: number
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

function buildListParams(query?: ComplaintsListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (query?.status) params.status = query.status
  if (query?.complaint_category_id != null) {
    params.complaint_category_id = query.complaint_category_id
  }
  return params
}

export const complaintsService = {
  async listComplaints(
    locale: string,
    query?: ComplaintsListQuery,
  ): Promise<ComplaintManagementRow[]> {
    try {
      const { data } = await api.get<unknown>('/company/complaints', {
        params: buildListParams(query),
      })
      return unwrapComplaintList(data, locale)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load complaints'))
    }
  },

  async getComplaint(id: number, locale: string): Promise<ComplaintManagementRow> {
    try {
      const { data } = await api.get<unknown>(`/company/complaints/${id}`)
      const complaint = unwrapComplaintOne(data, locale)
      if (!complaint) throw new Error('Complaint not found')
      return complaint
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load complaint'))
    }
  },

  async listComplaintCategories(locale: string): Promise<ComplaintCategory[]> {
    try {
      const { data } = await api.get<unknown>('/company/complaint-categories')
      return unwrapCategoryList(data, locale)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load complaint categories'))
    }
  },

  async updateComplaintStatus(
    id: number,
    input: ComplaintStatusUpdateInput,
    locale: string,
  ): Promise<ComplaintManagementRow> {
    try {
      const payload: ComplaintStatusUpdateInput = {
        status: input.status,
        ...(input.admin_notes?.trim() ? { admin_notes: input.admin_notes.trim() } : {}),
      }
      const { data } = await api.patch<unknown>(`/company/complaints/${id}/status`, payload)
      const updated = unwrapComplaintOne(data, locale)
      if (!updated) throw new Error('Invalid response when updating complaint status')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update complaint status'))
    }
  },
}
