const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'
const APP_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path || typeof path !== 'string') return undefined
  const trimmed = path.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`

  let normalized = trimmed.replace(/^public\//, '')
  if (!normalized.startsWith('/')) normalized = `/${normalized}`
  if (
    !normalized.startsWith('/storage/') &&
    !normalized.startsWith('/uploads/') &&
    !normalized.startsWith('/images/') &&
    (normalized.includes('/vehicles') ||
      normalized.includes('/vehicle') ||
      normalized.includes('/photos') ||
      normalized.includes('/media'))
  ) {
    normalized = `/storage${normalized}`
  }

  return `${APP_ORIGIN}${normalized}`
}
