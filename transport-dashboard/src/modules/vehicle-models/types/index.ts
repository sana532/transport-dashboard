export type VehicleModel = {
  id: number
  name: string
  nameEn: string
  nameAr: string
  description?: string | null
  descriptionEn?: string | null
  descriptionAr?: string | null
  layout_config?: unknown
  seat_count?: number | null
  vehicles_count?: number | null
  is_active: boolean
  image_urls?: string[]
  created_at?: string
}

export type VehicleModelFormInput = {
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  layoutConfigJson: string
  isActive: boolean
  images: File[]
}

export type CreateVehicleModelInput = VehicleModelFormInput
export type UpdateVehicleModelInput = VehicleModelFormInput

/** Matches platform model-seats API (`seat_type`). */
export type ModelSeatType = 'window' | 'aisle' | 'regular' | 'extra legroom'

export type ModelSeatInput = {
  seat_number: number
  row_index: number
  column_index: number
  seat_type: ModelSeatType
  label: string
  sort_order?: number
}

export type ModelSeat = ModelSeatInput & {
  id: number
}

export const DEFAULT_LAYOUT_CONFIG_JSON = `{
  "layout_type": "2x2",
  "grid": {
    "columns": 5,
    "rows": 6
  },
  "static_elements": [
    {
      "type": "aisle",
      "column": 3,
      "row_start": 1,
      "row_end": 5,
      "label": ""
    }
  ]
}`
