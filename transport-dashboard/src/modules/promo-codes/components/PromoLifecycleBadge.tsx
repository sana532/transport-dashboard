import { cn } from '@/shared/utils/cn'
import type { CompanyPromoCode } from '@/modules/promo-codes/types'
import { promoLifecycleStatus } from '@/modules/promo-codes/utils/mapCompanyPromoCode'
import { useTranslation } from '@/shared/i18n/useTranslation'

function badgeClass(status: ReturnType<typeof promoLifecycleStatus>): string {
  if (status === 'active') return 'bg-green-100 text-green-800'
  if (status === 'expired') return 'bg-amber-100 text-amber-900'
  return 'bg-surface-muted text-text-secondary'
}

type PromoLifecycleBadgeProps = {
  promo: CompanyPromoCode
}

export function PromoLifecycleBadge({ promo }: PromoLifecycleBadgeProps) {
  const { t } = useTranslation()
  const status = promoLifecycleStatus(promo)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeClass(status),
      )}
    >
      {t(`promoCodes.lifecycle.${status}`)}
    </span>
  )
}
