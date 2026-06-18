import { api } from '@/services/api'
import type {
  CreateVehicleModelInput,
  UpdateVehicleModelInput,
  VehicleModel,
} from '@/modules/vehicle-models/types'

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

  const isActive =
    record.is_active === true ||
    record.is_active === 1 ||
    record.is_active === '1' ||
    record.is_active === 'true'

  return {
    id,
    name,
    nameEn: nameEn || legacyName,
    nameAr: nameAr || legacyName,
    description: descriptionEn ?? descriptionAr ?? legacyDescription,
    descriptionEn,
    descriptionAr,
    layout_config: record.layout_config,
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

function buildVehicleModelFormData(input: CreateVehicleModelInput | UpdateVehicleModelInput): FormData {
  const form = new FormData()
  form.append('name_en', input.nameEn.trim())
  form.append('name_ar', input.nameAr.trim())
  form.append('description_en', input.descriptionEn.trim())
  form.append('description_ar', input.descriptionAr.trim())
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
      const { data } = await api.patch<unknown>(
        `/platform/vehicle-models/${id}`,
        buildVehicleModelFormData(input),
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
}
