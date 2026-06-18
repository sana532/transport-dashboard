import { api } from '@/services/api'
import type { Station, StationFormInput, StationWritePayload } from '@/modules/geography/types'
import { unwrapStationList, unwrapStationOne } from '@/modules/geography/utils/stationApi'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

function toWritePayload(input: StationFormInput): StationWritePayload {
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

export const platformStationsService = {
  async listStations(): Promise<Station[]> {
    try {
      const { data } = await api.get<unknown>('/platform/stations')
      return unwrapStationList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load stations'))
    }
  },

  async getStation(id: number): Promise<Station> {
    try {
      const { data } = await api.get<unknown>(`/platform/stations/${id}`)
      const station = unwrapStationOne(data)
      if (!station) throw new Error('Station not found')
      return station
    } catch (error) {
      if (error instanceof Error && error.message === 'Station not found') throw error
      throw new Error(getApiErrorMessage(error, 'Failed to load station'))
    }
  },

  async createStation(input: StationFormInput): Promise<Station> {
    const payload = toWritePayload(input)
    try {
      const { data } = await api.post<unknown>('/platform/stations', payload)
      const created = unwrapStationOne(data)
      if (created) return created
      return {
        id: Date.now(),
        city_id: 0,
        name: payload.name,
        governorate_name: payload.governorate_name,
        latitude: payload.latitude,
        longitude: payload.longitude,
        city: null,
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Latitude')) throw error
      throw new Error(getApiErrorMessage(error, 'Failed to create station'))
    }
  },

  async updateStation(id: number, input: StationFormInput): Promise<Station> {
    const payload = toWritePayload(input)
    try {
      const { data } = await api.patch<unknown>(`/platform/stations/${id}`, payload)
      const updated = unwrapStationOne(data)
      if (updated) return updated
      return {
        id,
        city_id: 0,
        name: payload.name,
        governorate_name: payload.governorate_name,
        latitude: payload.latitude,
        longitude: payload.longitude,
        city: null,
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Latitude')) throw error
      throw new Error(getApiErrorMessage(error, 'Failed to update station'))
    }
  },

  async deleteStation(id: number): Promise<void> {
    try {
      await api.delete(`/platform/stations/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete station'))
    }
  },
}
