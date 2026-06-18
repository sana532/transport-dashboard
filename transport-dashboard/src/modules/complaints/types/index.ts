import type { ID } from '@/shared/types'

export type ComplaintId = ID

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved'

export type ComplaintType =
  | 'service_quality'
  | 'delay'
  | 'driver_behavior'
  | 'vehicle_condition'
  | 'booking_issue'
  | 'safety_concern'

export const complaintTypeLabels: Record<ComplaintType, string> = {
  service_quality: 'Service Quality',
  delay: 'Delay',
  driver_behavior: 'Driver Behavior',
  vehicle_condition: 'Vehicle Condition',
  booking_issue: 'Booking Issue',
  safety_concern: 'Safety Concern',
}

export const complaintStatusLabels: Record<ComplaintStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

/** Table row + detail view fields */
export type ComplaintManagementRow = {
  id: ComplaintId
  complaintCode: string
  passengerName: string
  phone: string
  type: ComplaintType
  categoryId?: number
  categoryLabel: string
  reportedAtLabel: string
  status: ComplaintStatus
  subject?: string
  body?: string
  passengerId: string
  /** PNR from nested booking when passenger profile is not included */
  bookingPnr?: string
  reportedAtDetailLabel: string
  relatedTripCode: string
  relatedTripRoute: string
  assignedDriverName: string
  description: string
  adminNotes: string
}

export type ComplaintCategory = {
  id: number
  label: string
  nameEn: string
  nameAr: string
}

export type ComplaintsManagementData = {
  rows: ComplaintManagementRow[]
  categories: ComplaintCategory[]
  totalResults: number
  page: number
  pageSize: number
}
