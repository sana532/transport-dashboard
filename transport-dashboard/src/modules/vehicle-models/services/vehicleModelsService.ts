import { api } from '@/services/api'
import type {
  CreateVehicleModelInput,
  ModelSeat,
  ModelSeatInput,
  ModelSeatType,
  UpdateVehicleModelInput,
  VehicleModel,
} from '@/modules/vehicle-models/types'
import { deriveModelSeatsFromLayout } from '@/modules/vehicle-models/utils/deriveModelSeats'
import { collectApiListItems } from '@/shared/utils/unwrapApiList'

type ApiValidationErrors = Record<string, string[]>

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return fallback
  }

  const response = (error as {
    response?: { status?: number; data?: { message?: string; errors?: ApiValidationErrors } }
  }).response

  if (response?.status === 401) {
    return 'Session expired or not signed in. Sign out, then log in again as a platform admin.'
  }

  const data = response?.data
  if (typeof data?.message === 'string' && data.message.trim()) {
    const message = data.message.trim()
    if (message.toLowerCase() === 'unauthenticated') {
      return 'Session expired or not signed in. Sign out, then log in again as a platform admin.'
    }
    return message
  }

  if (data?.errors) {
    const parts: string[] = []
    for (const [field, messages] of Object.entries(data.errors)) {
      if (Array.isArray(messages) && messages[0]) {
        parts.push(`${field}: ${messages[0]}`)
      }
    }
    if (parts.length) return parts.join(' ')
  }

  return fallback
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function pickImages(record: Record<string, unknown>): string[] | undefined {
  const images = record.images
  if (!Array.isArray(images)) return undefined
  const urls = images
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        return (
          pickString(obj, 'url') ??
          pickString(obj, 'path') ??
          (typeof obj.full_url === 'string' ? obj.full_url : undefined)
        )
      }
      return undefined
    })
    .filter((url): url is string => Boolean(url))
  return urls.length ? urls : undefined
}

function normalizeVehicleModel(raw: unknown): VehicleModel | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  const nameEn = pickString(record, 'name_en') ?? ''
  const nameAr = pickString(record, 'name_ar') ?? ''
  const legacyName = pickString(record, 'name') ?? ''
  const name = nameEn || nameAr || legacyName
  if (!name) return null

  const descriptionEn = pickString(record, 'description_en') ?? null
  const descriptionAr = pickString(record, 'description_ar') ?? null
  const legacyDescription = pickString(record, 'description') ?? null
  const description = descriptionEn ?? descriptionAr ?? legacyDescription

  const isActive =
    record.is_active === true ||
    record.is_active === 1 ||
    record.is_active === '1' ||
    record.is_active === 'true'

  const seatCountRaw = record.seat_count ?? record.model_seats_count
  const seatCount =
    typeof seatCountRaw === 'number'
      ? seatCountRaw
      : Number.isFinite(Number(seatCountRaw))
        ? Number(seatCountRaw)
        : null

  const vehiclesCountRaw = record.vehicles_count
  const vehiclesCount =
    typeof vehiclesCountRaw === 'number'
      ? vehiclesCountRaw
      : Number.isFinite(Number(vehiclesCountRaw))
        ? Number(vehiclesCountRaw)
        : null

  return {
    id,
    name,
    nameEn: nameEn || legacyName,
    nameAr: nameAr || legacyName,
    description,
    descriptionEn: descriptionEn ?? legacyDescription,
    descriptionAr: descriptionAr ?? legacyDescription,
    layout_config: record.layout_config,
    seat_count: seatCount,
    vehicles_count: vehiclesCount,
    is_active: isActive,
    image_urls: pickImages(record),
    created_at: pickString(record, 'created_at'),
  }
}

function unwrapList(payload: unknown): VehicleModel[] {
  const fromArray = (items: unknown[]) =>
    items.map(normalizeVehicleModel).filter((item): item is VehicleModel => item !== null)

  if (Array.isArray(payload)) return fromArray(payload)
  if (!payload || typeof payload !== 'object') return []

  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) return fromArray(root.data)

  if (root.data && typeof root.data === 'object') {
    const nested = root.data as Record<string, unknown>
    if (Array.isArray(nested.data)) return fromArray(nested.data)
  }

  return []
}

