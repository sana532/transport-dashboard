export type WeeklyChangeMetric = {
  thisWeek: number
  lastWeek: number
  changePct: number
}

export type WeeklyTopRoute = {
  routeName: string
  bookings: number
  revenue: number
  sharePct: number
}

export type WeeklyNoShows = {
  count: number
  /** Fraction 0–1 from the API; used for the gauge width. */
  rate: number | null
  /** Same value 0–100 from the API; used for the label. */
  ratePct: number | null
  lostRevenue: number
}

export type WeeklyTrips = {
  completed: number
  cancelled: number
  total: number
  cancellationRatePct: number
}

export type WeeklyOccupancy = {
  avgLoadFactorPct: number
  seatsSold: number
  seatsCapacity: number
  tripsMeasured: number
}

export type WeeklyWorstRoute = {
  routeName: string
  trips: number
  seatsSold: number
  capacity: number
  loadFactorPct: number
}

export type WeeklyBusiestDay = {
  date: string
  weekday: string
  seats: number
}

export type WeeklyPeakHour = {
  hour: string
  seats: number
}

export type WeeklyOnTime = {
  measuredTrips: number
  onTimePct: number
  lateTrips: number
  avgDelayMinutes: number
}

export type WeeklyComplaint = {
  label: string
  count: number | null
}

export type WeeklyAiSummary = {
  periodStart: string
  periodEnd: string
  currency: string
  alerts: string[]
  summaryAr: string | null
  highlights: string[]
  aiGenerated: boolean
  revenue: WeeklyChangeMetric | null
  passengers: WeeklyChangeMetric | null
  topRoutes: WeeklyTopRoute[]
  noShows: WeeklyNoShows | null
  trips: WeeklyTrips | null
  occupancy: WeeklyOccupancy | null
  worstRoutes: WeeklyWorstRoute[]
  busiestDay: WeeklyBusiestDay | null
  peakHours: WeeklyPeakHour[]
  onTime: WeeklyOnTime | null
  topComplaints: WeeklyComplaint[]
}
