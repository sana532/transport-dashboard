import { StarRating, hasStarRating } from '@/shared/ui/StarRating'
import { useTranslation } from '@/shared/i18n/useTranslation'

type DriverRatingProps = {
  rating?: number
  ratingCount?: number
  compact?: boolean
  className?: string
}

export function hasDriverRating(rating?: number, ratingCount?: number): boolean {
  return hasStarRating(rating, ratingCount)
}

export function DriverRating({ rating, ratingCount, compact = false, className }: DriverRatingProps) {
  const { t } = useTranslation()
  const count = ratingCount ?? 0

  return (
    <StarRating
      rating={rating}
      ratingCount={count}
      compact={compact}
      className={className}
      emptyLabel={t('drivers.profile.noRating')}
      reviewsLabel={t('drivers.profile.ratingCount', { count: String(count) })}
    />
  )
}