function unwrapOne(payload: unknown): VehicleModel | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data && typeof root.data === 'object') {
    return normalizeVehicleModel(root.data)
  }
  return normalizeVehicleModel(root)
}

function validateLayoutJson(layoutConfigJson: string): void {
  try {
    JSON.parse(layoutConfigJson)
  } catch {
    throw new Error('Layout config must be valid JSON')
  }
}

function buildVehicleModelFormData(
  input: CreateVehicleModelInput | UpdateVehicleModelInput,
  options?: { methodOverride?: 'PATCH' },
): FormData {
  const form = new FormData()
  if (options?.methodOverride) {
    form.append('_method', options.methodOverride)
  }

  const name = input.nameEn.trim() || input.nameAr.trim()
  const description = input.descriptionEn.trim() || input.descriptionAr.trim()

  // Platform API expects singular `name` / `description` (not *_en / *_ar).
  form.append('name', name)
  form.append('description', description)
  form.append('layout_config', input.layoutConfigJson.trim())
  form.append('is_active', input.isActive ? '1' : '0')
  input.images.forEach((file, index) => {
    form.append(`images[${index}]`, file)
  })
  return form
}

function fallbackModel(
  id: number,
  input: CreateVehicleModelInput | UpdateVehicleModelInput,
): VehicleModel {
  return {
    id,
    name: input.nameEn.trim() || input.nameAr.trim(),
    nameEn: input.nameEn.trim(),
    nameAr: input.nameAr.trim(),
    description: input.descriptionEn.trim() || input.descriptionAr.trim() || null,
    descriptionEn: input.descriptionEn.trim() || null,
    descriptionAr: input.descriptionAr.trim() || null,
    layout_config: JSON.parse(input.layoutConfigJson),
    is_active: input.isActive,
  }
}

const SEAT_TYPES = new Set<ModelSeatType>(['window', 'aisle', 'regular', 'extra legroom'])

function normalizeSeatType(value: unknown): ModelSeatType {
  if (typeof value === 'string' && SEAT_TYPES.has(value as ModelSeatType)) {
    return value as ModelSeatType
  }
  return 'regular'
}

function normalizeModelSeat(raw: unknown): ModelSeat | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const seatNumber =
    typeof record.seat_number === 'number' ? record.seat_number : Number(record.seat_number)
  const rowIndex =
    typeof record.row_index === 'number' ? record.row_index : Number(record.row_index)
  const columnIndex =
    typeof record.column_index === 'number' ? record.column_index : Number(record.column_index)

  if (!Number.isFinite(id) || !Number.isFinite(seatNumber)) return null
  if (!Number.isFinite(rowIndex) || !Number.isFinite(columnIndex)) return null

  const label =
    typeof record.label === 'string' && record.label.trim()
      ? record.label.trim()
      : String(seatNumber)

  const sortOrderRaw = record.sort_order
  const sort_order =
    typeof sortOrderRaw === 'number'
      ? sortOrderRaw
      : Number.isFinite(Number(sortOrderRaw))
        ? Number(sortOrderRaw)
        : undefined

  return {
    id,
    seat_number: seatNumber,
    row_index: rowIndex,
    column_index: columnIndex,
    seat_type: normalizeSeatType(record.seat_type),
    label,
    sort_order,
  }
}

function unwrapSeats(payload: unknown): ModelSeat[] {
  const items = collectApiListItems(payload)
  if (items.length > 0) {
    return items.map(normalizeModelSeat).filter((item): item is ModelSeat => item !== null)
  }
  if (Array.isArray(payload)) {
    return payload.map(normalizeModelSeat).filter((item): item is ModelSeat => item !== null)
  }
  if (payload && typeof payload === 'object') {
    const root = payload as Record<string, unknown>
    for (const key of ['model_seats', 'seats', 'data'] as const) {
      const nested = root[key]
      if (Array.isArray(nested)) {
        return nested.map(normalizeModelSeat).filter((item): item is ModelSeat => item !== null)
      }
    }
  }
  return []
}

