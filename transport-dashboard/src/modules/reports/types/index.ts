export const REPORT_TYPES = ['bookings', 'trips', 'no_shows'] as const

export type ReportType = (typeof REPORT_TYPES)[number]

export const REPORT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const

export type ReportStatus = (typeof REPORT_STATUSES)[number]

export type ReportExportInput = {
  type: ReportType
  from: string
  to: string
}

export type CompanyReport = {
  id: number
  type: string
  status: ReportStatus
  from: string
  to: string
  fileName: string
  createdAt: string
  downloadUrl: string | null
  canDownload: boolean
}
