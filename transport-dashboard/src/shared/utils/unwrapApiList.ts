const LIST_KEYS = [
  'data',
  'notifications',
  'drivers',
  'vehicles',
  'trips',
  'bookings',
  'subscription_plans',
  'subscribers',
  'complaints',
  'complaint_categories',
  'promo_codes',
  'companies',
  'users',
  'items',
  'records',
  'results',
] as const

function isPaginator(record: Record<string, unknown>): boolean {
  return (
    'current_page' in record ||
    'per_page' in record ||
    ('total' in record && !('name' in record))
  )
}

function looksLikeResource(record: Record<string, unknown>): boolean {
  return (
    typeof record.name === 'string' ||
    typeof record.phone_number === 'string' ||
    typeof record.phone === 'string' ||
    typeof record.plate_number === 'string' ||
    typeof record.vehicle_model_id === 'number' ||
    typeof record.departure_time === 'string' ||
    typeof record.route_id === 'number' ||
    typeof record.trip_id === 'number' ||
    typeof record.booking_code === 'string' ||
    typeof record.passenger_name === 'string' ||
    typeof record.name_en === 'string' ||
    typeof record.code === 'string' ||
    typeof record.validity_days === 'number' ||
    typeof record.subscribed_at === 'string' ||
    typeof record.expires_at === 'string' ||
    typeof record.subscription_plan_id === 'number' ||
    typeof record.complaint_category_id === 'number' ||
    typeof record.complaint_code === 'string' ||
    record.complaint_category != null ||
    record.passenger != null ||
    (record.user != null && typeof record.user === 'object') ||
    record.driver_profile != null ||
    record.vehicle_model != null
  )
}

/**
 * Collects list items from common Laravel / API envelope shapes.
 */
export function collectApiListItems(payload: unknown, maxDepth = 8): unknown[] {
  const items: unknown[] = []
  const visited = new Set<unknown>()

  const walk = (node: unknown, depth: number) => {
    if (node == null || depth > maxDepth) return
    if (visited.has(node)) return
    visited.add(node)

    if (Array.isArray(node)) {
      for (const entry of node) {
        if (entry != null && typeof entry === 'object') items.push(entry)
      }
      return
    }

    if (typeof node !== 'object') return
    const record = node as Record<string, unknown>

    if (isPaginator(record)) {
      for (const key of LIST_KEYS) {
        const nested = record[key]
        if (Array.isArray(nested)) walk(nested, depth + 1)
      }
      return
    }

    for (const key of LIST_KEYS) {
      const nested = record[key]
      if (Array.isArray(nested)) {
        walk(nested, depth + 1)
        return
      }
      if (nested != null && typeof nested === 'object' && looksLikeResource(nested as Record<string, unknown>)) {
        walk(nested, depth + 1)
        return
      }
    }

    if (looksLikeResource(record)) {
      items.push(record)
    }
  }

  walk(payload, 0)
  return items
}
