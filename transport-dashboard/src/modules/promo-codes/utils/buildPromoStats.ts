import type { CompanyPromoCode, PromoCodesManagementData } from '@/modules/promo-codes/types'
import { promoLifecycleStatus } from '@/modules/promo-codes/utils/mapCompanyPromoCode'

function pickCount(counts: Record<string, unknown> | null | undefined, ...keys: string[]): number | undefined {
  if (!counts) return undefined
  for (const key of keys) {
    const value = counts[key]
    if (value == null || value === '') continue
    const n = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export function buildPromoStats(
  promos: CompanyPromoCode[],
  counts?: Record<string, unknown> | null,
): PromoCodesManagementData['stats'] {
  const totalLocal = promos.length
  const activeLocal = promos.filter((p) => promoLifecycleStatus(p) === 'active').length
  const expiredLocal = promos.filter((p) => promoLifecycleStatus(p) === 'expired').length
  const inactiveLocal = promos.filter((p) => promoLifecycleStatus(p) === 'inactive').length

  const total = pickCount(counts, 'total') ?? totalLocal
  const active = pickCount(counts, 'active') ?? activeLocal
  const expired = pickCount(counts, 'expired') ?? expiredLocal
  const inactive =
    pickCount(counts, 'inactive') ??
    (counts ? Math.max(0, total - active - expired) : inactiveLocal)

  return [
    {
      id: 'stat-total',
      titleKey: 'promoCodes.stats.total',
      value: String(total),
      variant: 'primary',
    },
    {
      id: 'stat-active',
      titleKey: 'promoCodes.stats.active',
      value: String(active),
      variant: 'success',
    },
    {
      id: 'stat-expired',
      titleKey: 'promoCodes.stats.expired',
      value: String(expired),
      variant: 'warning',
    },
    {
      id: 'stat-inactive',
      titleKey: 'promoCodes.stats.inactive',
      value: String(inactive),
      variant: 'info',
    },
  ]
}
