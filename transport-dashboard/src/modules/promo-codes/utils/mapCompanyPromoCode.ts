import type {
  CompanyPromoCode,
  PromoCodeConditions,
  PromoCodeInput,
  Weekday,
} from '@/modules/promo-codes/types'
import { isPromoExpired } from '@/modules/promo-codes/utils/promoCodeDates'

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function parseNumber(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : null
}

function parseBool(value: unknown): boolean {
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return true
}

function parseValidDays(raw: unknown): Weekday[] {
  if (!Array.isArray(raw)) return []
  const allowed = new Set<string>([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ])
  return raw
    .map((d) => (typeof d === 'string' ? d.toLowerCase() : ''))
    .filter((d): d is Weekday => allowed.has(d))
}

function parseConditions(record: Record<string, unknown>): PromoCodeConditions {
  const raw = record.conditions
  if (!raw || typeof raw !== 'object') {
    return { minTicketPrice: null, validDays: [] }
  }
  const c = raw as Record<string, unknown>
  return {
    minTicketPrice: parseNumber(c.min_ticket_price),
    validDays: parseValidDays(c.valid_days),
  }
}

export function normalizeCompanyPromoCode(raw: unknown): CompanyPromoCode | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  const code = pickString(record, 'code')
  const nameEn = pickString(record, 'name_en', 'name')
  if (!code && !nameEn) return null

  let routeName: string | null = null
  const routeIdRaw = record.route_id
  const routeId =
    routeIdRaw == null || routeIdRaw === ''
      ? null
      : Number.isFinite(Number(routeIdRaw))
        ? Number(routeIdRaw)
        : null
  if (record.route && typeof record.route === 'object') {
    const r = record.route as Record<string, unknown>
    routeName = pickString(r, 'name') || null
  }

  const typeRaw = pickString(record, 'type') || 'percentage'

  return {
    id,
    nameEn: nameEn || code,
    nameAr: pickString(record, 'name_ar') || nameEn || code,
    descriptionEn: pickString(record, 'description_en', 'description'),
    descriptionAr: pickString(record, 'description_ar'),
    code: code || `PROMO-${id}`,
    type: typeRaw,
    value: parseNumber(record.value) ?? 0,
    maxDiscountAmount: parseNumber(record.max_discount_amount),
    routeId,
    routeName,
    maxUses: parseNumber(record.max_uses),
    maxUsesPerUser: parseNumber(record.max_uses_per_user),
    conditions: parseConditions(record),
    validFrom: pickString(record, 'valid_from', 'starts_at') || '',
    validTo: pickString(record, 'valid_to', 'ends_at') || '',
    isActive: parseBool(record.is_active),
    usesCount: parseNumber(record.uses_count ?? record.used_count),
  }
}

export function promoDisplayName(promo: CompanyPromoCode, locale: string): string {
  return locale === 'ar' ? promo.nameAr : promo.nameEn
}

export function promoToInput(promo: CompanyPromoCode): PromoCodeInput {
  const conditions: PromoCodeInput['conditions'] = {}
  if (promo.conditions.validDays.length) {
    conditions.valid_days = promo.conditions.validDays
  }
  if (promo.conditions.minTicketPrice != null) {
    conditions.min_ticket_price = promo.conditions.minTicketPrice
  }

  return {
    name_en: promo.nameEn,
    name_ar: promo.nameAr,
    description_en: promo.descriptionEn,
    description_ar: promo.descriptionAr,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    max_discount_amount: promo.maxDiscountAmount,
    route_id: promo.routeId,
    max_uses: promo.maxUses,
    max_uses_per_user: promo.maxUsesPerUser,
    conditions,
    valid_from: promo.validFrom,
    valid_to: promo.validTo,
    is_active: promo.isActive,
  }
}

export function formatPromoValue(
  promo: CompanyPromoCode,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const type = promo.type.toLowerCase()
  if (type === 'percentage' || type === 'percent') {
    return t('promoCodes.valuePercent', { value: promo.value })
  }
  return t('promoCodes.valueFixed', { value: promo.value })
}

export function promoLifecycleStatus(
  promo: CompanyPromoCode,
): 'active' | 'inactive' | 'expired' {
  if (isPromoExpired(promo.validTo)) return 'expired'
  if (!promo.isActive) return 'inactive'
  return 'active'
}
