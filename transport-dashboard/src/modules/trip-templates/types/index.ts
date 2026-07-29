export type TripTemplateScheduleSlot = {
  time: string
  vehicleId: number
  driverId: number | null
}

export type CompanyTripTemplate = {
  id: number
  companyId: number
  routeId: number
  name: string
  daysOfWeek: number[]
  schedule: TripTemplateScheduleSlot[]
  basePrice: number | null
  isActive: boolean
  routeName: string | null
  createdAt: string
  updatedAt: string
}

export type TripTemplateScheduleInput = {
  time: string
  vehicle_id: number
  driver_id: number | null
}

export type TripTemplateInput = {
  route_id: number
  name: string
  days_of_week: number[]
  schedule: TripTemplateScheduleInput[]
  base_price?: number
  is_active: boolean
}

/** API weekday index: 0 = Sunday … 6 = Saturday */
export const WEEKDAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const
