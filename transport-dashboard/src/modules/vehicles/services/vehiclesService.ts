import { api } from '@/services/api'
import type {
  CompanyVehicle,
  CompanyVehicleModel,
  VehicleCreateInput,
  VehicleUpdateInput,
} from '@/modules/vehicles/types'
import { getApiErrorMessage } from '@/shared/utils/getApiErrorMessage'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'
import { pickMediaUrls } from '@/shared/utils/pickMediaUrls'
import { filterHiddenRecords, hideThenTry } from '@/shared/utils/hiddenRecords'

function parseSeatCountFromRecord(record: Record<string, unknown>): number | undefined {
  const direct = record.seat_count ?? record.capacity ?? record.total_seats ?? record.seats
  if (typeof direct === 'number' && Number.isFinite(direct) && direct > 0) return direct
  const asNumber = Number(direct)
  if (Number.isFinite(asNumber) && asNumber > 0) return asNumber

  const layoutRaw = record.layout_config ?? record.layout_config_snapshot
  const layout =
    typeof layoutRaw === 'string'
      ? (() => {
          try {
            return JSON.parse(layoutRaw) as unknown
          } catch {
            return null
          }
        })()
      : layoutRaw
  if (layout && typeof layout === 'object') {
    const lc = layout as Record<string, unknown>
    const fromLayout = lc.seat_count ?? lc.seatCount ?? lc.total_seats
    if (typeof fromLayout === 'number' && fromLayout > 0) return fromLayout
    const parsed = Number(fromLayout)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function normalizeVehicleModelRef(raw: unknown): CompanyVehicleModel | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const name = typeof record.name === 'string' ? record.name : ''
  if (!Number.isFinite(id) || !name) return null

  const images = pickMediaUrls(record.images)

  return {
    id,
    name,
    description: typeof record.description === 'string' ? record.description : null,
    seat_count: parseSeatCountFromRecord(record),
    layout_config: record.layout_config,
    images: images.length ? images : undefined,
    is_active: record.is_active === true || record.is_active === 1,
  }
}

export function normalizeCompanyVehicle(raw: unknown): CompanyVehicle | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const plate_number =
    typeof record.plate_number === 'string' ? record.plate_number.trim() : ''
  if (!Number.isFinite(id) || !plate_number) return null

  const is_active =
    record.is_active === true ||
    record.is_active === 1 ||
    record.is_active === '1' ||
    record.is_active === 'true'

  const statusRaw =
    typeof record.status === 'string' ? record.status.toLowerCase().replace(/-/g, '_') : ''
  const in_trip =
    record.in_trip === true ||
    record.is_on_trip === true ||
    record.on_trip === true ||
    record.in_trip === 1 ||
    record.in_trip === '1' ||
    record.in_trip === 'true' ||
    statusRaw === 'in_trip' ||
    statusRaw === 'on_trip'

  return {
    id,
    company_id: Number(record.company_id) || 0,
    vehicle_model_id: Number(record.vehicle_model_id) || 0,
    plate_number,
    color: typeof record.color === 'string' ? record.color : null,
    verified_status:
      typeof record.verified_status === 'string' ? record.verified_status : 'pending',
    mechanical_status:
      typeof record.mechanical_status === 'string' ? record.mechanical_status : 'operational',
    layout_config_snapshot: record.layout_config_snapshot,
    is_active,
    in_trip,
    photos: pickMediaUrls(
      record.photos,
      record.photo,
      record.media,
      record.images,
      { parentId: id, collection: 'photos' },
    ),
    vehicle_model: (() => {
      const model = normalizeVehicleModelRef(record.vehicle_model)
      const seatCount =
        model?.seat_count ?? parseSeatCountFromRecord(record)
      if (model) {
        return seatCount && !model.seat_count ? { ...model, seat_count: seatCount } : model
      }
      if (seatCount) {
        return {
          id: Number(record.vehicle_model_id) || 0,
          name: '',
          seat_count: seatCount,
        }
      }
      return null
    })(),
    created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : undefined,
  }
}

function unwrapList(payload: unknown): CompanyVehicle[] {
  const items = collectApiListItems(payload)
  const vehicles = items
    .map(normalizeCompanyVehicle)
    .filter((item): item is CompanyVehicle => item !== null)

  const seen = new Set<number>()
  return vehicles.filter((v) => {
    if (seen.has(v.id)) return false
    seen.add(v.id)
    return true
  })
}

function unwrapOne(payload: unknown): CompanyVehicle | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data) return normalizeCompanyVehicle(root.data)
  return normalizeCompanyVehicle(root)
}

