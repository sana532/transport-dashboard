import { api } from '@/services/api'
import type {
  CompanyTrip,
  TripCancelInput,
  TripCancelResult,
  TripCloneInput,
  TripMutationInput,
  TripStatusUpdateInput,
} from '@/modules/trips/types/companyTrip'
import type {
  TripResourceAvailability,
  TripResourceAvailabilityInput,
} from '@/modules/trips/types/resourceAvailability'
import type { CompanyTripsListQuery } from '@/modules/trips/types/tripsListQuery'
import { buildCompanyTripsListParams } from '@/modules/trips/types/tripsListQuery'
import { normalizeCompanyTrip } from '@/modules/trips/utils/mapCompanyTrip'
import { mapTripResourceAvailability } from '@/modules/trips/utils/mapResourceAvailability'
import { serializeTripStatusForApi } from '@/modules/trips/utils/tripStatus'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

function unwrapList(payload: unknown): CompanyTrip[] {
  const items = collectApiListItems(payload)
  if (items.length > 0) {
    return items
      .map(normalizeCompanyTrip)
      .filter((item): item is CompanyTrip => item !== null)
  }

  if (Array.isArray(payload)) {
    return payload
      .map(normalizeCompanyTrip)
      .filter((item): item is CompanyTrip => item !== null)
  }

  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) {
    return root.data
      .map(normalizeCompanyTrip)
      .filter((item): item is CompanyTrip => item !== null)
  }
  const single = normalizeCompanyTrip(root.data ?? root)
  return single ? [single] : []
}

function unwrapOne(payload: unknown): CompanyTrip | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeCompanyTrip(root.data)
  return normalizeCompanyTrip(root)
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  if (!error || typeof error !== 'object') return false
  const record = error as { code?: string; name?: string }
  return (
    record.code === 'ERR_CANCELED' ||
    record.name === 'CanceledError' ||
    record.name === 'AbortError'
  )
}

