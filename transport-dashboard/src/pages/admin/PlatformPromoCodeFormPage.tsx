import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Weekday } from '@/modules/promo-codes/types'
import { WEEKDAYS } from '@/modules/promo-codes/types'
import { platformPromoCodesService } from '@/modules/promo-codes/services/platformPromoCodesService'
import {
  combineDateAndTime,
  defaultValidFromParts,
  defaultValidToParts,
  splitApiDateTime,
  toApiDateTime,
} from '@/modules/promo-codes/utils/promoCodeDates'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const textareaClass =
  'min-h-[80px] w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors placeholder:text-text-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

export function PlatformPromoCodeFormPage() {
  const navigate = useNavigate()
  const { promoId } = useParams()
  const isEdit = Boolean(promoId)
  const numericId = isEdit ? Number(promoId) : NaN

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
  const [validDays, setValidDays] = useState<Weekday[]>([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
  ])
  const [validFromDate, setValidFromDate] = useState('')
  const [validFromTime, setValidFromTime] = useState('00:00')
  const [validToDate, setValidToDate] = useState('')
  const [validToTime, setValidToTime] = useState('23:59')
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    void platformPromoCodesService
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
        const from = splitApiDateTime(promo.validFrom)
        const to = splitApiDateTime(promo.validTo)
        setValidFromDate(from.date)
        setValidFromTime(from.time)
        setValidToDate(to.date)
        setValidToTime(to.time)
        setIsActive(promo.isActive)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load promo')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, numericId])

  function toggleDay(day: Weekday) {
    setValidDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const parsedValue = Number(value)
    if (!nameEn.trim() || !nameAr.trim() || !code.trim() || !Number.isFinite(parsedValue)) {
      setError('Fill in names, code, and a valid value.')
      return
    }
    if (!validFromDate || !validToDate) {
      setError('Set validity dates.')
      return
    }

    const conditions: { min_ticket_price?: number; valid_days?: Weekday[] } = {}
    if (validDays.length) conditions.valid_days = validDays
    const minPrice = minTicketPrice.trim() ? Number(minTicketPrice) : NaN
    if (Number.isFinite(minPrice)) conditions.min_ticket_price = minPrice

    const input = {
      name_en: nameEn.trim(),
      name_ar: nameAr.trim(),
      description_en: descriptionEn.trim(),
      description_ar: descriptionAr.trim(),
      code: code.trim().toUpperCase(),
      type: promoType,
      value: parsedValue,
      max_discount_amount: maxDiscountAmount.trim()
        ? Number(maxDiscountAmount)
        : null,
      route_id: routeId.trim() ? Number(routeId) : null,
      max_uses: maxUses.trim() ? Number(maxUses) : null,
      max_uses_per_user: maxUsesPerUser.trim() ? Number(maxUsesPerUser) : null,
      conditions,
      valid_from: toApiDateTime(combineDateAndTime(validFromDate, validFromTime)),
      valid_to: toApiDateTime(combineDateAndTime(validToDate, validToTime)),
      is_active: isActive,
    }

    setIsSaving(true)
    try {
      if (isEdit && Number.isFinite(numericId)) {
        await platformPromoCodesService.updatePromoCode(numericId, input)
      } else {
        await platformPromoCodesService.createPromoCode(input)
      }
      navigate(paths.admin.promoCodes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save promo')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to={paths.admin.promoCodes}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2F3E1F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to platform promos
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Offers</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
          {isEdit ? 'Edit platform promo' : 'Add platform promo'}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Define a global discount offer for the whole platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Promo details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
              <Input label="Name (AR)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} required dir="rtl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Description (EN)</label>
                <textarea className={textareaClass} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Description (AR)</label>
                <textarea className={textareaClass} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} dir="rtl" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Type</label>
                <select className={selectClass} value={promoType} onChange={(e) => setPromoType(e.target.value)}>
                  <option value="percentage">percentage</option>
                  <option value="fixed">fixed</option>
                </select>
              </div>
              <Input label="Value" value={value} onChange={(e) => setValue(e.target.value)} required inputMode="decimal" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Max discount amount"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                inputMode="decimal"
              />
              <Input
                label="Route ID (optional)"
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                inputMode="numeric"
              />
              <Input
                label="Min ticket price"
                value={minTicketPrice}
                onChange={(e) => setMinTicketPrice(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Max uses" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} inputMode="numeric" />
              <Input
                label="Max uses per user"
                value={maxUsesPerUser}
                onChange={(e) => setMaxUsesPerUser(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium text-text-secondary">Valid days</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day}
                    className={cn(
                      'inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-xs capitalize',
                      validDays.includes(day)
                        ? 'border-[#2F3E1F] bg-[#2F3E1F]/10 text-[#2F3E1F]'
                        : 'border-border text-text-secondary',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={validDays.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input label="Valid from (date)" type="date" value={validFromDate} onChange={(e) => setValidFromDate(e.target.value)} required />
                <Input label="Time" type="time" value={validFromTime} onChange={(e) => setValidFromTime(e.target.value)} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input label="Valid to (date)" type="date" value={validToDate} onChange={(e) => setValidToDate(e.target.value)} required />
                <Input label="Time" type="time" value={validToTime} onChange={(e) => setValidToTime(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-[#2F3E1F]"
              />
              Active
            </label>
            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#2F3E1F] px-6 text-white hover:bg-[#243217] disabled:opacity-70"
              >
                {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create promo'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(paths.admin.promoCodes)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
