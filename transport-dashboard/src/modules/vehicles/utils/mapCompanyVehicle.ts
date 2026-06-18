import type { CompanyVehicle, Vehicle, VehicleOperationalStatus } from '@/modules/vehicles/types'
import { pickMediaUrls } from '@/shared/utils/pickMediaUrls'

function yearFromIso(iso: string | undefined): string {
  if (!iso) return '—'
  const y = new Date(iso).getFullYear()
  return Number.isFinite(y) ? String(y) : '—'
}

export function mapMechanicalToStatus(
  mechanicalStatus: string,
  isActive: boolean,
): VehicleOperationalStatus {
  if (!isActive) return 'Maintenance'
  const key = mechanicalStatus.toLowerCase()
  if (key === 'maintenance' || key === 'out_of_service' || key === 'inactive') {
    return 'Maintenance'
  }
  return 'Available'
}

export function mapCompanyVehicleToVehicle(row: CompanyVehicle): Vehicle {
  const modelName = row.vehicle_model?.name ?? `Model #${row.vehicle_model_id}`
  const seats = row.vehicle_model?.seat_count ?? 0
  const photoUrls = [
    ...row.photos,
    ...pickMediaUrls(row.vehicle_model?.images, row.vehicle_model, {
      parentId: row.id,
      collection: 'photos',
    }),
  ].filter((url, index, arr) => arr.indexOf(url) === index)

  return {
    id: String(row.id),
    code: `VH-${String(row.id).padStart(3, '0')}`,
    model: modelName,
    plateNumber: row.plate_number,
    seats,
    vehicleType: modelName,
    status: mapMechanicalToStatus(row.mechanical_status, row.is_active),
    verifiedStatus: row.verified_status,
    mechanicalStatus: row.mechanical_status,
    isActive: row.is_active,
    color: row.color,
    vehicleModelId: row.vehicle_model_id,
    photoUrl: photoUrls[0],
    photoUrls,
    yearLabel: yearFromIso(row.created_at),
  }
}
