import { useEffect, useId, useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import type { Driver } from '@/modules/drivers/types'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { useTranslation } from '@/shared/i18n/useTranslation'

type DriverDeleteDialogProps = {
  open: boolean
  driver: Driver | null
  pending?: boolean
  error?: string | null
  onClose: () => void
  onConfirm: (driver: Driver) => Promise<void>
}

export function DriverDeleteDialog({
  open,
  driver,
  pending = false,
  error = null,
  onClose,
  onConfirm,
}: DriverDeleteDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setLocalError(null)
  }, [open])

  const displayError = error ?? localError
  const onTrip = driver?.status === 'On Trip'

  async function handleConfirm() {
    if (!driver || pending || onTrip) return
    setLocalError(null)
    try {
      await onConfirm(driver)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('drivers.delete.failed'))
    }
  }

  return (
    <Modal open={open} onClose={pending ? () => undefined : onClose} className="max-w-md p-0">
      <div className="border-b border-surface-muted px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="flex items-center gap-2 text-lg font-semibold text-[var(--title-h2)]"
            >
              <Trash2 className="h-5 w-5 text-red-600" aria-hidden />
              {t('drivers.delete.title')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{t('drivers.delete.subtitle')}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
            onClick={onClose}
            disabled={pending}
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {driver ? (
          <div className="rounded-lg border border-border bg-surface-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-text-primary">{driver.name}</p>
            {driver.phone ? (
              <p className="mt-1 text-text-secondary">{driver.phone}</p>
            ) : null}
          </div>
        ) : null}

        <p className="text-sm text-text-secondary">
          {t('drivers.confirmDelete', { name: driver?.name ?? '' })}
        </p>

        {onTrip ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            <p>{t('drivers.delete.onTripHint')}</p>
          </div>
        ) : null}

        {displayError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {displayError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-surface-muted px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          {t('common.cancel')}
        </Button>
          <Button
            type="button"
            className="bg-red-700 text-white hover:bg-red-800 disabled:opacity-60"
            onClick={() => void handleConfirm()}
            disabled={pending || !driver || onTrip}
          >
          <Trash2 className="h-4 w-4" aria-hidden />
          {pending ? t('drivers.delete.deleting') : t('drivers.delete.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
