function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeInputValue(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Default start: today 00:00 */
export function defaultValidFromParts(): { date: string; time: string } {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return { date: toDateInputValue(d), time: '00:00' }
}

/** Default end: +30 days 23:59 */
export function defaultValidToParts(): { date: string; time: string } {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  d.setHours(23, 59, 0, 0)
  return { date: toDateInputValue(d), time: '23:59' }
}

export function splitApiDateTime(apiValue: string): { date: string; time: string } {
  if (!apiValue?.trim()) return { date: '', time: '00:00' }

  const trimmed = apiValue.trim()
  const iso = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  const parsed = new Date(iso)

  if (!Number.isNaN(parsed.getTime())) {
    return { date: toDateInputValue(parsed), time: toTimeInputValue(parsed) }
  }

  const [datePart, timePart] = trimmed.split(/\s+/)
  const date = datePart?.slice(0, 10) ?? ''
  const time = timePart?.slice(0, 5) ?? '00:00'
  return { date, time: /^\d{2}:\d{2}/.test(time) ? time : '00:00' }
}

export function combineDateAndTime(date: string, time: string): string {
  if (!date.trim()) return ''
  const safeTime = time.trim() && /^\d{2}:\d{2}/.test(time.trim()) ? time.trim() : '00:00'
  return `${date.trim()}T${safeTime}`
}

/** API format: `2026-05-25 00:00:00` */
export function toApiDateTime(localValue: string): string {
  if (!localValue) return ''
  const normalized = localValue.includes('T') ? localValue : localValue.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return localValue.replace('T', ' ').slice(0, 19)
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatPromoDate(apiValue: string, locale: string): string {
  if (!apiValue) return '—'
  const normalized = apiValue.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return apiValue
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function isPromoExpired(validTo: string): boolean {
  if (!validTo) return false
  const end = new Date(validTo.replace(' ', 'T'))
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now()
}
