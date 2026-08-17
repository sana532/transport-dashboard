import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Bus, LayoutGrid } from 'lucide-react'
import { SeatLayoutPreview } from '@/modules/vehicle-models/components/SeatLayoutPreview'
import { DEFAULT_LAYOUT_CONFIG_JSON } from '@/modules/vehicle-models/types'
import type { VehicleModelFormInput } from '@/modules/vehicle-models/types'
import {
  buildLayoutConfigJson,
  defaultLayoutFormOptions,
  extractLayoutFormOptions,
  normalizeLayoutFormOptions,
  type LayoutFormOptions,
} from '@/modules/vehicle-models/utils/buildLayoutConfig'
import { parseLayoutConfig } from '@/modules/vehicle-models/utils/parseLayoutConfig'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const defaultOptions = defaultLayoutFormOptions()

export type VehicleModelFormInitial = {
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  layoutConfigJson: string
  isActive: boolean
  existingImageUrls?: string[]
}

export type VehicleModelFormProps = {
  mode: 'create' | 'edit'
  initial?: VehicleModelFormInitial
  pending?: boolean
  error?: string | null
  success?: string | null
  submitLabel: string
  pendingLabel: string
  onSubmit: (input: VehicleModelFormInput) => Promise<void>
  onCancel: () => void
}

