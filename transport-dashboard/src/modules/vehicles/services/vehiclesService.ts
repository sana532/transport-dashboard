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

function normalizeVehicleModelRef(raw: unknown): CompanyVehicleModel | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  const name = typeof record.name === 'string' ? record.name : ''
  if (!Number.isFinite(id) || !name) return null

  const seat_count =
    typeof record.seat_count === 'number'
      ? record.seat_count
      : Number(record.seat_count) || undefined

  const images = pickMediaUrls(record.images)

  return {
    id,
    name,
    description: typeof record.description === 'string' ? record.description : null,
    seat_count,
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
    photos: pickMediaUrls(
      record.photos,
      record.photo,
      record.media,
      record.images,
      { parentId: id, collection: 'photos' },
    ),
    vehicle_model: normalizeVehicleModelRef(record.vehicle_model),
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
  async listVehicles(): Promise<CompanyVehicle[]> {
    try {
      const { data } = await api.get<unknown>('/company/vehicles')
      return unwrapList(data)
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
    try {
      await api.delete(`/company/vehicles/${id}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete vehicle'))
    }
  },
}
