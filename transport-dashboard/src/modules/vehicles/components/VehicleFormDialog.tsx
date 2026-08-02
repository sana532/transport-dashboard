import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Upload, X } from 'lucide-react'
import type { CompanyVehicleModel } from '@/modules/vehicles/types'
import type { Vehicle, VehicleCreateInput, VehicleUpdateInput } from '@/modules/vehicles/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { useMediaImageSrc } from '@/shared/hooks/useMediaImageSrc'
import { useTranslation } from '@/shared/i18n/useTranslation'

const MECHANICAL_STATUSES = ['operational', 'maintenance'] as const

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function ExistingPhotoPreview({ url, label }: { url: string; label: string }) {
  const { src, failed, onError } = useMediaImageSrc(url)
  if (failed || !src) return null

  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-surface-muted">
      <img src={src} alt="" className="h-24 w-full object-cover" onError={onError} />
      <figcaption className="px-2 py-1 text-[10px] text-text-muted">{label}</figcaption>
    </figure>
  )
}

function NewPhotoPreview({
  file,
  label,
  onRemove,
}: {
  file: File
  label: string
  onRemove: () => void
}) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file])

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  return (
    <figure className="relative overflow-hidden rounded-lg border border-border bg-surface-muted">
      <button
        type="button"
        className="absolute end-1 top-1 rounded-full bg-black/55 p-1 text-white hover:bg-black/70"
        aria-label={label}
        onClick={onRemove}
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
      <img src={previewUrl} alt="" className="h-24 w-full object-cover" />
      <figcaption className="truncate px-2 py-1 text-[10px] text-text-muted">{file.name}</figcaption>
    </figure>
  )
}

export type VehicleFormMode = 'add' | 'edit'

export type VehicleFormDialogProps = {
  open: boolean
  onClose: () => void
  mode: VehicleFormMode
  vehicle?: Vehicle | null
  vehicleModels: CompanyVehicleModel[]
  pending?: boolean
  saveError?: string | null
  onCreate?: (input: VehicleCreateInput) => Promise<void>
  onUpdate?: (id: number, input: VehicleUpdateInput) => Promise<void>
}

