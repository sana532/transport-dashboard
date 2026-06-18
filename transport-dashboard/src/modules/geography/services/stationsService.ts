import { api } from '@/services/api'
import type { Station } from '@/modules/geography/types'
import { unwrapStationList } from '@/modules/geography/utils/stationApi'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

export const stationsService = {
  async listStations(): Promise<Station[]> {
    try {
      const { data } = await api.get<unknown>('/stations')
      return unwrapStationList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load stations'))
    }
  },
}
