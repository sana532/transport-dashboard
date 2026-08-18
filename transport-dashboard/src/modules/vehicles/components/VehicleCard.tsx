import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Vehicle, VehicleOperationalStatus } from '@/modules/vehicles/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader } from '@/shared/ui/Card'
import { useMediaImageSrc } from '@/shared/hooks/useMediaImageSrc'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

type VehicleCardProps = {
  vehicle: Vehicle
  onEdit?: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
}

function statusBadgeClass(status: VehicleOperationalStatus): string {
  if (status === 'Available') return 'bg-green-100 text-green-700'
  if (status === 'In Trip') return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-800'
}

function verifiedBadgeClass(status: string): string {
  const key = status.toLowerCase()
  if (key === 'verified') return 'bg-emerald-50 text-emerald-800'
  if (key === 'rejected') return 'bg-red-50 text-red-700'
  return 'bg-slate-100 text-slate-700'
}

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  const { t } = useTranslation()
  const candidates = useMemo(
    () => [...new Set([...(vehicle.photoUrls ?? []), vehicle.photoUrl].filter(Boolean))] as string[],
    [vehicle.id, vehicle.photoUrl, vehicle.photoUrls],
  )
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    setPhotoIndex(0)
  }, [vehicle.id, candidates.join('|')])

  const activePhoto = candidates[photoIndex]
  const { src: displaySrc, failed: photoFailed, onError: onPhotoError } =
    useMediaImageSrc(activePhoto)

  const showPhoto = Boolean(displaySrc) && !photoFailed

  const handlePhotoError = () => {
    if (photoIndex < candidates.length - 1) {
      setPhotoIndex((i) => i + 1)
      return
    }
    onPhotoError()
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      {showPhoto && displaySrc ? (
        <div className="aspect-[16/10] w-full bg-surface-muted">
          <img
            src={displaySrc}
            alt={vehicle.model}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={handlePhotoError}
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] flex-col items-center justify-center gap-1 bg-surface-muted px-3 text-center text-xs text-text-muted">
          <span>{t('vehicles.card.noPhoto')}</span>
          {candidates.length === 0 ? (
            <span className="text-[10px] opacity-80">{t('vehicles.card.noPhotoHint')}</span>
          ) : null}
        </div>
      )}

      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-surface-muted p-3 pb-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold leading-tight text-text-primary">
            {vehicle.code}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-text-muted">
            {vehicle.model}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none',
            statusBadgeClass(vehicle.status),
          )}
        >
          {vehicle.status === 'Available'
            ? t('vehicles.status.available')
            : vehicle.status === 'In Trip'
              ? t('vehicles.status.inTrip')
              : t('vehicles.status.maintenance')}
        </span>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-2">
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] leading-snug text-text-secondary">
          <div className="col-span-2">
            <dt className="text-text-muted">{t('vehicles.form.plate')}</dt>
            <dd className="font-mono font-medium text-text-primary">{vehicle.plateNumber}</dd>
          </div>
          <div>
            <dt className="text-text-muted">{t('vehicles.form.seats')}</dt>
            <dd>{vehicle.seats || '—'}</dd>
          </div>
          <div>
            <dt className="text-text-muted">{t('vehicles.card.added')}</dt>
            <dd>{vehicle.yearLabel}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-text-muted">{t('vehicles.card.verification')}</dt>
            <dd>
              <span
                className={cn(
                  'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                  verifiedBadgeClass(vehicle.verifiedStatus),
                )}
              >
                {vehicle.verifiedStatus}
              </span>
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Button
            type="button"
            variant="outline"
            className="min-w-0 flex-1 px-2.5 py-1.5 text-xs"
            onClick={() => onEdit?.(vehicle)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t('common.edit')}
          </Button>
          <button
            type="button"
            className="rounded-md border border-surface-muted p-1.5 text-red-600 hover:bg-red-50"
            aria-label={t('vehicles.actions.delete', { name: vehicle.plateNumber })}
            onClick={() => onDelete?.(vehicle)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
