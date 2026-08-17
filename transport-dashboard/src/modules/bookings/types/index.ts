export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'unknown'

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'unknown'

export type CompanyBooking = {
  id: number
  reference: string
  passengerName: string
  passengerPhone: string | null
  routeLabel: string
  tripId: number | null
  seatCount: number
  seatNumbers: string | null
  totalAmount: number | null
  currency: string | null
  paymentMethod: string | null
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  bookedAt: string
  departureTime: string | null
}

export type BookingsStatVariant = 'primary' | 'info' | 'success' | 'warning'

export type BookingsStatCard = {
  id: string
  titleKey: string
  value: string
  variant: BookingsStatVariant
}

export type BookingsListPagination = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number
  to: number
}

export type BookingsManagementData = {
  bookings: CompanyBooking[]
  stats: BookingsStatCard[]
  pagination: BookingsListPagination
}
