import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-primary-dark focus-visible:ring-ring',
  secondary:
    'bg-surface-muted text-text-primary hover:bg-border focus-visible:ring-ring',
  outline:
    'border border-border bg-transparent text-text-secondary hover:bg-surface-muted focus-visible:ring-ring',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-muted focus-visible:ring-ring',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = 'primary', type = 'button', ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
          variantClass[variant],
          className,
        )}
        {...props}
      />
    )
  },
)