export type CompanyVehiclesPage = {
  vehicles: CompanyVehicle[]
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number
  to: number
  counts: Record<string, unknown> | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function pickMetaNumber(meta: Record<string, unknown>, key: string): number | null {
  const value = Number(meta[key])
  return Number.isFinite(value) ? value : null
}

function readVehiclesPage(
  payload: unknown,
  fallbackPage: number,
  fallbackPerPage: number,
): CompanyVehiclesPage {
  const vehicles = unwrapList(payload)
  const root = asRecord(payload)
  const meta = asRecord(root?.meta) ?? root
  const counts = asRecord(root?.counts) ?? asRecord(meta?.counts)

  const currentPage = (meta ? pickMetaNumber(meta, 'current_page') : null) ?? fallbackPage
  const perPage = (meta ? pickMetaNumber(meta, 'per_page') : null) ?? fallbackPerPage
  const total = (meta ? pickMetaNumber(meta, 'total') : null) ?? vehicles.length
  const lastPage =
    (meta ? pickMetaNumber(meta, 'last_page') : null) ??
    Math.max(1, perPage > 0 ? Math.ceil(total / perPage) : 1)
  const from =
    (meta ? pickMetaNumber(meta, 'from') : null) ??
    (vehicles.length > 0 ? (currentPage - 1) * perPage + 1 : 0)
  const to =
    (meta ? pickMetaNumber(meta, 'to') : null) ??
    (vehicles.length > 0 ? from + vehicles.length - 1 : 0)

  return { vehicles, currentPage, lastPage, perPage, total, from, to, counts }
}

function buildVehicleFormData(input: VehicleCreateInput | VehicleUpdateInput): FormData {
  const form = new FormData()
  if (input.vehicle_model_id != null) {
    form.append('vehicle_model_id', String(input.vehicle_model_id))
  }
  if (input.plate_number != null) {
    form.append('plate_number', input.plate_number.trim())
  }
  if (input.color != null && input.color.trim()) {
    form.append('color', input.color.trim())
  }
  if (input.mechanical_status != null) {
    form.append('mechanical_status', input.mechanical_status)
  }
  if (input.is_active != null) {
    form.append('is_active', input.is_active ? '1' : '0')
  }
  input.photos?.forEach((file) => {
    form.append('photos[]', file)
  })
  return form
}

async function submitVehicleUpdate(id: number, input: VehicleUpdateInput): Promise<unknown> {
  const form = buildVehicleFormData(input)
  const hasPhotos = (input.photos?.length ?? 0) > 0

  if (hasPhotos) {
    form.append('_method', 'PATCH')
    const { data } = await api.post<unknown>(`/company/vehicles/${id}`, form)
    return data
  }

  const { data } = await api.patch<unknown>(`/company/vehicles/${id}`, form)
  return data
}

export const vehiclesService = {
  async listVehiclesPage(options?: { page?: number; perPage?: number }): Promise<CompanyVehiclesPage> {
    const page = Math.max(1, Math.floor(options?.page ?? 1))
    const perPage = Math.min(50, Math.max(1, Math.floor(options?.perPage ?? 15)))

    try {
      const { data } = await api.get<unknown>('/company/vehicles', {
        params: { page, per_page: perPage },
      })
      const result = readVehiclesPage(data, page, perPage)
      return {
        ...result,
        vehicles: filterHiddenRecords('vehicles', result.vehicles, (row) => [
          row.id,
          row.plate_number,
        ]),
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load vehicles'))
    }
  },

  async listVehicles(): Promise<CompanyVehicle[]> {
    try {
      const first = await this.listVehiclesPage({ page: 1, perPage: 15 })
      if (first.lastPage <= 1) return first.vehicles

      const remainingPages = Array.from(
        { length: first.lastPage - 1 },
        (_, index) => index + 2,
      )
      const rest = await Promise.all(
        remainingPages.map((page) => this.listVehiclesPage({ page, perPage: 15 })),
      )
      return first.vehicles.concat(...rest.map((item) => item.vehicles))
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load vehicles'))
    }
  },

  async createVehicle(input: VehicleCreateInput): Promise<CompanyVehicle> {
    try {
      const { data } = await api.post<unknown>('/company/vehicles', buildVehicleFormData(input))
      const created = unwrapOne(data)
      if (!created) throw new Error('Invalid response when creating vehicle')
      return created
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create vehicle'))
    }
  },

  async updateVehicle(id: number, input: VehicleUpdateInput): Promise<CompanyVehicle> {
    try {
      const data = await submitVehicleUpdate(id, input)
      const updated = unwrapOne(data)
      if (!updated) throw new Error('Invalid response when updating vehicle')
      return updated
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update vehicle'))
    }
  },

  async deleteVehicle(id: number): Promise<void> {
    await hideThenTry('vehicles', [id], async () => {
      await api.delete(`/company/vehicles/${id}`)
    })
  },
}
