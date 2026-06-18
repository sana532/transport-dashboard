import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-b border-surface-muted p-4', className)} {...props} />
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-semibold text-text-primary', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  )
}
