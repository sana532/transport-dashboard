import type { TripSeatMapEntry, TripSeatStats } from '@/modules/trips/types/companyTrip'

/** Align summary cards with the seat grid (API stats can lag behind seat_map). */
export function deriveSeatStatsFromMap(
  seatMap: TripSeatMapEntry[],
  layoutSeatCount: number,
  apiStats?: TripSeatStats | null,
): TripSeatStats | null {
  if (!seatMap.length && !apiStats) return null

  const booked_seats = seatMap.filter((seat) => seat.is_booked).length
  const total_seats = apiStats?.total_seats ?? layoutSeatCount
  const available_seats = Math.max(0, total_seats - booked_seats)

  return {
    total_seats,
    available_seats,
    booked_seats,
    total_revenue: apiStats?.total_revenue ?? 0,
  }
}
