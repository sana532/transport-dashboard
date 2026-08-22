const SCHEDULE_TIME_ZONE = 'UTC'
const INSTANT_TIME_ZONE = 'Asia/Damascus'

function parseIsoParts(iso: string, timeZone: string) {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(parsed)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

/** Encode Syria wall-clock date/time as ISO (API stores local time with a Z suffix). */
export function combineScheduleDateTimeToIso(date: string, time: string): string | null {
  if (!date || !time) return null
  const [year, month, day] = date.split('-').map((value) => Number(value))
  const [hours, minutes] = time.split(':').map((value) => Number(value))
  if (![year, month, day, hours, minutes].every(Number.isFinite)) return null
  return new Date(Date.UTC(year, month - 1, day, hours, minutes)).toISOString()
}

export function splitScheduleIsoToFormFields(iso: string): { date: string; time: string } {
  const parts = parseIsoParts(iso, SCHEDULE_TIME_ZONE)
  if (!parts) return { date: '', time: '' }
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

/**
 * Trip / booking departure times are Syria wall-clock values. The API often
 * suffixes them with Z without converting to UTC, so we must not shift them
 * into the browser timezone (which would show +3h in Syria).
 */
export function formatScheduleDateTime(iso: string, locale: string): string {
  if (!iso.trim()) return '—'

  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: SCHEDULE_TIME_ZONE,
  }).format(parsed)
}

/** Real instants (created_at, booked_at, actual_departure_time) — Syria local time. */
export function formatInstantDateTime(iso: string, locale: string): string {
  if (!iso.trim()) return '—'

  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: INSTANT_TIME_ZONE,
  }).format(parsed)
}
