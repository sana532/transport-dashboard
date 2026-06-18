import {
  BusFront,
  CircleDollarSign,
  Route,
  TrendingUp,
  Users,
} from 'lucide-react'
import type {
  DashboardData,
  DashboardDriver,
  DashboardStatCard,
  DailyBooking,
  RecentTrip,
  RevenueTrendPoint,
  RoutePerformanceSlice,
} from '@/modules/dashboard/types'

const statCards: DashboardStatCard[] = [
  {
    id: 'stat-passengers',
    titleKey: 'dashboard.stats.monthlyPassengers.title',
    value: '12,847',
    trendKey: 'dashboard.stats.monthlyPassengers.trend',
    Icon: Users,
  },
  {
    id: 'stat-monthly-revenue',
    titleKey: 'dashboard.stats.monthlyRevenue.title',
    value: '$45,280',
    trendKey: 'dashboard.stats.monthlyRevenue.trend',
    Icon: CircleDollarSign,
  },
  {
    id: 'stat-daily-revenue',
    titleKey: 'dashboard.stats.dailyRevenue.title',
    value: '$1,847',
    trendKey: 'dashboard.stats.dailyRevenue.trend',
    Icon: TrendingUp,
  },
  {
    id: 'stat-top-route',
    titleKey: 'dashboard.stats.topRoute.title',
    value: 'A-12',
    trendKey: 'dashboard.stats.topRoute.trend',
    Icon: Route,
  },
  {
    id: 'stat-buses',
    titleKey: 'dashboard.stats.buses.title',
    value: '48',
    trendKey: 'dashboard.stats.buses.trend',
    Icon: BusFront,
  },
]

const revenueTrendData: RevenueTrendPoint[] = [
  { monthKey: 'jan', revenue: 32000 },
  { monthKey: 'feb', revenue: 36000 },
  { monthKey: 'mar', revenue: 39000 },
  { monthKey: 'apr', revenue: 44000 },
  { monthKey: 'may', revenue: 48000 },
  { monthKey: 'jun', revenue: 46000 },
  { monthKey: 'jul', revenue: 50000 },
  { monthKey: 'aug', revenue: 53000 },
  { monthKey: 'sep', revenue: 49000 },
  { monthKey: 'oct', revenue: 45000 },
  { monthKey: 'nov', revenue: 44000 },
  { monthKey: 'dec', revenue: 44500 },
]

const routePerformanceData: RoutePerformanceSlice[] = [
  { id: 'rp-a12', name: 'Route A-12', value: 35, color: '#2F3E1F' },
  { id: 'rp-b08', name: 'Route B-08', value: 25, color: '#3F5429' },
  { id: 'rp-c15', name: 'Route C-15', value: 20, color: '#5B7242' },
  { id: 'rp-d22', name: 'Route D-22', value: 15, color: '#7A8F63' },
  { id: 'rp-others', name: 'Others', labelKey: 'dashboard.routeSlice.others', value: 5, color: '#9EAE8A' },
]

const topDrivers: DashboardDriver[] = [
  { name: 'Mike Wilson', trips: 42, rating: 4.8, revenue: '$8,420' },
  { name: 'David Brown', trips: 38, rating: 4.7, revenue: '$7,890' },
]

const dailyBookings: DailyBooking[] = [
  {
    bookingId: '#BK001',
    customerName: 'John Smith',
    customerPhone: '+1 (234) 567-890',
    route: 'A-12',
    seats: 2,
    payment: 'Paid',
    booking: 'Confirmed',
    date: '2024-03-15',
  },
  {
    bookingId: '#BK002',
    customerName: 'Sarah Johnson',
    customerPhone: '+1 (987) 654-321',
    route: 'B-08',
    seats: 1,
    payment: 'Pending',
    booking: 'Pending',
    date: '2024-03-15',
  },
]

const recentTrips: RecentTrip[] = [
  {
    tripId: '#TR001',
    busId: 'BUS-042',
    driver: 'Mike Wilson',
    route: 'A-12',
    departure: '08:30 AM',
    status: 'completed',
    revenue: '$420',
  },
  {
    tripId: '#TR002',
    busId: 'BUS-018',
    driver: 'David Brown',
    route: 'B-08',
    departure: '10:15 AM',
    status: 'in_transit',
    revenue: '$380',
  },
]

export const dashboardMockData: DashboardData = {
  statCards,
  revenueTrendData,
  routePerformanceData,
  topDrivers,
  dailyBookings,
  recentTrips,
}
