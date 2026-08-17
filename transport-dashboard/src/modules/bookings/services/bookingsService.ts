import { api } from '@/services/api'
import type {
  BookingsListPagination,
  BookingsManagementData,
  CompanyBooking,
} from '@/modules/bookings/types'
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function pickMetaNumber(meta: Record<string, unknown>, key: string): number | null {
  const value = Number(meta[key])
  return Number.isFinite(value) ? value : null
}

function readBookingsPage(
  payload: unknown,
  fallbackPage: number,
  fallbackPerPage: number,
): {
  bookings: CompanyBooking[]
  pagination: BookingsListPagination
  counts: Record<string, unknown> | null
} {
  const bookings = unwrapList(payload)
  const root = asRecord(payload)
  const meta = asRecord(root?.meta) ?? root
  const counts = asRecord(meta?.counts) ?? asRecord(root?.counts)

  const currentPage = (meta ? pickMetaNumber(meta, 'current_page') : null) ?? fallbackPage
  const perPage = (meta ? pickMetaNumber(meta, 'per_page') : null) ?? fallbackPerPage
  const total = (meta ? pickMetaNumber(meta, 'total') : null) ?? bookings.length
  const lastPage =
    (meta ? pickMetaNumber(meta, 'last_page') : null) ??
    Math.max(1, perPage > 0 ? Math.ceil(total / perPage) : 1)
  const from =
    (meta ? pickMetaNumber(meta, 'from') : null) ??
    (bookings.length > 0 ? (currentPage - 1) * perPage + 1 : 0)
  const to =
    (meta ? pickMetaNumber(meta, 'to') : null) ??
    (bookings.length > 0 ? from + bookings.length - 1 : 0)

  return {
    bookings,
    counts,
    pagination: { currentPage, lastPage, perPage, total, from, to },
  }
}

export const bookingsService = {
  async listBookings(page = 1): Promise<CompanyBooking[]> {
    try {
      const { data } = await api.get<unknown>('/company/bookings', { params: { page } })
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

  async getBookingsManagementData(page = 1): Promise<BookingsManagementData> {
    try {
      const { data } = await api.get<unknown>('/company/bookings', { params: { page } })
      const parsed = readBookingsPage(data, page, 15)
      return {
        bookings: parsed.bookings,
        stats: buildBookingStats(parsed.bookings, parsed.counts),
        pagination: parsed.pagination,
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load bookings'))
    }
  },
}
