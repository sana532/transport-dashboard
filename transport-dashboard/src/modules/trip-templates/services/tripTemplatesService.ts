import { api } from '@/services/api'
import type { CompanyTripTemplate, TripTemplateInput } from '@/modules/trip-templates/types'
import { normalizeCompanyTripTemplate } from '@/modules/trip-templates/utils/mapCompanyTripTemplate'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'
import { filterHiddenRecords, hideThenTry } from '@/shared/utils/hiddenRecords'

function unwrapList(payload: unknown): CompanyTripTemplate[] {
  const items = collectApiListItems(payload)
  if (items.length > 0) {
    return items
      .map(normalizeCompanyTripTemplate)
      .filter((item): item is CompanyTripTemplate => item !== null)
  }

  if (Array.isArray(payload)) {
    return payload
      .map(normalizeCompanyTripTemplate)
      .filter((item): item is CompanyTripTemplate => item !== null)
  }

  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) {
    return root.data
      .map(normalizeCompanyTripTemplate)
      .filter((item): item is CompanyTripTemplate => item !== null)
  }
  const single = normalizeCompanyTripTemplate(root.data ?? root)
  return single ? [single] : []
}

function unwrapOne(payload: unknown): CompanyTripTemplate | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeCompanyTripTemplate(root.data)
  return normalizeCompanyTripTemplate(root)
}

export const tripTemplatesService = {
  async listTemplates(params?: { route_id?: number; is_active?: boolean }): Promise<CompanyTripTemplate[]> {
    try {
      const { data } = await api.get<unknown>('/company/trip-templates', { params })
      return filterHiddenRecords('templates', unwrapList(data), (row) => [row.id])
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load trip schedules'))
    }
  },

  async getTemplate(id: number): Promise<CompanyTripTemplate> {
    try {
      const { data } = await api.get<unknown>(`/company/trip-templates/${id}`)
      const template = unwrapOne(data)
      if (!template) throw new Error('Trip schedule not found')
      return template
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load trip schedule'))
    }
  },

  async createTemplate(input: TripTemplateInput): Promise<CompanyTripTemplate> {
    try {
      const { data } = await api.post<unknown>('/company/trip-templates', input)
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating trip schedule')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create trip schedule'))
    }
  },

  async updateTemplate(id: number, input: TripTemplateInput): Promise<CompanyTripTemplate> {
    try {
      const { data } = await api.patch<unknown>(`/company/trip-templates/${id}`, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating trip schedule')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update trip schedule'))
    }
  },

  async deleteTemplate(id: number): Promise<void> {
    await hideThenTry('templates', [id], async () => {
      await api.delete(`/company/trip-templates/${id}`)
    })
  },
}
