import type { ID } from '@/shared/types'

export type ComplaintId = ID

export type ComplaintStatus = 'pending' | 'open' | 'in_progress' | 'resolved' | 'closed'

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  'pending',
  'open',
  'in_progress',
  'resolved',
  'closed',
]

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
  pending: 'Pending',
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export type ComplaintStatusUpdateInput = {
  status: ComplaintStatus
  admin_notes?: string
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
  attachments: ComplaintAttachment[]
  /** Present on platform complaints (cross-company) */
  companyId?: number
  companyName?: string
}

export type ComplaintAttachment = {
  id: number
  url: string
  fileName: string
  mimeType: string
  size?: number
}

export type ComplaintCategory = {
  id: number
  label: string
  nameEn: string
  nameAr: string
  iconUrl?: string | null
  visibilityScope?: string | null
  isActive?: boolean
}

export type ComplaintsManagementData = {
  rows: ComplaintManagementRow[]
  categories: ComplaintCategory[]
  totalResults: number
  page: number
  pageSize: number
}
