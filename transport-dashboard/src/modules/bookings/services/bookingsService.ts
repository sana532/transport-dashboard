import { api } from '@/services/api'
import type { BookingsManagementData, CompanyBooking } from '@/modules/bookings/types'
import { normalizeCompanyBooking } from '@/modules/bookings/utils/mapCompanyBooking'
import { buildBookingStats } from '@/modules/bookings/utils/buildBookingStats'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function unwrapList(payload: unknown): CompanyBooking[] {
  const items = collectApiListItems(payload)
  if (items.length > 0) {
    return items
      .map(normalizeCompanyBooking)
      .filter((item): item is CompanyBooking => item !== null)
  }

  if (Array.isArray(payload)) {
    return payload
      .map(normalizeCompanyBooking)
      .filter((item): item is CompanyBooking => item !== null)
  }

  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) {
    return root.data
      .map(normalizeCompanyBooking)
      .filter((item): item is CompanyBooking => item !== null)
  }
  const single = normalizeCompanyBooking(root.data ?? root)
  return single ? [single] : []
}

function unwrapOne(payload: unknown): CompanyBooking | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeCompanyBooking(root.data)
  return normalizeCompanyBooking(root)
}

export const bookingsService = {
  async listBookings(): Promise<CompanyBooking[]> {
    try {
      const { data } = await api.get<unknown>('/company/bookings')
      return unwrapList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load bookings'))
    }
  },

  async getBooking(id: number): Promise<CompanyBooking> {
    try {
      const { data } = await api.get<unknown>(`/company/bookings/${id}`)
      const booking = unwrapOne(data)
      if (!booking) throw new Error('Booking not found')
      return booking
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load booking'))
    }
  },

  async listBookingsForTrip(tripId: number): Promise<CompanyBooking[]> {
    try {
      const { data } = await api.get<unknown>(`/company/trips/${tripId}/bookings`)
      return unwrapList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load trip bookings'))
    }
  },

  async getBookingsManagementData(): Promise<BookingsManagementData> {
    const bookings = await this.listBookings()
    return {
      bookings,
      stats: buildBookingStats(bookings),
    }
  },
}