export function VehicleModelForm({
  mode,
  initial,
  pending = false,
  error = null,
  success = null,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
}: VehicleModelFormProps) {
  const { t } = useTranslation()
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [layoutConfigJson, setLayoutConfigJson] = useState(DEFAULT_LAYOUT_CONFIG_JSON)
  const [seatCount, setSeatCount] = useState(defaultOptions.seatCount)
  const [seatCountDraft, setSeatCountDraft] = useState(String(defaultOptions.seatCount))
  const [rows, setRows] = useState(defaultOptions.rows)
  const [hasAisle, setHasAisle] = useState(defaultOptions.hasAisle)
  const [isActive, setIsActive] = useState(true)
  const [images, setImages] = useState<File[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])

  useEffect(() => {
    if (!initial) return
    setNameEn(initial.nameEn)
    setNameAr(initial.nameAr)
    setDescriptionEn(initial.descriptionEn)
    setDescriptionAr(initial.descriptionAr)
    setLayoutConfigJson(initial.layoutConfigJson)
    setIsActive(initial.isActive)
    setExistingImageUrls(initial.existingImageUrls ?? [])
    setImages([])

    const options = extractLayoutFormOptions(initial.layoutConfigJson)
    if (options) {
      setSeatCount(options.seatCount)
      setSeatCountDraft(String(options.seatCount))
      setRows(options.rows)
      setHasAisle(options.hasAisle)
    }
  }, [initial])

  const layoutJsonOk = parseLayoutConfig(layoutConfigJson).ok
  const seatsPerRow =
    Number.isInteger(rows) && rows > 0 ? Math.round(seatCount / rows) : null

  function applyLayoutOptions(next: LayoutFormOptions) {
    const normalized = normalizeLayoutFormOptions(next)
    setSeatCount(normalized.seatCount)
    setSeatCountDraft(String(normalized.seatCount))
    setRows(normalized.rows)
    setHasAisle(normalized.hasAisle)
    setLayoutConfigJson(buildLayoutConfigJson(normalized))
  }

  function commitSeatCountDraft() {
    applyLayoutOptions({
      seatCount: Number(seatCountDraft),
      rows,
      hasAisle,
    })
  }

  function onImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files) return
    setImages(Array.from(files))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeLayoutFormOptions({
      seatCount: Number(seatCountDraft),
      rows,
      hasAisle,
    })
    const nextJson = buildLayoutConfigJson(normalized)
    setSeatCount(normalized.seatCount)
    setSeatCountDraft(String(normalized.seatCount))
    setRows(normalized.rows)
    setHasAisle(normalized.hasAisle)
    setLayoutConfigJson(nextJson)
    if (!parseLayoutConfig(nextJson).ok) return
    await onSubmit({
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr,
      layoutConfigJson: nextJson,
      isActive,
      images,
    })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted px-4 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
            <Bus className="h-5 w-5" aria-hidden />
          </span>
          <CardTitle className="text-base font-semibold text-text-primary">
            {t('admin.vehicleModels.form.details')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('admin.vehicleModels.form.nameEn')}
              name="name_en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={t('admin.vehicleModels.form.nameEnPlaceholder')}
              required
            />
            <Input
              label={t('admin.vehicleModels.form.nameAr')}
              name="name_ar"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={t('admin.vehicleModels.form.nameArPlaceholder')}
              required
              dir="rtl"
            />
            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="is_active" className="text-sm font-medium text-text-secondary">
                {t('admin.vehicleModels.form.status')}
              </label>
              <select
                id="is_active"
                name="is_active"
                className={selectClass}
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <option value="true">{t('common.active')}</option>
                <option value="false">{t('common.inactive')}</option>
              </select>
            </div>
            <Input
              label={t('admin.vehicleModels.form.descriptionEn')}
              name="description_en"
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder={t('admin.vehicleModels.form.descriptionEnPlaceholder')}
            />
            <Input
              label={t('admin.vehicleModels.form.descriptionAr')}
              name="description_ar"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              placeholder={t('admin.vehicleModels.form.descriptionArPlaceholder')}
              dir="rtl"
            />
            <div className="flex w-full flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="images" className="text-sm font-medium text-text-secondary">
                {t('admin.vehicleModels.form.images')}
              </label>
              <input
                id="images"
                name="images"
                type="file"
                accept="image/*"
                multiple
                className={selectClass}
                onChange={onImagesChange}
              />
              {mode === 'edit' ? (
                <p className="text-xs text-text-muted">
                  {t('admin.vehicleModels.form.imagesEditHint')}
                </p>
              ) : null}
              {images.length > 0 ? (
                <p className="text-xs text-text-muted">
                  {t('admin.vehicleModels.form.imagesSelected', { count: images.length })}
                </p>
              ) : null}
              {existingImageUrls.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {existingImageUrls.map((url) => {
                    const src = resolveMediaUrl(url)
                    if (!src) return null
                    return (
                      <img
                        key={url}
                        src={src}
                        alt=""
                        className="h-16 w-24 rounded-md border border-border object-cover"
                      />
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted px-4 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </span>
          <CardTitle className="text-base font-semibold text-text-primary">
            {t('admin.vehicleModels.form.seatLayout')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <p className="text-xs text-text-muted">{t('admin.vehicleModels.form.seatLayoutHint')}</p>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label={t('admin.vehicleModels.form.seatCount')}
              name="seat_count"
              type="number"
              min={1}
              step={1}
              value={seatCountDraft}
              onChange={(e) => setSeatCountDraft(e.target.value)}
              onBlur={commitSeatCountDraft}
              required
            />
            <Input
              label={t('admin.vehicleModels.form.rows')}
              name="layout_rows"
              type="number"
              min={1}
              max={30}
              step={1}
              value={rows}
              onChange={(e) => {
                const nextRows = Number(e.target.value)
                const seatsPerCurrentRow = Math.max(
                  1,
                  Math.round(seatCount / Math.max(rows, 1)),
                )
                applyLayoutOptions({
                  seatCount: seatsPerCurrentRow * (Number.isFinite(nextRows) ? nextRows : rows),
                  rows: nextRows,
                  hasAisle,
                })
              }}
              required
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-secondary">
                {t('admin.vehicleModels.form.hasAisle')}
              </span>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                <input
                  type="checkbox"
                  name="has_aisle"
                  checked={hasAisle}
                  onChange={(e) =>
                    applyLayoutOptions({
                      seatCount,
                      rows,
                      hasAisle: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-border text-brand-primary focus-visible:ring-ring"
                />
                <span className="text-sm text-text-primary">
                  {t('admin.vehicleModels.form.hasAisleLabel')}
                </span>
              </label>
            </div>
          </div>

          {seatsPerRow != null && seatsPerRow > 0 ? (
            <p className="text-xs text-text-muted">
              {t('admin.vehicleModels.form.seatsPerRow', { count: seatsPerRow })}
            </p>
          ) : null}

          <SeatLayoutPreview layoutConfigJson={layoutConfigJson} />

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              type="submit"
              disabled={pending || !layoutJsonOk}
              className="inline-flex items-center justify-center rounded-lg bg-[#2F3E1F] px-4 py-2 text-sm font-medium text-white hover:bg-[#243217] disabled:pointer-events-none disabled:opacity-50"
            >
              {pending ? pendingLabel : submitLabel}
            </button>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('admin.vehicleModels.form.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
