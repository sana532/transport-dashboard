import type { CompanyPromoCode, PromoCodesManagementData } from '@/modules/promo-codes/types'
import { promoLifecycleStatus } from '@/modules/promo-codes/utils/mapCompanyPromoCode'

export function buildPromoStats(promos: CompanyPromoCode[]): PromoCodesManagementData['stats'] {
  const active = promos.filter((p) => promoLifecycleStatus(p) === 'active').length
  const expired = promos.filter((p) => promoLifecycleStatus(p) === 'expired').length
  const inactive = promos.filter((p) => promoLifecycleStatus(p) === 'inactive').length

  return [
    {
      id: 'stat-total',
      titleKey: 'promoCodes.stats.total',
      value: String(promos.length),
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
