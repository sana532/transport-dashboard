import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/utils/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Extra classes on the scrollable dialog panel */
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-8 md:p-12">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 max-h-[min(90vh,880px)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200/90 bg-white text-text-primary shadow-2xl ring-1 ring-black/5',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