function unwrapOneSeat(payload: unknown): ModelSeat | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return normalizeModelSeat(root.data)
  }
  return normalizeModelSeat(root)
}

export type SyncModelSeatsResult = {
  created: number
  skipped: number
  totalDesired: number
}

export const vehicleModelsService = {
  async listVehicleModels(): Promise<VehicleModel[]> {
    try {
      const { data } = await api.get<unknown>('/platform/vehicle-models')
      return unwrapList(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load vehicle models'))
    }
  },

  async getVehicleModel(id: number): Promise<VehicleModel> {
    try {
      const { data } = await api.get<unknown>(`/platform/vehicle-models/${id}`)
      const model = unwrapOne(data)
      if (!model) throw new Error('Vehicle model not found')
      return model
    } catch (error) {
      if (error instanceof Error && error.message === 'Vehicle model not found') throw error
      throw new Error(getApiErrorMessage(error, 'Failed to load vehicle model'))
    }
  },

  async createVehicleModel(input: CreateVehicleModelInput): Promise<VehicleModel> {
    validateLayoutJson(input.layoutConfigJson)

    try {
      const { data } = await api.post<unknown>(
        '/platform/vehicle-models',
        buildVehicleModelFormData(input),
      )
      const created = unwrapOne(data)
      if (created) return created
      return fallbackModel(Date.now(), input)
    } catch (error) {
      if (error instanceof Error && error.message === 'Layout config must be valid JSON') {
        throw error
      }
      throw new Error(getApiErrorMessage(error, 'Failed to create vehicle model'))
    }
  },

  async updateVehicleModel(id: number, input: UpdateVehicleModelInput): Promise<VehicleModel> {
    validateLayoutJson(input.layoutConfigJson)

    try {
      // Multipart updates: POST + _method=PATCH (Laravel-friendly, same as vehicles/drivers).
      const { data } = await api.post<unknown>(
        `/platform/vehicle-models/${id}`,
        buildVehicleModelFormData(input, { methodOverride: 'PATCH' }),
      )
      const updated = unwrapOne(data)
      if (updated) return updated
      return fallbackModel(id, input)
    } catch (error) {
      if (error instanceof Error && error.message === 'Layout config must be valid JSON') {
        throw error
      }
      throw new Error(getApiErrorMessage(error, 'Failed to update vehicle model'))
    }
  },

  async deleteVehicleModel(id: number): Promise<void> {
    try {
      await api.delete(`/platform/vehicle-models/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete vehicle model'))
    }
  },

  async listModelSeats(modelId: number): Promise<ModelSeat[]> {
    try {
      const { data } = await api.get<unknown>(`/platform/vehicle-models/${modelId}/model-seats`)
      return unwrapSeats(data)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load model seats'))
    }
  },

  async createModelSeat(modelId: number, input: ModelSeatInput): Promise<ModelSeat> {
    try {
      const body: Record<string, string | number> = {
        seat_number: input.seat_number,
        row_index: input.row_index,
        column_index: input.column_index,
        seat_type: input.seat_type,
        label: input.label,
      }
      if (input.sort_order != null) body.sort_order = input.sort_order

      const { data } = await api.post<unknown>(
        `/platform/vehicle-models/${modelId}/model-seats`,
        body,
      )
      const created = unwrapOneSeat(data)
      if (created) return created
      return { id: Date.now(), ...input }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create model seat'))
    }
  },

  /**
   * Creates seats derived from layout_config that are missing by seat_number.
   * Does not PATCH/DELETE existing seats.
   */
  async syncModelSeatsFromLayout(
    modelId: number,
    layoutConfigJson: string,
  ): Promise<SyncModelSeatsResult> {
    const desired = deriveModelSeatsFromLayout(layoutConfigJson)
    const existing = await this.listModelSeats(modelId)
    const existingNumbers = new Set(existing.map((seat) => seat.seat_number))

    let created = 0
    let skipped = 0

    for (const seat of desired) {
      if (existingNumbers.has(seat.seat_number)) {
        skipped += 1
        continue
      }
      await this.createModelSeat(modelId, seat)
      existingNumbers.add(seat.seat_number)
      created += 1
    }

    return { created, skipped, totalDesired: desired.length }
  },
}
