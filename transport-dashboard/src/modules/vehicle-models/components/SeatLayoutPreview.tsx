import { useMemo } from 'react'
import { HelpCircle } from 'lucide-react'
import { parseLayoutConfig } from '@/modules/vehicle-models/utils/parseLayoutConfig'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'

type SeatLayoutPreviewProps = {
  layoutConfigJson: string
  className?: string
}

export function SeatLayoutPreview({ layoutConfigJson, className }: SeatLayoutPreviewProps) {
  const { t } = useTranslation()
  const parsed = useMemo(() => parseLayoutConfig(layoutConfigJson), [layoutConfigJson])

  if (!parsed.ok) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700',
          className,
        )}
      >
        {parsed.error === 'Invalid layout JSON'
          ? t('admin.vehicleModels.previewInvalid')
          : parsed.error}
      </div>
    )
  }

  const { layout } = parsed

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-muted/40 px-4 py-5',
        className,
      )}
      dir="ltr"
    >
      <div className="mb-4 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary">
          <HelpCircle className="h-3.5 w-3.5 text-text-muted" aria-hidden />
          {t('admin.vehicleModels.previewDriver')}
        </span>
      </div>

      <div
        className="mx-auto flex flex-col items-center gap-1.5"
        style={{ maxWidth: layout.columns * 44 }}
      >
        {layout.cells.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 2.25rem))` }}
          >
            {row.map((cell, colIndex) => {
              if (cell.kind === 'aisle') {
                return (
                  <div
                    key={`aisle-${rowIndex}-${colIndex}`}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-100/80"
                    aria-hidden
                  >
                    <span className="h-full w-0.5 rounded-full bg-slate-300" />
                  </div>
                )
              }

              return (
                <div
                  key={`seat-${cell.seatNumber}`}
                  title={`${cell.seatNumber}`}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-xs font-semibold text-white shadow-sm"
                >
                  {cell.seatNumber}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        {t('admin.vehicleModels.previewSeats', { count: layout.seatCount })}
      </p>
    </div>
  )
}
