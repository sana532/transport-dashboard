import type {
  CompanySubscriptionPlan,
  PlanTheme,
  SubscriptionPlanCard,
  SubscriptionPlanInput,
  SubscriptionPlanType,
} from '@/modules/subscription-packages/types'

const PLAN_THEMES: PlanTheme[] = ['sky', 'emerald', 'violet', 'amber', 'indigo', 'slate']

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function parseBool(value: unknown): boolean {
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return true
}

function parsePlanType(raw: unknown): SubscriptionPlanType {
  const key = typeof raw === 'string' ? raw.toLowerCase() : ''
  if (key === 'discount_pass' || key === 'discount') return 'discount_pass'
  return 'multi_trip'
}

function parseNumber(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : null
}

function parseConditions(record: Record<string, unknown>): number | null {
  const conditions = record.conditions
  if (!conditions || typeof conditions !== 'object') return null
  const max = (conditions as Record<string, unknown>).max_tickets_per_trip
  const n = typeof max === 'number' ? max : Number(max)
  return Number.isFinite(n) ? n : null
}

function parseSubscriberCount(record: Record<string, unknown>): number {
  const raw =
    record.active_subscribers_count ??
    record.active_subscribers ??
    record.subscribers_count ??
    record.subscribers_total ??
    record.subscribers
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function normalizeCompanySubscriptionPlan(raw: unknown): CompanySubscriptionPlan | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  const nameEn = pickString(record, 'name_en', 'name')
  const nameAr = pickString(record, 'name_ar') || nameEn
  if (!nameEn && !nameAr) return null

  const type = parsePlanType(record.type)
  const price = parseNumber(record.price) ?? 0
  const validityDays = parseNumber(record.validity_days) ?? 30

  return {
    id,
    nameEn: nameEn || nameAr,
    nameAr: nameAr || nameEn,
    descriptionEn: pickString(record, 'description_en', 'description'),
    descriptionAr: pickString(record, 'description_ar') || pickString(record, 'description_en', 'description'),
    price,
    type,
    discountPercentage: parseNumber(record.discount_percentage),
    totalTrips: parseNumber(record.total_trips),
    validityDays: Math.max(1, Math.floor(validityDays)),
    maxTicketsPerTrip: parseConditions(record),
    isActive: parseBool(record.is_active),
    activeSubscribers: parseSubscriberCount(record),
  }
}

export function planDisplayName(plan: CompanySubscriptionPlan, locale: string): string {
  return locale === 'ar' ? plan.nameAr : plan.nameEn
}

export function buildPlanFeatureLines(
  plan: CompanySubscriptionPlan,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string[] {
  const lines: string[] = []
  lines.push(
    t('packages.feature.validityDays', { days: plan.validityDays }),
  )
  if (plan.type === 'multi_trip' && plan.totalTrips != null) {
    lines.push(t('packages.feature.totalTrips', { count: plan.totalTrips }))
  }
  if (plan.type === 'discount_pass' && plan.discountPercentage != null) {
    lines.push(
      t('packages.feature.discountPercent', { percent: plan.discountPercentage }),
    )
  }
  if (plan.maxTicketsPerTrip != null) {
    lines.push(
      t('packages.feature.maxTicketsPerTrip', { count: plan.maxTicketsPerTrip }),
    )
  }
  const description = plan.descriptionEn || plan.descriptionAr
  if (description) lines.push(description)
  return lines.filter(Boolean)
}

export function formatPlanPrice(price: number, locale: string, validityDays: number): string {
  const amount = new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : 'en-US', {
    style: 'currency',
    currency: 'SYP',
    maximumFractionDigits: 0,
  }).format(price)
  return `${amount} / ${validityDays}d`
}

export function mapPlanToCard(
  plan: CompanySubscriptionPlan,
  locale: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): SubscriptionPlanCard {
  const billing = plan.validityDays >= 365 ? 'yearly' : 'monthly'
  return {
    id: String(plan.id),
    name: planDisplayName(plan, locale),
    billing,
    status: plan.isActive ? 'active' : 'inactive',
    price: plan.price,
    priceDisplay: formatPlanPrice(plan.price, locale, plan.validityDays),
    theme: PLAN_THEMES[plan.id % PLAN_THEMES.length],
    features: buildPlanFeatureLines(plan, t),
    activeSubscribers: plan.activeSubscribers,
    isPopular: plan.type === 'multi_trip' && (plan.totalTrips ?? 0) >= 10,
    savingsNote:
      plan.type === 'discount_pass' && plan.discountPercentage != null
        ? t('packages.savingsDiscount', { percent: plan.discountPercentage })
        : undefined,
  }
}

export function planToInput(plan: CompanySubscriptionPlan): SubscriptionPlanInput {
  return {
    name_en: plan.nameEn,
    name_ar: plan.nameAr,
    description_en: plan.descriptionEn,
    description_ar: plan.descriptionAr,
    price: plan.price,
    type: plan.type,
    discount_percentage: plan.type === 'discount_pass' ? plan.discountPercentage : null,
    total_trips: plan.type === 'multi_trip' ? plan.totalTrips : null,
    validity_days: plan.validityDays,
    conditions: {
      max_tickets_per_trip: plan.maxTicketsPerTrip ?? 1,
    },
    is_active: plan.isActive,
  }
}
