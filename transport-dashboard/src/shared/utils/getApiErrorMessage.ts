import { i18n } from '@/shared/i18n/config'

type ApiValidationErrors = Record<string, string[] | string>

type ApiErrorBody = {
  message?: string
  error?: string
  errors?: ApiValidationErrors
}

type AxiosLikeError = {
  message?: string
  code?: string
  response?: {
    status?: number
    data?: ApiErrorBody
  }
  request?: unknown
}

const FIELD_LABEL_KEYS: Record<string, string> = {
  name: 'api.fields.name',
  name_en: 'api.fields.nameEn',
  name_ar: 'api.fields.nameAr',
  email: 'api.fields.email',
  phone: 'api.fields.phone',
  phone_number: 'api.fields.phone',
  password: 'api.fields.password',
  status: 'api.fields.status',
  route_id: 'api.fields.route',
  driver_id: 'api.fields.driver',
  vehicle_id: 'api.fields.vehicle',
  origin_station_id: 'api.fields.originStation',
  destination_station_id: 'api.fields.destinationStation',
  base_fare: 'api.fields.baseFare',
  estimated_duration_hhmm: 'api.fields.duration',
  departure_time: 'api.fields.departureTime',
  available_seats: 'api.fields.seats',
}

function tr(key: string, fallback: string, params?: Record<string, string | number>): string {
  const value = i18n.t(key, { defaultValue: fallback, ...(params ?? {}) })
  return typeof value === 'string' && value.trim() ? value : fallback
}

function normalizeFieldKey(field: string): string {
  return field.replace(/^\.+/, '').replace(/\[\d+\]/g, '').trim()
}

function fieldLabel(field: string): string {
  const key = normalizeFieldKey(field)
  const i18nKey = FIELD_LABEL_KEYS[key]
  if (i18nKey) return tr(i18nKey, key.replace(/_/g, ' '))
  return key.replace(/_/g, ' ')
}

function humanizeValidationItem(field: string, rawMessage: string): string {
  const label = fieldLabel(field)
  const msg = rawMessage.trim()
  const lower = msg.toLowerCase()

  if (lower.includes('required') || lower.includes('مطلوب')) {
    return tr('api.validation.required', '{{field}} is required.', { field: label })
  }
  if (lower.includes('already been taken') || lower.includes('already exists') || lower.includes('مستخدم')) {
    return tr('api.validation.taken', '{{field}} is already in use.', { field: label })
  }
  if (lower.includes('invalid') || lower.includes('must be') || lower.includes('غير صالح')) {
    return tr('api.validation.invalid', '{{field}} is invalid.', { field: label })
  }
  if (lower.includes('not found') || lower.includes('غير موجود')) {
    return tr('api.validation.notFound', '{{field}} was not found.', { field: label })
  }

  // Drop technical prefixes like ".name_en: ..."
  const cleaned = msg.replace(/^\.?[\w.]+\s*:\s*/i, '').trim() || msg
  return `${label}: ${cleaned}`
}

function formatValidationErrors(errors: ApiValidationErrors): string | null {
  const parts: string[] = []

  for (const [field, value] of Object.entries(errors)) {
    const messages = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
    for (const message of messages) {
      if (typeof message === 'string' && message.trim()) {
        parts.push(humanizeValidationItem(field, message))
      }
    }
  }

  return parts.length ? parts.join(' · ') : null
}

function isNetworkError(error: AxiosLikeError): boolean {
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') return true
  if (!error.response && error.request) return true
  const message = error.message?.toLowerCase() ?? ''
  return message.includes('network error') || message.includes('timeout')
}

/**
 * Turns Axios/API failures into short user-facing copy.
 * Logs the raw error for developers.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (import.meta.env.DEV) {
    console.warn('[API error]', error)
  }

  if (typeof error !== 'object' || error === null) {
    return fallback || tr('api.error.generic', 'Something went wrong. Please try again.')
  }

  const axiosError = error as AxiosLikeError
  const status = axiosError.response?.status
  const data = axiosError.response?.data

  if (isNetworkError(axiosError)) {
    return tr('api.error.network', 'No connection. Check your internet and try again.')
  }

  if (status === 401) {
    return tr('api.error.unauthorized', 'Your session expired. Please sign in again.')
  }

  if (status === 403) {
    return tr('api.error.forbidden', 'You do not have permission to do this.')
  }

  if (status === 404) {
    return tr('api.error.notFound', 'The requested item was not found.')
  }

  if (status === 409) {
    return tr('api.error.conflict', 'This action conflicts with existing data.')
  }

  if (status === 422 || status === 400) {
    if (data?.errors) {
      const validation = formatValidationErrors(data.errors)
      if (validation) return validation
    }
    if (typeof data?.message === 'string' && data.message.trim()) {
      // Prefer cleaned single message over raw technical text when possible
      const message = data.message.trim()
      if (!message.includes('{') && message.length < 180) return message
    }
    return tr('api.error.validation', 'Please check the form fields and try again.')
  }

  if (status != null && status >= 500) {
    return tr('api.error.server', 'The server is unavailable right now. Please try again later.')
  }

  if (data?.errors) {
    const validation = formatValidationErrors(data.errors)
    if (validation) return validation
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    const message = data.message.trim()
    // Avoid dumping long/technical payloads to the UI
    if (message.length <= 180 && !message.startsWith('{') && !message.includes('SQLSTATE')) {
      return message
    }
  }

  if (typeof data?.error === 'string' && data.error.trim() && data.error.length <= 180) {
    return data.error.trim()
  }

  return fallback || tr('api.error.generic', 'Something went wrong. Please try again.')
}