function serializeAvailabilityQuery(params: Record<string, unknown>): string {
  return Object.entries(params)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

export type CompanyTripsPage = {
  trips: CompanyTrip[]
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number
  to: number
  counts: Record<string, unknown> | null
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

function readTripsPage(payload: unknown, fallbackPerPage: number): CompanyTripsPage {
  const trips = unwrapList(payload)
  const root = asRecord(payload)
  const meta = asRecord(root?.meta) ?? root
  const counts = asRecord(root?.counts) ?? asRecord(meta?.counts)

  const currentPage = (meta ? pickMetaNumber(meta, 'current_page') : null) ?? 1
  const perPage =
    (meta ? pickMetaNumber(meta, 'per_page') : null) ?? fallbackPerPage
  const total = (meta ? pickMetaNumber(meta, 'total') : null) ?? trips.length
  const lastPage =
    (meta ? pickMetaNumber(meta, 'last_page') : null) ??
    Math.max(1, perPage > 0 ? Math.ceil(total / perPage) : 1)
  const from =
    (meta ? pickMetaNumber(meta, 'from') : null) ??
    (trips.length > 0 ? (currentPage - 1) * perPage + 1 : 0)
  const to =
    (meta ? pickMetaNumber(meta, 'to') : null) ??
    (trips.length > 0 ? from + trips.length - 1 : 0)

  return { trips, currentPage, lastPage, perPage, total, from, to, counts }
}

export const companyTripsService = {
  async listTripsPage(options?: CompanyTripsListQuery): Promise<CompanyTripsPage> {
    const params = buildCompanyTripsListParams(options ?? {})
    const perPage = Number(params.per_page) || 20

    try {
      const { data } = await api.get<unknown>('/company/trips', { params })
      return readTripsPage(data, perPage)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load trips'))
    }
  },

  /** Loads every page. Prefer `listTripsPage` for UI lists. */
  async listTrips(filters?: Omit<CompanyTripsListQuery, 'page' | 'perPage'>): Promise<CompanyTrip[]> {
    try {
      const first = await this.listTripsPage({ ...filters, page: 1, perPage: 20 })
      if (first.lastPage <= 1) return first.trips

      const remainingPages = Array.from(
        { length: first.lastPage - 1 },
        (_, index) => index + 2,
      )
      const rest = await Promise.all(
        remainingPages.map((page) =>
          this.listTripsPage({ ...filters, page, perPage: 20 }),
        ),
      )

      return first.trips.concat(...rest.map((item) => item.trips))
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load trips'))
    }
  },

  async getTrip(id: number): Promise<CompanyTrip> {
    try {
      const { data } = await api.get<unknown>(`/company/trips/${id}`)
      const trip = unwrapOne(data)
      if (!trip) throw new Error('Trip not found')
      return trip
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load trip'))
    }
  },

  async getResourceAvailability(
    input: TripResourceAvailabilityInput,
    signal?: AbortSignal,
  ): Promise<TripResourceAvailability> {
    const params: Record<string, string | number> = {
      route_id: input.route_id,
      departure_time: input.departure_time,
      estimated_arrival_time: input.estimated_arrival_time,
    }
    if (input.exclude_trip_id != null) {
      params.exclude_trip_id = input.exclude_trip_id
    }

    try {
      const { data } = await api.get<unknown>('/company/trips/resource-availability', {
        params,
        paramsSerializer: { serialize: serializeAvailabilityQuery },
        signal,
      })
      const availability = mapTripResourceAvailability(data)
      if (!availability) throw new Error('Invalid resource availability response')
      return availability
    } catch (error) {
      if (isAbortError(error)) throw error
      throw new Error(getApiErrorMessage(error, 'Failed to check resource availability'))
    }
  },

  async createTrip(input: TripMutationInput): Promise<CompanyTrip> {
    try {
      const { data } = await api.post<unknown>('/company/trips', input)
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating trip')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create trip'))
    }
  },

  async updateTrip(id: number, input: TripMutationInput): Promise<CompanyTrip> {
    try {
      const { data } = await api.patch<unknown>(`/company/trips/${id}`, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating trip')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update trip'))
    }
  },

  async updateTripStatus(id: number, input: TripStatusUpdateInput): Promise<CompanyTrip> {
    try {
      const { data } = await api.patch<unknown>(`/company/trips/${id}`, {
        status: serializeTripStatusForApi(input.status),
      })
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating trip status')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update trip status'))
    }
  },

  /**
   * Preferred cancel flow for the company dashboard.
   *
   * Expected backend endpoint:
   *   POST /api/company/trips/{id}/cancel
   * Body:
   *   { reason?: string, notify_passengers: boolean, refund: boolean }
   * Behavior expected from backend:
   *   - Mark trip as cancelled (do not hard-delete)
   *   - Cancel related active bookings
   *   - If refund=true: refund paid bookings and mark payment as refunded
   *   - If notify_passengers=true: notify each affected passenger
   *   - Reject cancel only when business rules require (e.g. trip already completed)
   * Response (flexible): trip object, optionally with cancelled_bookings_count,
   *   refunded_amount, notified_passengers_count
   */
  async cancelTrip(id: number, input: TripCancelInput): Promise<TripCancelResult> {
    try {
      const { data } = await api.post<unknown>(`/company/trips/${id}/cancel`, {
        reason: input.reason?.trim() || undefined,
        notify_passengers: input.notify_passengers,
        refund: input.refund,
      })

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response when cancelling trip')
      }

      const root = data as Record<string, unknown>
      const tripRaw = root.data && typeof root.data === 'object' ? root.data : root
      const tripRecord = tripRaw as Record<string, unknown>
      const tripCandidate =
        tripRecord.trip && typeof tripRecord.trip === 'object'
          ? tripRecord.trip
          : tripRaw

      const trip = normalizeCompanyTrip(tripCandidate)
      if (!trip) throw new Error('Invalid response when cancelling trip')

      return {
        trip,
        cancelled_bookings_count:
          typeof tripRecord.cancelled_bookings_count === 'number'
            ? tripRecord.cancelled_bookings_count
            : typeof root.cancelled_bookings_count === 'number'
              ? root.cancelled_bookings_count
              : undefined,
        refunded_amount:
          typeof tripRecord.refunded_amount === 'number'
            ? tripRecord.refunded_amount
            : typeof root.refunded_amount === 'number'
              ? root.refunded_amount
              : undefined,
        notified_passengers_count:
          typeof tripRecord.notified_passengers_count === 'number'
            ? tripRecord.notified_passengers_count
            : typeof root.notified_passengers_count === 'number'
              ? root.notified_passengers_count
              : undefined,
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to cancel trip'))
    }
  },

  async deleteTrip(id: number): Promise<void> {
    try {
      await api.delete(`/company/trips/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete trip'))
    }
  },

  async cloneTrip(id: number, input: TripCloneInput): Promise<CompanyTrip> {
    try {
      const { data } = await api.post<unknown>(`/company/trips/${id}/clone`, input)
      const cloned = unwrapOne(data)
      if (!cloned) throw new Error('Invalid response when cloning trip')
      return cloned
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to clone trip'))
    }
  },
}
