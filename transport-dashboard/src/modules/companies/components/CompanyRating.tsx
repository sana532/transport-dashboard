import type { PlatformCompany } from '@/modules/companies/types'
import { StarRating } from '@/shared/ui/StarRating'
import { useTranslation } from '@/shared/i18n/useTranslation'

type CompanyRatingProps = {
  averageRating?: number
  totalRatings?: number
  compact?: boolean
  className?: string
}

export function CompanyRating({
  averageRating,
  totalRatings,
  compact = false,
  className,
}: CompanyRatingProps) {
  const { t } = useTranslation()
  const count = totalRatings ?? 0

  return (
    <StarRating
      rating={averageRating}
      ratingCount={count}
      compact={compact}
      className={className}
      emptyLabel={t('admin.companies.noRating')}
      reviewsLabel={t('admin.companies.ratingCount', { count: String(count) })}
    />
  )
}
