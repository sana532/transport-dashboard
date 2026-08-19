import { api } from '@/services/api'
import type { CompanyReport, ReportExportInput } from '@/modules/reports/types'
import {
  parseContentDispositionFileName,
  readBlobErrorMessage,
  triggerBlobDownload,
  triggerUrlDownload,
} from '@/modules/reports/utils/downloadBlob'
import {
  extractDownloadUrl,
  fileNameFromUrl,
  looksLikeFileUrl,
  normalizeCompanyReport,
} from '@/modules/reports/utils/mapCompanyReport'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'
import { readStoredLocale } from '@/shared/i18n/config'

const DOWNLOAD_PATH = (id: number) => `/company/reports/${id}/download`

function unwrapReportList(payload: unknown): CompanyReport[] {
  return collectApiListItems(payload)
    .map((item) => normalizeCompanyReport(item))
    .filter((item): item is CompanyReport => item !== null)
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) return a.createdAt < b.createdAt ? 1 : -1
      return b.id - a.id
    })
}

function reportFileName(report: CompanyReport, url?: string | null): string {
  if (report.fileName.includes('.')) return report.fileName
  if (url) {
    const fromUrl = fileNameFromUrl(url)
    if (fromUrl) return fromUrl
  }
  return `${report.fileName || `report-${report.id}`}.csv`
}

function sameOriginDownloadUrl(reportId: number): string {
  return `/api${DOWNLOAD_PATH(reportId)}`
}

async function downloadFromApi(report: CompanyReport): Promise<void> {
  const token = localStorage.getItem('auth_token')
  const locale = readStoredLocale()

  const response = await fetch(sameOriginDownloadUrl(report.id), {
    method: 'GET',
    headers: {
      Accept: '*/*',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Accept-Language': locale === 'ar' ? 'ar' : 'en',
      'X-Locale': locale,
    },
  })

  const contentType = response.headers.get('content-type') ?? ''
  const blob = await response.blob()

  if (!response.ok) {
    throw new Error(await readBlobErrorMessage(blob, 'Failed to download report'))
  }

  if (contentType.includes('json')) {
    const payload: unknown = JSON.parse(await blob.text())
    const url = extractDownloadUrl(payload)
    if (!url) throw new Error('Failed to download report')
    triggerUrlDownload(url, reportFileName(report, url))
    return
  }

  const headerName = parseContentDispositionFileName(
    response.headers.get('content-disposition') ?? '',
  )
  triggerBlobDownload(blob, headerName || reportFileName(report))
}

export const reportsService = {
  async listExports(): Promise<CompanyReport[]> {
    try {
      const { data } = await api.get<unknown>('/company/reports/exports')
      return unwrapReportList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load reports'))
    }
  },

  async exportReport(input: ReportExportInput): Promise<CompanyReport | null> {
    try {
      const { data } = await api.post<unknown>('/company/reports/export', {
        type: input.type,
        from: input.from,
        to: input.to,
      })
      return normalizeCompanyReport(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to export report'))
    }
  },

  async downloadReport(report: CompanyReport): Promise<void> {
    if (report.downloadUrl && looksLikeFileUrl(report.downloadUrl)) {
      triggerUrlDownload(report.downloadUrl, reportFileName(report, report.downloadUrl))
      return
    }

    try {
      await downloadFromApi(report)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to download report'))
    }
  },
}
