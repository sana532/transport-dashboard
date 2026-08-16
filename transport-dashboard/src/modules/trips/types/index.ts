import {
  Archive,
  CheckCircle2,
  PlayCircle,
  Truck,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

export type TripId = string

export type TripStatus =
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'cancelled'

export type Trip = {
  id: TripId
  routeName: string
  scheduledAt: string
  status: TripStatus
}

export type TripsStatVariant = 'primary' | 'info' | 'success' | 'danger'

export type TripsStatCard = {
  id: string
  title: string
  value: string
  note: string
  trend: string
  variant: TripsStatVariant
  Icon: LucideIcon
}

export type TripRowStatus =
  | 'scheduled'
  | 'active'
  | 'interrupted'
  | 'completed'
  | 'cancelled'

export type TripsRecentRow = {
  id: string
  numericId: number
  route: string
  driver: string
  vehicle: string
  dateTime: string
  status: TripRowStatus
  departureIso: string
}

export type TripsFilters = {
  search: string
  dateRange: string
  route: string
  status: string
}

export type TripsManagementData = {
  stats: TripsStatCard[]
  recentTrips: TripsRecentRow[]
  /** Past trips the company can reopen as a new schedule (mock / future API). */
  archivedTrips: TripsRecentRow[]
  defaultFilters: TripsFilters
}

export const TripsIcons = {
  Total: Users,
  Active: Truck,
  Running: PlayCircle,
  Completed: CheckCircle2,
  Cancelled: XCircle,
  Archive,
} as const
