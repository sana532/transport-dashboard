import { api } from '@/services/api'
import type {
  CompanyTrip,
  TripCloneInput,
  TripMutationInput,
  TripStatusUpdateInput,
} from '@/modules/trips/types/companyTrip'
import { normalizeCompanyTrip } from '@/modules/trips/utils/mapCompanyTrip'
import { serializeTripStatusForApi } from '@/modules/trips/utils/tripStatus'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function unwrapList(payload: unknown): CompanyTrip[] {
  const items = collectApiListItems(payload)
  if (items.length > 0) {
    return items
      .map(normalizeCompanyTrip)
      .filter((item): item is CompanyTrip => item !== null)
  }

  if (Array.isArray(payload)) {
    return payload
      .map(normalizeCompanyTrip)
      .filter((item): item is CompanyTrip => item !== null)
  }

  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) {
    return root.data
      .map(normalizeCompanyTrip)
      .filter((item): item is CompanyTrip => item !== null)
  }
  const single = normalizeCompanyTrip(root.data ?? root)
  return single ? [single] : []
}

function unwrapOne(payload: unknown): CompanyTrip | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeCompanyTrip(root.data)
  return normalizeCompanyTrip(root)
}

function readPaginatorMeta(payload: unknown): { currentPage: number; lastPage: number } | null {
  if (!payload || typeof payload !== 'object') return null

  const root = payload as Record<string, unknown>
  const meta =
    root.meta && typeof root.meta === 'object'
      ? (root.meta as Record<string, unknown>)
      : root

  const currentPage = Number(meta.current_page)
  const lastPage = Number(meta.last_page)
  if (!Number.isFinite(currentPage) || !Number.isFinite(lastPage) || lastPage < 1) {
    return null
  }

  return { currentPage, lastPage }
}

export const companyTripsService = {
  async listTrips(): Promise<CompanyTrip[]> {
    try {
      const all: CompanyTrip[] = []
      let page = 1
      let lastPage = 1

      do {
        const { data } = await api.get<unknown>('/company/trips', {
          params: { page, per_page: 100 },
        })
        all.push(...unwrapList(data))
        const pagination = readPaginatorMeta(data)
        if (!pagination) break
        lastPage = pagination.lastPage
        page = pagination.currentPage + 1
      } while (page <= lastPage)

      return all
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load trips'))
    }
  },

  async getTrip(id: number): Promise<CompanyTrip> {
    try {
      const { data } = await api.get<unknown>(`/company/trips/${id}`)
      const trip = unwrapOne(data)
      if (!trip) throw new Error('Trip not found')
      return trip
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load trip'))
    }
  },

  async createTrip(input: TripMutationInput): Promise<CompanyTrip> {
    try {
      const { data } = await api.post<unknown>('/company/trips', input)
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating trip')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create trip'))
    }
  },

  async updateTrip(id: number, input: TripMutationInput): Promise<CompanyTrip> {
    try {
      const { data } = await api.patch<unknown>(`/company/trips/${id}`, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating trip')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update trip'))
    }
  },

  async updateTripStatus(id: number, input: TripStatusUpdateInput): Promise<CompanyTrip> {
    try {
      const { data } = await api.patch<unknown>(`/company/trips/${id}`, {
        status: serializeTripStatusForApi(input.status),
      })
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating trip status')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update trip status'))
    }
  },

  async deleteTrip(id: number): Promise<void> {
    try {
      await api.delete(`/company/trips/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete trip'))
    }
  },

  async cloneTrip(id: number, input: TripCloneInput): Promise<CompanyTrip> {
    try {
      const { data } = await api.post<unknown>(`/company/trips/${id}/clone`, input)
      const cloned = unwrapOne(data)
      if (!cloned) throw new Error('Invalid response when cloning trip')
      return cloned
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to clone trip'))
    }
  },
}
