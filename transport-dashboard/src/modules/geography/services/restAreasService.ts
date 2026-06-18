import { api } from '@/services/api'
import type { RestArea } from '@/modules/geography/types'
import { unwrapRestAreaList, unwrapRestAreaOne } from '@/modules/geography/utils/restAreaApi'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'

export const restAreasService = {
  async listRestAreas(): Promise<RestArea[]> {
    try {
      const { data } = await api.get<unknown>('/rest-areas')
      return unwrapRestAreaList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load rest areas'))
    }
  },

  async getRestArea(id: number): Promise<RestArea> {
    try {
      const { data } = await api.get<unknown>(`/rest-areas/${id}`)
      const area = unwrapRestAreaOne(data)
      if (!area) throw new Error('Rest area not found')
      return area
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load rest area'))
    }
  },
}
