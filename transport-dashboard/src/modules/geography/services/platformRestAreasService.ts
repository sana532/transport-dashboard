import { api } from '@/services/api'
import type { RestArea, RestAreaFormInput, RestAreaWritePayload } from '@/modules/geography/types'
import { unwrapRestAreaList, unwrapRestAreaOne } from '@/modules/geography/utils/restAreaApi'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

function toWritePayload(input: RestAreaFormInput): RestAreaWritePayload {
  const cityId = Number(input.cityId.trim())
  const latitude = Number(input.latitude.trim())
  const longitude = Number(input.longitude.trim())

  if (!Number.isFinite(cityId) || cityId <= 0) {
    throw new Error('Select a valid city')
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Latitude and longitude must be valid numbers')
  }

  return {
    city_id: cityId,
    name: input.name.trim(),
    description: input.description.trim(),
    latitude,
    longitude,
    is_active: input.isActive,
  }
}

function fallbackRestArea(id: number, payload: RestAreaWritePayload): RestArea {
  return {
    id,
    name: payload.name,
    description: payload.description || null,
    city_id: payload.city_id,
    latitude: payload.latitude,
    longitude: payload.longitude,
    is_active: payload.is_active,
    city: null,
  }
}

export const platformRestAreasService = {
  async listRestAreas(): Promise<RestArea[]> {
    try {
      const { data } = await api.get<unknown>('/platform/rest-areas')
      return unwrapRestAreaList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load rest areas'))
    }
  },

  async getRestArea(id: number): Promise<RestArea> {
    try {
      const { data } = await api.get<unknown>(`/platform/rest-areas/${id}`)
      const area = unwrapRestAreaOne(data)
      if (!area) throw new Error('Rest area not found')
      return area
    } catch (error) {
      if (error instanceof Error && error.message === 'Rest area not found') throw error
      throw new Error(getApiErrorMessage(error, 'Failed to load rest area'))
    }
  },

  async createRestArea(input: RestAreaFormInput): Promise<RestArea> {
    const payload = toWritePayload(input)
    try {
      const { data } = await api.post<unknown>('/platform/rest-areas', payload)
      const created = unwrapRestAreaOne(data)
      if (created) return created
      return fallbackRestArea(Date.now(), payload)
    } catch (error) {
      if (error instanceof Error && (error.message.includes('Latitude') || error.message.includes('city'))) {
        throw error
      }
      throw new Error(getApiErrorMessage(error, 'Failed to create rest area'))
    }
  },

  async updateRestArea(id: number, input: RestAreaFormInput): Promise<RestArea> {
    const payload = toWritePayload(input)
    try {
      const { data } = await api.patch<unknown>(`/platform/rest-areas/${id}`, payload)
      const updated = unwrapRestAreaOne(data)
      if (updated) return updated
      return fallbackRestArea(id, payload)
    } catch (error) {
      if (error instanceof Error && (error.message.includes('Latitude') || error.message.includes('city'))) {
        throw error
      }
      throw new Error(getApiErrorMessage(error, 'Failed to update rest area'))
    }
  },

  async deleteRestArea(id: number): Promise<void> {
    try {
      await api.delete(`/platform/rest-areas/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete rest area'))
    }
  },
}
