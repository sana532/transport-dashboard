import type { CompanyPromoCode } from '@/modules/promo-codes/types'
import { promoLifecycleStatus } from '@/modules/promo-codes/utils/mapCompanyPromoCode'

export type PromoListFilters = {
  search: string
  status: 'all' | 'active' | 'inactive' | 'expired'
}

export const defaultPromoListFilters: PromoListFilters = {
  search: '',
  status: 'all',
}

export function filterPromoCodes(
  promos: CompanyPromoCode[],
  filters: PromoListFilters,
): CompanyPromoCode[] {
  const q = filters.search.trim().toLowerCase()
  return promos.filter((promo) => {
    const lifecycle = promoLifecycleStatus(promo)
    if (filters.status !== 'all' && lifecycle !== filters.status) return false
    if (!q) return true
    const haystack = [
      promo.code,
      promo.nameEn,
      promo.nameAr,
      promo.routeName ?? '',
      String(promo.id),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
