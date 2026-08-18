export function formatWeeklyCount(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatWeeklyMoney(value: number, currency: string): string {
  return `${formatWeeklyCount(value)} ${currency}`
}

export function formatWeeklyPct(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return `${formatWeeklyCount(rounded)}%`
}

export function formatWeeklyChange(changePct: number): {
  label: string
  tone: 'up' | 'down'
} {
  const rounded = Math.round(changePct * 10) / 10
  const sign = rounded >= 0 ? '+' : ''
  const arrow = rounded >= 0 ? '▲' : '▼'
  return {
    label: `${arrow} ${sign}${formatWeeklyCount(rounded)}%`,
    tone: rounded >= 0 ? 'up' : 'down',
  }
}

export function formatWeeklyDate(isoDate: string, locale: string): string {
  if (!isoDate.trim()) return ''
  const parts = isoDate.split('-').map(Number)
  if (parts.length < 3 || parts.some((part) => !Number.isFinite(part))) return isoDate
  const [year, month, day] = parts
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

/** Gauge width from a 0–1 fraction, or a 0–100 percent if fraction is missing. */
export function gaugeWidthFromRate(rate: number | null, ratePct: number | null): number {
  if (rate != null) return Math.max(0, Math.min(100, rate * 100))
  if (ratePct != null) return Math.max(0, Math.min(100, ratePct))
  return 0
}

export function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value))
}
