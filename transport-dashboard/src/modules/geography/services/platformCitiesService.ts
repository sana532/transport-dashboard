import { api } from '@/services/api'
import type { City, CityFormInput, CityWritePayload } from '@/modules/geography/types'
import { unwrapCityList, unwrapCityOne } from '@/modules/geography/utils/cityApi'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

function toWritePayload(input: CityFormInput): CityWritePayload {
  const latitude = Number(input.latitude.trim())
  const longitude = Number(input.longitude.trim())
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Latitude and longitude must be valid numbers')
  }

  return {
    name: input.name.trim(),
    governorate_name: input.governorateName.trim(),
    latitude,
    longitude,
  }
}

export const platformCitiesService = {
  async listCities(): Promise<City[]> {
    try {
      const { data } = await api.get<unknown>('/platform/cities')
      return unwrapCityList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load cities'))
    }
  },

  async getCity(id: number): Promise<City> {
    try {
      const { data } = await api.get<unknown>(`/platform/cities/${id}`)
      const city = unwrapCityOne(data)
      if (!city) throw new Error('City not found')
      return city
    } catch (error) {
      if (error instanceof Error && error.message === 'City not found') throw error
      throw new Error(getApiErrorMessage(error, 'Failed to load city'))
    }
  },

  async createCity(input: CityFormInput): Promise<City> {
    const payload = toWritePayload(input)
    try {
      const { data } = await api.post<unknown>('/platform/cities', payload)
      const created = unwrapCityOne(data)
      if (created) return created
      return {
        id: Date.now(),
        name: payload.name,
        governorate_name: payload.governorate_name,
        latitude: payload.latitude,
        longitude: payload.longitude,
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Latitude')) throw error
      throw new Error(getApiErrorMessage(error, 'Failed to create city'))
    }
  },

  async updateCity(id: number, input: CityFormInput): Promise<City> {
    const payload = toWritePayload(input)
    try {
      const { data } = await api.patch<unknown>(`/platform/cities/${id}`, payload)
      const updated = unwrapCityOne(data)
      if (updated) return updated
      return {
        id,
        name: payload.name,
        governorate_name: payload.governorate_name,
        latitude: payload.latitude,
        longitude: payload.longitude,
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Latitude')) throw error
      throw new Error(getApiErrorMessage(error, 'Failed to update city'))
    }
  },

  async deleteCity(id: number): Promise<void> {
    try {
      await api.delete(`/platform/cities/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete city'))
    }
  },
}
