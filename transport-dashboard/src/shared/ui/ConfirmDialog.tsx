import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { useTranslation } from '@/shared/i18n/useTranslation'

export type ConfirmDialogRequest = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  /** If provided, runs after confirm. Errors stay in the dialog (no browser alert). */
  action?: () => Promise<void>
}

type ConfirmDialogContextValue = {
  confirm: (request: ConfirmDialogRequest) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null)

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const titleId = useId()
  const [request, setRequest] = useState<ConfirmDialogRequest | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setRequest(null)
    setPending(false)
    setError(null)
  }, [])

  const confirm = useCallback((next: ConfirmDialogRequest) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current?.(false)
      resolverRef.current = resolve
      setError(null)
      setPending(false)
      setRequest(next)
    })
  }, [])

  const close = useCallback(() => {
    if (pending) return
    settle(false)
  }, [pending, settle])

  useEffect(() => {
    return () => {
      resolverRef.current?.(false)
      resolverRef.current = null
    }
  }, [])

  async function handleConfirm() {
    if (!request || pending) return
    if (!request.action) {
      settle(true)
      return
    }

    setPending(true)
    setError(null)
    try {
      await request.action()
      settle(true)
    } catch (err) {
      setPending(false)
      setError(err instanceof Error ? err.message : t('api.error.generic'))
    }
  }

  const value = useMemo(() => ({ confirm }), [confirm])
  const variant = request?.variant ?? 'danger'
  const Icon = variant === 'danger' ? Trash2 : AlertTriangle

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <Modal
        open={request != null}
        onClose={pending ? () => undefined : close}
        className="max-w-md p-0"
      >
        {request ? (
          <>
            <div className="border-b border-surface-muted px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id={titleId}
                    className="flex items-center gap-2 text-lg font-semibold text-[var(--title-h2)]"
                  >
                    <Icon
                      className={
                        variant === 'danger' ? 'h-5 w-5 text-red-600' : 'h-5 w-5 text-amber-600'
                      }
                      aria-hidden
                    />
                    {request.title}
                  </h2>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
                  onClick={close}
                  disabled={pending}
                  aria-label={request.cancelLabel ?? t('common.cancel')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {request.description ? (
                <p className="text-sm text-text-secondary">{request.description}</p>
              ) : null}
              {error ? (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-surface-muted px-6 py-4">
              <Button type="button" variant="outline" onClick={close} disabled={pending}>
                {request.cancelLabel ?? t('common.cancel')}
              </Button>
              <Button
                type="button"
                className={
                  variant === 'danger'
                    ? 'bg-red-700 text-white hover:bg-red-800 disabled:opacity-60'
                    : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] disabled:opacity-60'
                }
                onClick={() => void handleConfirm()}
                disabled={pending}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                {pending ? t('common.loading') : (request.confirmLabel ?? t('common.delete'))}
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext)
  if (!ctx) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider')
  }
  return ctx.confirm
}
