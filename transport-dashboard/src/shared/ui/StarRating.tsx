import { Star } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

type StarRatingProps = {
  rating?: number
  ratingCount?: number
  compact?: boolean
  className?: string
  emptyLabel: string
  reviewsLabel: string
}

export function hasStarRating(rating?: number, ratingCount?: number): boolean {
  const count = ratingCount ?? 0
  return rating != null && Number.isFinite(rating) && (count > 0 || rating > 0)
}

export function StarRating({
  rating,
  ratingCount,
  compact = false,
  className,
  emptyLabel,
  reviewsLabel,
}: StarRatingProps) {
  const count = ratingCount ?? 0

  if (!hasStarRating(rating, count)) {
    return (
      <span className={cn('text-text-muted', className)}>{compact ? '—' : emptyLabel}</span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
      <span>{rating?.toFixed(2)}</span>
      <span className="text-text-muted">· {reviewsLabel}</span>
    </span>
  )
}
