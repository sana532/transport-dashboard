import type { ComplaintCategory, ComplaintsManagementData } from '@/modules/complaints/types'
import {
  complaintsService,
  type ComplaintsListQuery,
} from '@/modules/complaints/services/complaintsService'

const DEFAULT_PAGE_SIZE = 6

export const complaintsManagementService = {
  async getComplaintsManagementData(
    locale: string,
    query?: ComplaintsListQuery,
  ): Promise<ComplaintsManagementData> {
    const [rows, categories] = await Promise.all([
      complaintsService.listComplaints(locale, query),
      complaintsService.listComplaintCategories(locale).catch(() => [] as ComplaintCategory[]),
    ])

    return {
      rows,
      categories,
      totalResults: rows.length,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    }
  },

  async getComplaintById(id: string, locale: string) {
    const numericId = Number(id)
    if (!Number.isFinite(numericId)) return null
    try {
      return await complaintsService.getComplaint(numericId, locale)
    } catch {
      return null
    }
  },
}
