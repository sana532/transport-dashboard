import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export type ToastVariant = 'info' | 'success' | 'error'

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastItem = ToastInput & {
  id: string
  variant: ToastVariant
  durationMs: number
}

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantClass: Record<ToastVariant, string> = {
  info: 'border-[#2F3E1F]/25 bg-[#2F3E1F] text-white',
  success: 'border-emerald-700/30 bg-emerald-800 text-white',
  error: 'border-red-700/30 bg-red-700 text-white',
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (items.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
            'animate-[login-fade-up_0.28s_ease-out]',
            variantClass[item.variant],
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-xs leading-snug text-white/85">{item.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Dismiss"
            onClick={() => onDismiss(item.id)}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer != null) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const item: ToastItem = {
        id,
        title: input.title.trim() || 'Notification',
        description: input.description?.trim() || undefined,
        variant: input.variant ?? 'info',
        durationMs: input.durationMs ?? 4500,
      }

      setItems((prev) => [...prev.slice(-4), item])

      const timer = window.setTimeout(() => dismiss(id), item.durationMs)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        window.clearTimeout(timer)
      }
      timersRef.current.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
