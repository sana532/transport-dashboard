import { api } from '@/services/api'
import type { City, CityFormInput, CityWritePayload } from '@/modules/geography/types'
import { unwrapCityList, unwrapCityOne } from '@/modules/geography/utils/cityApi'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

function toWritePayload(input: CityFormInput): CityWritePayload {
  const nameEn = input.nameEn.trim()
  const nameAr = input.nameAr.trim()
  const latitude = Number(input.latitude.trim())
  const longitude = Number(input.longitude.trim())

  if (!nameEn || !nameAr) {
    throw new Error('English and Arabic names are required')
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Latitude and longitude must be valid numbers')
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90')
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180')
  }

  return {
    name_en: nameEn,
    name_ar: nameAr,
    latitude,
    longitude,
  }
}

function fallbackCity(id: number, payload: CityWritePayload): City {
  return {
    id,
    name: payload.name_en,
    name_en: payload.name_en,
    name_ar: payload.name_ar,
    governorate_name: payload.name_ar,
    latitude: payload.latitude,
    longitude: payload.longitude,
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
      return fallbackCity(Date.now(), payload)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Latitude') ||
          error.message.includes('Longitude') ||
          error.message.includes('names'))
      ) {
        throw error
      }
      throw new Error(getApiErrorMessage(error, 'Failed to create city'))
    }
  },

  async updateCity(id: number, input: CityFormInput): Promise<City> {
    const payload = toWritePayload(input)
    try {
      const { data } = await api.patch<unknown>(`/platform/cities/${id}`, payload)
      const updated = unwrapCityOne(data)
      if (updated) return updated
      return fallbackCity(id, payload)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Latitude') ||
          error.message.includes('Longitude') ||
          error.message.includes('names'))
      ) {
        throw error
      }
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