export function VehicleFormDialog({
  open,
  onClose,
  mode,
  vehicle,
  vehicleModels,
  pending = false,
  saveError = null,
  onCreate,
  onUpdate,
}: VehicleFormDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const descId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [vehicleModelId, setVehicleModelId] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [color, setColor] = useState('')
  const [mechanicalStatus, setMechanicalStatus] = useState<string>(MECHANICAL_STATUSES[0])
  const [isActive, setIsActive] = useState(true)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)

  const isEdit = mode === 'edit'
  const displayError = localError ?? saveError

  const reset = () => {
    setVehicleModelId('')
    setPlateNumber('')
    setColor('')
    setMechanicalStatus(MECHANICAL_STATUSES[0])
    setIsActive(true)
    setPhotoFiles([])
    setLocalError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const applyVehicle = (v: Vehicle) => {
    setVehicleModelId(String(v.vehicleModelId))
    setPlateNumber(v.plateNumber)
    setColor(v.color ?? '')
    setMechanicalStatus(
      MECHANICAL_STATUSES.includes(v.mechanicalStatus as (typeof MECHANICAL_STATUSES)[number])
        ? v.mechanicalStatus
        : MECHANICAL_STATUSES[0],
    )
    setIsActive(v.isActive)
    setPhotoFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    if (!open) return
    if (isEdit && vehicle) {
      applyVehicle(vehicle)
    } else {
      reset()
    }
  }, [open, mode, vehicle?.id])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const modelId = Number(vehicleModelId)
    const plate = plateNumber.trim()
    if (!Number.isFinite(modelId) || !plate) {
      setLocalError(t('vehicles.form.validation'))
      return
    }

    const payload = {
      vehicle_model_id: modelId,
      plate_number: plate,
      color: color.trim() || undefined,
      mechanical_status: mechanicalStatus,
      is_active: isActive,
      photos: photoFiles.length ? photoFiles : undefined,
    }

    try {
      if (isEdit && vehicle) {
        const id = Number(vehicle.id)
        if (!Number.isFinite(id)) {
          setLocalError(t('vehicles.form.saveFailed'))
          return
        }
        await onUpdate?.(id, payload)
      } else {
        await onCreate?.(payload)
      }
      handleClose()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('vehicles.form.saveFailed'))
    }
  }

  const selectedModel = vehicleModels.find((m) => String(m.id) === vehicleModelId)
  const existingPhotoUrls = useMemo(() => {
    if (!isEdit || !vehicle) return []
    return [...new Set([...(vehicle.photoUrls ?? []), vehicle.photoUrl].filter(Boolean))] as string[]
  }, [isEdit, vehicle])

  const removePhotoFile = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Modal open={open} onClose={handleClose} className="max-h-[min(92vh,820px)] overflow-y-auto">
      <form onSubmit={handleSubmit} aria-labelledby={titleId} aria-describedby={descId}>
        <div className="border-b border-surface-muted px-6 py-5">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight text-[var(--title-h2)]">
            {isEdit ? t('vehicles.form.editTitle') : t('vehicles.form.addTitle')}
          </h2>
          <p id={descId} className="mt-1 text-sm text-text-muted">
            {t('vehicles.form.hint')}
          </p>
        </div>

        {displayError ? (
          <p
            className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {displayError}
          </p>
        ) : null}

        <div className="px-6 py-5">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-surface-muted px-4 py-3">
              <CardTitle className="text-base font-semibold text-text-primary">
                {t('vehicles.form.sectionTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="vehicle-model-id" className="text-sm font-medium text-text-secondary">
                  {t('vehicles.form.model')}
                </label>
                <select
                  id="vehicle-model-id"
                  name="vehicle_model_id"
                  className={selectClass}
                  value={vehicleModelId}
                  onChange={(e) => setVehicleModelId(e.target.value)}
                  required
                >
                  <option value="">{t('vehicles.form.chooseModel')}</option>
                  {vehicleModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.seat_count
                        ? `${model.name} (${model.seat_count} ${t('vehicles.form.seats')})`
                        : model.name}
                    </option>
                  ))}
                </select>
                {vehicleModels.length === 0 ? (
                  <div className="space-y-1 text-xs text-amber-800">
                    <p>{t('vehicles.form.noModels')}</p>
                    <p className="text-text-muted">{t('vehicles.form.modelsLoadHint')}</p>
                  </div>
                ) : null}
                {selectedModel?.seat_count ? (
                  <p className="text-xs text-text-muted">
                    {t('vehicles.form.modelSeatsHint', { count: String(selectedModel.seat_count) })}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="plateNumber"
                  label={t('vehicles.form.plate')}
                  placeholder="123456"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  required
                />
                <Input
                  name="color"
                  label={t('vehicles.form.color')}
                  placeholder={t('vehicles.form.colorOptional')}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="mechanical-status"
                    className="text-sm font-medium text-text-secondary"
                  >
                    {t('vehicles.form.mechanicalStatus')}
                  </label>
                  <select
                    id="mechanical-status"
                    name="mechanical_status"
                    className={selectClass}
                    value={mechanicalStatus}
                    onChange={(e) => setMechanicalStatus(e.target.value)}
                  >
                    <option value="operational">{t('vehicles.mechanical.operational')}</option>
                    <option value="maintenance">{t('vehicles.mechanical.maintenance')}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-text-secondary">
                    {t('vehicles.form.activeLabel')}
                  </span>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-brand-primary focus-visible:ring-ring"
                    />
                    <span className="text-sm text-text-primary">{t('vehicles.form.isActive')}</span>
                  </label>
                </div>
              </div>

              {isEdit && vehicle ? (
                <p className="text-xs text-text-muted">
                  {t('vehicles.form.verifiedReadonly', { status: vehicle.verifiedStatus })}
                </p>
              ) : null}

              <div className="space-y-2">
                <span className="text-sm font-medium text-text-secondary">
                  {t('vehicles.form.photos')}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {photoFiles.length
                    ? t('vehicles.form.photosSelected', { count: String(photoFiles.length) })
                    : t('vehicles.form.photosChoose')}
                </Button>

                {existingPhotoUrls.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-text-muted">{t('vehicles.form.photosExisting')}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {existingPhotoUrls.map((url) => (
                        <ExistingPhotoPreview
                          key={url}
                          url={url}
                          label={t('vehicles.form.photosCurrent')}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {photoFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-text-muted">{t('vehicles.form.photosNewPreview')}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {photoFiles.map((file, index) => (
                        <NewPhotoPreview
                          key={`${file.name}-${file.lastModified}-${index}`}
                          file={file}
                          label={t('vehicles.form.photosRemove')}
                          onRemove={() => removePhotoFile(index)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-surface-muted px-6 py-4 sm:flex-row sm:justify-start">
          <Button
            type="submit"
            disabled={pending || vehicleModels.length === 0}
            className="bg-[#2F3E1F] px-6 text-white hover:bg-[#243217] disabled:opacity-70"
          >
            {pending ? t('common.saving') : isEdit ? t('common.saveChanges') : t('vehicles.form.create')}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} disabled={pending}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
