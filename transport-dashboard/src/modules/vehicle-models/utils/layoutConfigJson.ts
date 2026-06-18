import { DEFAULT_LAYOUT_CONFIG_JSON } from '@/modules/vehicle-models/types'

export function layoutConfigToJson(layout: unknown): string {
  if (typeof layout === 'string' && layout.trim()) {
    try {
      return JSON.stringify(JSON.parse(layout), null, 2)
    } catch {
      return layout
    }
  }
  if (layout && typeof layout === 'object') {
    return JSON.stringify(layout, null, 2)
  }
  return DEFAULT_LAYOUT_CONFIG_JSON
}
