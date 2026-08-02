import { useEffect, useId, useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Weekday } from '@/modules/promo-codes/types'
import { WEEKDAYS } from '@/modules/promo-codes/types'
import { promoCodesService } from '@/modules/promo-codes/services/promoCodesService'
import {
  combineDateAndTime,
  defaultValidFromParts,
  defaultValidToParts,
  splitApiDateTime,
  toApiDateTime,
} from '@/modules/promo-codes/utils/promoCodeDates'
import { routesService } from '@/modules/routes/services/routesService'
import type { CompanyRoute } from '@/modules/routes/types'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const textareaClass =
  'min-h-[80px] w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors placeholder:text-text-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

export function PromoCodeFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { promoId } = useParams()
  const statusGroupId = useId()
  const isEdit = Boolean(promoId)
  const numericId = isEdit ? Number(promoId) : NaN

  const [routes, setRoutes] = useState<CompanyRoute[]>([])
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [code, setCode] = useState('')
  const [promoType, setPromoType] = useState('percentage')
  const [value, setValue] = useState('20')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('')
  const [routeId, setRouteId] = useState('')
  const [maxUses, setMaxUses] = useState('1000')
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('1')
  const [minTicketPrice, setMinTicketPrice] = useState('')
  const [validDays, setValidDays] = useState<Weekday[]>(['monday', 'tuesday', 'wednesday', 'thursday'])
  const [validFromDate, setValidFromDate] = useState('')
  const [validFromTime, setValidFromTime] = useState('00:00')
  const [validToDate, setValidToDate] = useState('')
  const [validToTime, setValidToTime] = useState('23:59')
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void routesService
      .listRoutes()
      .then(setRoutes)
      .catch(() => setRoutes([]))
  }, [])

  useEffect(() => {
    if (isEdit) return
    const from = defaultValidFromParts()
    const to = defaultValidToParts()
    setValidFromDate(from.date)
    setValidFromTime(from.time)
    setValidToDate(to.date)
    setValidToTime(to.time)
  }, [isEdit])

  useEffect(() => {
    if (!isEdit || !Number.isFinite(numericId)) return
    let cancelled = false
    setIsLoading(true)
    void promoCodesService
      .getPromoCode(numericId)
      .then((promo) => {
        if (cancelled) return
        setNameEn(promo.nameEn)
        setNameAr(promo.nameAr)
        setDescriptionEn(promo.descriptionEn)
        setDescriptionAr(promo.descriptionAr)
        setCode(promo.code)
        setPromoType(promo.type)
        setValue(String(promo.value))
        setMaxDiscountAmount(
          promo.maxDiscountAmount != null ? String(promo.maxDiscountAmount) : '',
        )
        setRouteId(promo.routeId != null ? String(promo.routeId) : '')
        setMaxUses(promo.maxUses != null ? String(promo.maxUses) : '')
        setMaxUsesPerUser(promo.maxUsesPerUser != null ? String(promo.maxUsesPerUser) : '1')
        setMinTicketPrice(
          promo.conditions.minTicketPrice != null
            ? String(promo.conditions.minTicketPrice)
            : '',
        )
        setValidDays(promo.conditions.validDays.length ? promo.conditions.validDays : [])
        const fromParts = splitApiDateTime(promo.validFrom)
        const toParts = splitApiDateTime(promo.validTo)
        setValidFromDate(fromParts.date)
        setValidFromTime(fromParts.time)
        setValidToDate(toParts.date)
        setValidToTime(toParts.time)
        setIsActive(promo.isActive)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('promoCodes.errorUnavailable'))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, numericId, t])

  const toggleDay = (day: Weekday) => {
    setValidDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  const buildPayload = () => {
    if (!nameEn.trim() || !nameAr.trim() || !code.trim()) {
      throw new Error(t('promoCodes.validation.required'))
    }
    const parsedValue = Number(value)
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      throw new Error(t('promoCodes.validation.valueInvalid'))
    }
    if (!validFromDate.trim() || !validToDate.trim()) {
      throw new Error(t('promoCodes.validation.datesRequired'))
    }
    const fromLocal = combineDateAndTime(validFromDate, validFromTime)
    const toLocal = combineDateAndTime(validToDate, validToTime)
    if (new Date(toLocal).getTime() <= new Date(fromLocal).getTime()) {
      throw new Error(t('promoCodes.validation.dateRange'))
    }

    const conditions: { min_ticket_price?: number; valid_days?: Weekday[] } = {}
    if (validDays.length) conditions.valid_days = validDays
    const minPrice = Number(minTicketPrice)
    if (minTicketPrice.trim() && Number.isFinite(minPrice)) {
      conditions.min_ticket_price = minPrice
    }

    const parsedRouteId = routeId.trim() ? Number(routeId) : null
    const parsedMaxUses = maxUses.trim() ? Number(maxUses) : null
    const parsedMaxUsesPerUser = maxUsesPerUser.trim() ? Number(maxUsesPerUser) : null
    const parsedMaxDiscount = maxDiscountAmount.trim() ? Number(maxDiscountAmount) : null

    return {
      name_en: nameEn.trim(),
      name_ar: nameAr.trim(),
      description_en: descriptionEn.trim(),
      description_ar: descriptionAr.trim(),
      code: code.trim().toUpperCase(),
      type: promoType,
      value: parsedValue,
      max_discount_amount: Number.isFinite(parsedMaxDiscount ?? NaN) ? parsedMaxDiscount : null,
      route_id: Number.isFinite(parsedRouteId ?? NaN) ? parsedRouteId : null,
      max_uses: Number.isFinite(parsedMaxUses ?? NaN) ? parsedMaxUses : null,
      max_uses_per_user: Number.isFinite(parsedMaxUsesPerUser ?? NaN)
        ? parsedMaxUsesPerUser
        : null,
      conditions,
      valid_from: toApiDateTime(fromLocal),
      valid_to: toApiDateTime(toLocal),
      is_active: isActive,
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      const payload = buildPayload()
      if (isEdit && Number.isFinite(numericId)) {
        await promoCodesService.updatePromoCode(numericId, payload)
      } else {
        await promoCodesService.createPromoCode(payload)
      }
      navigate(paths.company.promoCodes)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('promoCodes.errorSave'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-[480px] animate-pulse rounded-xl bg-surface-muted" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to={paths.company.promoCodes}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('common.back')}
        </Link>
        <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
          {isEdit ? t('promoCodes.editTitle') : t('promoCodes.addTitle')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('promoCodes.formSubtitle')}</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-md">
          <CardHeader className="border-b border-surface-muted px-4 py-3 sm:px-6">
            <CardTitle className="text-lg">{t('promoCodes.section.info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <Input name="code" label={t('promoCodes.col.code')} value={code} onChange={(e) => setCode(e.target.value)} required />
            <Input name="nameEn" label={t('promoCodes.nameEn')} value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
            <Input name="nameAr" label={t('promoCodes.nameAr')} value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="desc-en" className="text-sm font-medium text-text-secondary">{t('promoCodes.descriptionEn')}</label>
              <textarea id="desc-en" className={textareaClass} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="desc-ar" className="text-sm font-medium text-text-secondary">{t('promoCodes.descriptionAr')}</label>
              <textarea id="desc-ar" className={textareaClass} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={2} dir="rtl" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="border-b border-surface-muted px-4 py-3 sm:px-6">
            <CardTitle className="text-lg">{t('promoCodes.section.discount')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="promo-type" className="text-sm font-medium text-text-secondary">{t('promoCodes.discountType')}</label>
              <select id="promo-type" className={selectClass} value={promoType} onChange={(e) => setPromoType(e.target.value)}>
                <option value="percentage">{t('promoCodes.type.percentage')}</option>
                <option value="fixed">{t('promoCodes.type.fixed')}</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="value" label={t('promoCodes.discountValue')} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} required />
              <Input name="maxDiscount" label={t('promoCodes.maxDiscount')} inputMode="decimal" value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="route-id" className="text-sm font-medium text-text-secondary">{t('promoCodes.routeOptional')}</label>
              <select id="route-id" className={selectClass} value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                <option value="">{t('promoCodes.allRoutes')}</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="maxUses" label={t('promoCodes.maxUses')} inputMode="numeric" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
              <Input name="maxUsesPerUser" label={t('promoCodes.maxUsesPerUser')} inputMode="numeric" value={maxUsesPerUser} onChange={(e) => setMaxUsesPerUser(e.target.value)} />
            </div>
            <Input name="minTicketPrice" label={t('promoCodes.minTicketPrice')} inputMode="decimal" value={minTicketPrice} onChange={(e) => setMinTicketPrice(e.target.value)} />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="border-b border-surface-muted px-4 py-3 sm:px-6">
            <CardTitle className="text-lg">{t('promoCodes.section.conditions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <p className="text-sm text-text-muted">{t('promoCodes.validDaysHint')}</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <label
                  key={day}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    validDays.includes(day)
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={validDays.includes(day)}
                    onChange={() => toggleDay(day)}
                  />
                  {t(`promoCodes.weekday.${day}`)}
                </label>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-text-secondary">{t('promoCodes.validFrom')}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="valid-from-date" className="text-xs text-text-muted">
                      {t('promoCodes.date')}
                    </label>
                    <input
                      id="valid-from-date"
                      type="date"
                      className={selectClass}
                      value={validFromDate}
                      onChange={(e) => setValidFromDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="valid-from-time" className="text-xs text-text-muted">
                      {t('promoCodes.time')}
                    </label>
                    <input
                      id="valid-from-time"
                      type="time"
                      className={selectClass}
                      value={validFromTime}
                      onChange={(e) => setValidFromTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-text-secondary">{t('promoCodes.validTo')}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="valid-to-date" className="text-xs text-text-muted">
                      {t('promoCodes.date')}
                    </label>
                    <input
                      id="valid-to-date"
                      type="date"
                      className={selectClass}
                      value={validToDate}
                      onChange={(e) => setValidToDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="valid-to-time" className="text-xs text-text-muted">
                      {t('promoCodes.time')}
                    </label>
                    <input
                      id="valid-to-time"
                      type="time"
                      className={selectClass}
                      value={validToTime}
                      onChange={(e) => setValidToTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="border-b border-surface-muted px-4 py-3 sm:px-6">
            <CardTitle className="text-lg">{t('promoCodes.section.status')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <fieldset>
              <legend className="sr-only">{t('promoCodes.section.status')}</legend>
              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input type="radio" name={`status-${statusGroupId}`} checked={isActive} onChange={() => setIsActive(true)} />
                  {t('common.active')}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input type="radio" name={`status-${statusGroupId}`} checked={!isActive} onChange={() => setIsActive(false)} />
                  {t('common.inactive')}
                </label>
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate(paths.company.promoCodes)} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]" disabled={isSaving}>
            {isSaving ? t('common.saving') : t('promoCodes.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
