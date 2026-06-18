export type VehicleModel = {
  id: number
  name: string
  nameEn: string
  nameAr: string
  description?: string | null
  descriptionEn?: string | null
  descriptionAr?: string | null
  layout_config?: unknown
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
