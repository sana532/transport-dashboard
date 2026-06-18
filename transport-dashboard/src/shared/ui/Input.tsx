import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, label, error, hint, ...props },
  ref,
) {
  const inputId = id ?? props.name

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors placeholder:text-text-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-surface-muted',
          error &&
            'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
