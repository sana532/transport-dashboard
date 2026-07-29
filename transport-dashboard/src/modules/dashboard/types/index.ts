import type { LucideIcon } from 'lucide-react'

export type DashboardStatCard = {
  id: string
  titleKey: string
  value: string
  /** Pre-formatted trend / secondary line from API (optional). */
  trendLabel?: string
  trendTone?: 'up' | 'down' | 'neutral'
  Icon: LucideIcon
}

export type DashboardDriver = {
  name: string
  trips: number
  rating: number
  revenue: string
}

export type DailyBooking = {
  bookingId: string
  customerName: string
  customerPhone: string
  route: string
  seats: number
  payment: 'Paid' | 'Pending'
  booking: 'Confirmed' | 'Pending'
  date: string
}

export type RecentTripStatus = 'completed' | 'in_transit'

export type RecentTrip = {
  tripId: string
  busId: string
  driver: string
  route: string
  departure: string
  status: RecentTripStatus
  revenue: string
}

export type RevenueTrendPoint = {
  id?: string
  /** Short month id for i18n, e.g. `jan`, `feb`. */
  monthKey?: string
  /** Direct label from API when month key is unavailable. */
  label?: string
  revenue: number
}

export type RoutePerformanceSlice = {
  id: string
  /** Route code shown as-is (e.g. A-12). */
  name: string
  /** When set, legend/labels use `t(labelKey)` instead of `name`. */
  labelKey?: string
  value: number
  color: string
}

export type DashboardData = {
  statCards: DashboardStatCard[]
  revenueTrendData: RevenueTrendPoint[]
  routePerformanceData: RoutePerformanceSlice[]
  topDrivers: DashboardDriver[]
  dailyBookings: DailyBooking[]
  recentTrips: RecentTrip[]
}
