import { Bus, CheckCircle2, Clock, Route, Wrench, type LucideIcon } from 'lucide-react'
import type { ID } from '@/shared/types'

export type VehicleId = ID

export type CompanyVehicleModel = {
  id: number
  name: string
  description?: string | null
  seat_count?: number
  layout_config?: unknown
  images?: string[]
  is_active?: boolean
}

export type CompanyVehicle = {
  id: number
  company_id: number
  vehicle_model_id: number
  plate_number: string
  color: string | null
  verified_status: string
  mechanical_status: string
  layout_config_snapshot?: unknown
  is_active: boolean
  photos: string[]
  vehicle_model?: CompanyVehicleModel | null
  created_at?: string
  updated_at?: string
}

export type VehicleCreateInput = {
  vehicle_model_id: number
  plate_number: string
  color?: string
  mechanical_status: string
  is_active: boolean
  photos?: File[]
}

export type VehicleUpdateInput = {
  vehicle_model_id?: number
  plate_number?: string
  color?: string
  mechanical_status?: string
  is_active?: boolean
  photos?: File[]
}

export type VehicleOperationalStatus = 'Available' | 'In Trip' | 'Maintenance'

export type Vehicle = {
  id: VehicleId
  code: string
  model: string
  plateNumber: string
  seats: number
  vehicleType: string
  status: VehicleOperationalStatus
  verifiedStatus: string
  mechanicalStatus: string
  isActive: boolean
  color: string | null
  vehicleModelId: number
  photoUrl?: string
  photoUrls?: string[]
  yearLabel: string
}

export type VehiclesStatVariant = 'primary' | 'info' | 'success' | 'warning'

export type VehiclesStatCard = {
  titleKey: string
  value: string
  noteKey: string
  trend: string
  variant: VehiclesStatVariant
  Icon: LucideIcon
}

export type VehiclesManagementData = {
  stats: VehiclesStatCard[]
  vehicles: Vehicle[]
}

export const VehiclesIcons = {
  Total: Bus,
  Available: CheckCircle2,
  InTrip: Route,
  Maintenance: Wrench,
  Pending: Clock,
} as const
