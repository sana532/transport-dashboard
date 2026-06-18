import type { CompanyTripStatus } from '@/modules/trips/types/companyTrip'

/** Backend uses `in_progress`; the dashboard UI uses `active`. */
export function normalizeTripStatusFromApi(raw: unknown): CompanyTripStatus {
  const key = typeof raw === 'string' ? raw.toLowerCase() : ''
  if (key === 'in_progress' || key === 'active') return 'active'
  if (key === 'completed' || key === 'cancelled' || key === 'scheduled') return key
  return 'scheduled'
}

export function serializeTripStatusForApi(status: CompanyTripStatus): string {
  if (status === 'active') return 'in_progress'
  return status
}

export function isArchivedTrip(status: CompanyTripStatus): boolean {
  return status === 'completed' || status === 'cancelled'
}
