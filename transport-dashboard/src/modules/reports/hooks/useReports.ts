import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { CompanyReport, ReportExportInput } from '@/modules/reports/types'
import { reportsService } from '@/modules/reports/services/reportsService'
import { isReportInProgress } from '@/modules/reports/utils/mapCompanyReport'

export const reportsQueryKey = ['reports', 'exports'] as const

export function useReports() {
  const queryClient = useQueryClient()
  const [exporting, setExporting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const query = useQuery({
    queryKey: reportsQueryKey,
    queryFn: (): Promise<CompanyReport[]> => reportsService.listExports(),
    refetchInterval: (current) => {
      const rows = current.state.data ?? []
      return rows.some(isReportInProgress) ? 4_000 : false
    },
  })

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: reportsQueryKey })
  }, [queryClient])

  const exportReport = useCallback(async (input: ReportExportInput) => {
    setExporting(true)
    try {
      const created = await reportsService.exportReport(input)
      await queryClient.invalidateQueries({ queryKey: reportsQueryKey })
      return created
    } finally {
      setExporting(false)
    }
  }, [queryClient])

  const downloadReport = useCallback(async (report: CompanyReport) => {
    setDownloadingId(report.id)
    try {
      await reportsService.downloadReport(report)
    } finally {
      setDownloadingId(null)
    }
  }, [])

  return {
    reports: query.data ?? [],
    isLoading: query.isPending,
    isFetching: query.isFetching,
    exporting,
    downloadingId,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load reports'
      : null,
    reload,
    exportReport,
    downloadReport,
  }
}
