import { api } from '@/services/api'
import type { Trip } from '@/modules/trips/types'

export const tripsService = {
  list: () => api.get<Trip[]>('/trips'),
  get: (id: string) => api.get<Trip>(`/trips/${id}`),
  create: (payload: Partial<Trip>) => api.post<Trip>('/trips', payload),
  update: (id: string, payload: Partial<Trip>) =>
    api.patch<Trip>(`/trips/${id}`, payload),
}
