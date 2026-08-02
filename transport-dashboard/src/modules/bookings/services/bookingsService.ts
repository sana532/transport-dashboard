import { api } from '@/services/api'
import type { BookingsManagementData, CompanyBooking } from '@/modules/bookings/types'
import { normalizeCompanyBooking } from '@/modules/bookings/utils/mapCompanyBooking'
import { buildBookingStats } from '@/modules/bookings/utils/buildBookingStats'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function unwrapList(payload: unknown): CompanyBooking[] {
  const mapItems = (items: unknown[]) =>
    items
      .map(normalizeCompanyBooking)
      .filter((item): item is CompanyBooking => item !== null)

  if (Array.isArray(payload)) return mapItems(payload)
  if (!payload || typeof payload !== 'object') return []

  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) return mapItems(root.data)

  if (root.data && typeof root.data === 'object') {
    const nested = root.data as Record<string, unknown>
    if (Array.isArray(nested.data)) return mapItems(nested.data)
    if (Array.isArray(nested.bookings)) return mapItems(nested.bookings)
  }

  if (Array.isArray(root.bookings)) return mapItems(root.bookings)

  // Last resort: generic collector (may over-flatten nested resources).
  const items = collectApiListItems(payload)
  if (items.length > 0) return mapItems(items)

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
