import type { CompanyReport, ReportStatus } from '@/modules/reports/types'
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl'

function asRecordOrJson(value: unknown): Record<string, unknown> | null {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return null
    }
  }
  return null
}

export function looksLikeFileUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false
  return (
    /\.(xlsx|xls|csv|pdf|zip|ods)(?:$|\?)/i.test(value) ||
    /r2\.cloudflarestorage|amazonaws\.com|s3\.|\/storage\/|\/exports\//i.test(value)
  )
}

export function findHttpsFileUrl(value: unknown, depth = 0): string | null {
  if (value == null || depth > 8) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return looksLikeFileUrl(trimmed) ? trimmed : null
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findHttpsFileUrl(item, depth + 1)
      if (found) return found
    }
    return null
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const found = findHttpsFileUrl(nested, depth + 1)
      if (found) return found
    }
  }
  return null
}

export function fileNameFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname
    const name = decodeURIComponent(path.split('/').pop() || '')
    return name.includes('.') ? name : null
  } catch {
    return null
  }
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const raw = record[key]
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  }
  return ''
}

function pickId(record: Record<string, unknown>): number | null {
  const raw = record.id
  const id = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(id) ? id : null
}

function dateOnly(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value)
  return match?.[1] ?? value
}

function nestedBags(record: Record<string, unknown>): Record<string, unknown>[] {
  return [
    record,
    asRecordOrJson(record.filters),
    asRecordOrJson(record.parameters),
    asRecordOrJson(record.payload),
    asRecordOrJson(record.meta),
    asRecordOrJson(record.file),
    asRecordOrJson(record.period),
    asRecordOrJson(record.date_range),
    asRecordOrJson(record.request),
    asRecordOrJson(record.input),
    asRecordOrJson(record.query),
  ].filter((item): item is Record<string, unknown> => item != null)
}

function pickFromBags(record: Record<string, unknown>, keys: string[]): string {
  for (const bag of nestedBags(record)) {
    const value = pickString(bag, ...keys)
    if (value) return value
  }
  return ''
}

function looksLikeFileRef(value: string): boolean {
  return (
    looksLikeFileUrl(value) ||
    /\.(xlsx|xls|csv|pdf|zip|ods)(?:$|\?)/i.test(value) ||
    /\/storage\/|reports\/|exports\//i.test(value)
  )
}

function pickFileRef(record: Record<string, unknown>): string {
  const direct = pickFromBags(record, [
    'download_url',
    'signed_url',
    'temporary_url',
    'file_url',
    'file_path',
    'stored_path',
    'disk_path',
    'link',
  ])
  if (direct) return direct

  const path = pickFromBags(record, ['path'])
  if (path && looksLikeFileRef(path)) return path

  const url = pickFromBags(record, ['url'])
  if (url && looksLikeFileRef(url)) return url

  return findHttpsFileUrl(record) ?? ''
}

export function resolveReportFileUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:')) return trimmed

  const resolved = resolveMediaUrl(trimmed)
  if (resolved && /^https?:\/\//i.test(resolved)) {
    if (trimmed.startsWith('/storage/') || trimmed.includes('/storage/')) return resolved
    if (/\.(xlsx|xls|csv|pdf|zip|ods)(?:$|\?)/i.test(trimmed)) {
      const storagePath = trimmed.startsWith('/') ? `/storage${trimmed}` : `/storage/${trimmed}`
      return resolveMediaUrl(storagePath) ?? resolved
    }
    return resolved
  }

  const normalized = trimmed.replace(/^public\//, '').replace(/^\//, '')
  return resolveMediaUrl(`/storage/${normalized}`) ?? null
}

export function unwrapReportPayload(payload: unknown): unknown {
  const root = asRecordOrJson(payload)
  if (!root) return payload
  if ('id' in root || 'type' in root || 'status' in root) return root
  const data = root.data
  if (data != null) return data
  return payload
}

export function extractDownloadUrl(payload: unknown): string | null {
  const deep = findHttpsFileUrl(payload)
  if (deep) return deep

  const record = asRecordOrJson(unwrapReportPayload(payload)) ?? asRecordOrJson(payload)
  if (!record) return null
  const ref = pickFileRef(record)
  return resolveReportFileUrl(ref)
}

function normalizeStatus(raw: string): ReportStatus {
  const value = raw.toLowerCase().replace(/[\s-]+/g, '_')
  if (value === 'completed' || value === 'ready' || value === 'done' || value === 'success') {
    return 'completed'
  }
  if (value === 'failed' || value === 'error') return 'failed'
  if (value === 'processing' || value === 'generating' || value === 'running') {
    return 'processing'
  }
  return 'pending'
}

export function normalizeCompanyReport(raw: unknown): CompanyReport | null {
  const record = asRecordOrJson(unwrapReportPayload(raw)) ?? asRecordOrJson(raw)
  if (!record) return null

  const id = pickId(record)
  if (id == null) return null

  const downloadUrl = extractDownloadUrl(record)
  const type = pickFromBags(record, ['type', 'report_type', 'kind']) || 'bookings'
  const status = normalizeStatus(pickFromBags(record, ['status', 'state']) || 'pending')
  const from = dateOnly(pickFromBags(record, ['from', 'date_from', 'from_date', 'start_date', 'period_from']))
  const to = dateOnly(pickFromBags(record, ['to', 'date_to', 'to_date', 'end_date', 'period_to']))
  const fileName =
    pickFromBags(record, ['file_name', 'filename', 'original_name', 'stored_name']) ||
    (downloadUrl ? fileNameFromUrl(downloadUrl) : '') ||
    `report-${id}`

  return {
    id,
    type,
    status,
    from,
    to,
    fileName,
    createdAt: pickFromBags(record, ['created_at', 'generated_at', 'exported_at']),
    downloadUrl,
    canDownload: status === 'completed' || Boolean(downloadUrl),
  }
}

export function isReportInProgress(report: CompanyReport): boolean {
  return report.status === 'pending' || report.status === 'processing'
}
