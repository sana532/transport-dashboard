import { api } from '@/services/api'
import type { CompanyVehicleModel } from '@/modules/vehicles/types'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'
import { pickMediaUrls } from '@/shared/utils/pickMediaUrls'

function parseIsActive(record: Record<string, unknown>): boolean {
  const value = record.is_active
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  if (value === true || value === 1 || value === '1' || value === 'true') return true
  return true
}

function parseSeatCount(record: Record<string, unknown>): number | undefined {
  if (typeof record.seat_count === 'number') return record.seat_count
  const n = Number(record.seat_count)
  if (Number.isFinite(n) && n > 0) return n

  const layout = record.layout_config
  if (layout && typeof layout === 'object') {
    const lc = layout as Record<string, unknown>
    const fromLayout = lc.seat_count ?? lc.seatCount ?? lc.total_seats
    if (typeof fromLayout === 'number' && fromLayout > 0) return fromLayout
    const parsed = Number(fromLayout)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function normalizeModel(raw: unknown): CompanyVehicleModel | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const name =
    (typeof record.name_en === 'string' && record.name_en.trim()) ||
    (typeof record.name_ar === 'string' && record.name_ar.trim()) ||
    (typeof record.name === 'string' && record.name.trim()) ||
    ''
  if (!Number.isFinite(id) || !name) return null

  const images = pickMediaUrls(record.images)

  return {
    id,
    name,
    description:
      (typeof record.description_en === 'string' && record.description_en) ||
      (typeof record.description_ar === 'string' && record.description_ar) ||
      (typeof record.description === 'string' ? record.description : null),
    seat_count: parseSeatCount(record),
    layout_config: record.layout_config,
    images: images.length ? images : undefined,
    is_active: parseIsActive(record),
  }
}

function unwrapModels(payload: unknown): CompanyVehicleModel[] {
  const items = collectApiListItems(payload)
  if (items.length > 0) {
    return items
      .map(normalizeModel)
      .filter((item): item is CompanyVehicleModel => item !== null)
  }

  if (Array.isArray(payload)) {
    return payload
      .map(normalizeModel)
      .filter((item): item is CompanyVehicleModel => item !== null)
  }

  if (!payload || typeof payload !== 'object') return []

  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) {
    return root.data
      .map(normalizeModel)
      .filter((item): item is CompanyVehicleModel => item !== null)
  }

  const single = normalizeModel(root.data ?? root)
  return single ? [single] : []
}

function buildCatalogPath(basePath: string, search?: string): string {
  const q = search?.trim()
  if (!q) return basePath
  return `${basePath}?search=${encodeURIComponent(q)}`
}

function mergeModels(sources: CompanyVehicleModel[][]): CompanyVehicleModel[] {
  const byId = new Map<number, CompanyVehicleModel>()
  for (const list of sources) {
    for (const model of list) {
      byId.set(model.id, model)
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

type CatalogFetchResult = {
  path: string
  models: CompanyVehicleModel[]
  error?: string
  status?: number
}

/**
 * Company reads the platform catalog created by admin.
 * Admin writes: POST /api/platform/vehicle-models
 * Company should read one of these (confirm with backend — Postman company collection has empty vehicle-models index).
 */
const COMPANY_CATALOG_PATHS = ['/vehicle-models', '/company/vehicle-models'] as const

async function fetchCatalog(path: string): Promise<CatalogFetchResult> {
  try {
    const { data } = await api.get<unknown>(path)
    return { path, models: unwrapModels(data) }
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined
    return {
      path,
      models: [],
      status,
      error: getApiErrorMessage(error, `Failed to load ${path}`),
    }
  }
}

export type CompanyVehicleModelsQuery = {
  search?: string
  /** When true, include models with is_active false (default: active only). */
  includeInactive?: boolean
}

export type CompanyVehicleModelsResult = {
  models: CompanyVehicleModel[]
  /** Last path that returned data, for debugging. */
  sourcePath?: string
  /** Hints when catalog is empty (e.g. wrong URL or 403). */
  diagnostics?: string
}

export const companyVehicleModelsService = {
  async listForCompany(query?: CompanyVehicleModelsQuery): Promise<CompanyVehicleModel[]> {
    const result = await this.listForCompanyWithMeta(query)
    return result.models
  },

  async listForCompanyWithMeta(
    query?: CompanyVehicleModelsQuery,
  ): Promise<CompanyVehicleModelsResult> {
    const attempts: CatalogFetchResult[] = []

    for (const basePath of COMPANY_CATALOG_PATHS) {
      const path = buildCatalogPath(basePath, query?.search)
      attempts.push(await fetchCatalog(path))
    }

    const successful = attempts.filter((a) => a.models.length > 0)
    let models = mergeModels(successful.map((a) => a.models))

    if (!query?.includeInactive) {
      models = models.filter((m) => m.is_active)
    }

    const sourcePath = successful[0]?.path

    let diagnostics: string | undefined
    if (models.length === 0) {
      const hints = attempts
        .map((a) => {
          if (a.status === 403) return `${a.path} → forbidden (use company token, not platform admin)`
          if (a.status === 404) return `${a.path} → not found`
          if (a.error) return `${a.path} → ${a.error}`
          return `${a.path} → empty list`
        })
        .join('; ')
      diagnostics = hints
      if (import.meta.env.DEV) {
        console.warn('[vehicle-models] Company catalog empty:', hints)
      }
    }

    return { models, sourcePath, diagnostics }
  },
}
