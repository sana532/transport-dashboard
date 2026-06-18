import { useEffect, useId, useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { SubscriptionPlanType } from '@/modules/subscription-packages/types'
import { subscriptionPlansService } from '@/modules/subscription-packages/services/subscriptionPlansService'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'
import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const textareaClass =
  'min-h-[88px] w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors placeholder:text-text-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

export function AddSubscriptionPackagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { packageId } = useParams()
  const statusGroupId = useId()
  const isEdit = Boolean(packageId && packageId !== 'new')
  const numericId = isEdit ? Number(packageId) : NaN

  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [planType, setPlanType] = useState<SubscriptionPlanType>('multi_trip')
  const [price, setPrice] = useState('')
  const [totalTrips, setTotalTrips] = useState('10')
  const [discountPercent, setDiscountPercent] = useState('15')
  const [validityDays, setValidityDays] = useState('30')
  const [maxTicketsPerTrip, setMaxTicketsPerTrip] = useState('1')
  const [isActive, setIsActive] = useState(true)
  const [isLoadingPlan, setIsLoadingPlan] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || !Number.isFinite(numericId)) return
    let cancelled = false
    setIsLoadingPlan(true)
    setError(null)
    void subscriptionPlansService
      .getPlan(numericId)
      .then((plan) => {
        if (cancelled) return
        setNameEn(plan.nameEn)
        setNameAr(plan.nameAr)
        setDescriptionEn(plan.descriptionEn)
        setDescriptionAr(plan.descriptionAr)
        setPlanType(plan.type)
        setPrice(String(plan.price))
        setTotalTrips(plan.totalTrips != null ? String(plan.totalTrips) : '')
        setDiscountPercent(
          plan.discountPercentage != null ? String(plan.discountPercentage) : '',
        )
        setValidityDays(String(plan.validityDays))
        setMaxTicketsPerTrip(String(plan.maxTicketsPerTrip ?? 1))
        setIsActive(plan.isActive)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('packages.errorUnavailable'))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPlan(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, numericId, t])

  const buildPayload = () => {
    const parsedPrice = Number(price)
    const parsedValidity = Number(validityDays)
    const parsedMaxTickets = Number(maxTicketsPerTrip)
    if (!nameEn.trim() || !nameAr.trim()) {
      throw new Error(t('addPackage.validation.namesRequired'))
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      throw new Error(t('addPackage.validation.priceInvalid'))
    }
    if (!Number.isFinite(parsedValidity) || parsedValidity < 1) {
      throw new Error(t('addPackage.validation.validityInvalid'))
    }

    const payload = {
      name_en: nameEn.trim(),
      name_ar: nameAr.trim(),
      description_en: descriptionEn.trim(),
      description_ar: descriptionAr.trim(),
      price: parsedPrice,
      type: planType,
      discount_percentage: null as number | null,
      total_trips: null as number | null,
      validity_days: Math.floor(parsedValidity),
      conditions: {
        max_tickets_per_trip: Number.isFinite(parsedMaxTickets)
          ? Math.max(1, Math.floor(parsedMaxTickets))
          : 1,
      },
      is_active: isActive,
    }

    if (planType === 'multi_trip') {
      const trips = Number(totalTrips)
      if (!Number.isFinite(trips) || trips < 1) {
        throw new Error(t('addPackage.validation.tripsInvalid'))
      }
      payload.total_trips = Math.floor(trips)
    } else {
      const discount = Number(discountPercent)
      if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
        throw new Error(t('addPackage.validation.discountInvalid'))
      }
      payload.discount_percentage = discount
    }

    return payload
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      const payload = buildPayload()
      if (isEdit && Number.isFinite(numericId)) {
        await subscriptionPlansService.updatePlan(numericId, payload)
      } else {
        await subscriptionPlansService.createPlan(payload)
      }
      navigate(paths.company.subscriptionPackages)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addPackage.errorSave'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingPlan) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-surface-muted" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to={paths.company.subscriptionPackages}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {t('common.back')}
        </Link>
        <h1 className="text-[34px] font-semibold tracking-tight text-text-primary">
          {isEdit ? t('addPackage.editTitle') : t('addPackage.title')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('addPackage.subtitle')}</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-md">
          <CardHeader className="border-b border-surface-muted px-4 py-3 sm:px-6">
            <CardTitle className="text-lg">{t('addPackage.infoTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <Input
              name="nameEn"
              label={t('addPackage.nameEn')}
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
            />
            <Input
              name="nameAr"
              label={t('addPackage.nameAr')}
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description-en" className="text-sm font-medium text-text-secondary">
                {t('addPackage.descriptionEn')}
              </label>
              <textarea
                id="description-en"
                className={textareaClass}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description-ar" className="text-sm font-medium text-text-secondary">
                {t('addPackage.descriptionAr')}
              </label>
              <textarea
                id="description-ar"
                className={textareaClass}
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                rows={3}
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="border-b border-surface-muted px-4 py-3 sm:px-6">
            <CardTitle className="text-lg">{t('addPackage.planTypeTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="plan-type" className="text-sm font-medium text-text-secondary">
                {t('addPackage.planType')}
              </label>
              <select
                id="plan-type"
                className={selectClass}
                value={planType}
                onChange={(e) => setPlanType(e.target.value as SubscriptionPlanType)}
              >
                <option value="multi_trip">{t('addPackage.type.multiTrip')}</option>
                <option value="discount_pass">{t('addPackage.type.discountPass')}</option>
              </select>
            </div>
            <Input
              name="price"
              label={t('addPackage.price')}
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            {planType === 'multi_trip' ? (
              <Input
                name="totalTrips"
                label={t('addPackage.totalTrips')}
                inputMode="numeric"
                value={totalTrips}
                onChange={(e) => setTotalTrips(e.target.value)}
                required
              />
            ) : (
              <Input
                name="discountPercent"
                label={t('addPackage.discountPercent')}
                inputMode="decimal"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                required
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="validityDays"
                label={t('addPackage.validityDays')}
                inputMode="numeric"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                required
              />
              <Input
                name="maxTicketsPerTrip"
                label={t('addPackage.maxTicketsPerTrip')}
                inputMode="numeric"
                value={maxTicketsPerTrip}
                onChange={(e) => setMaxTicketsPerTrip(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="border-b border-surface-muted px-4 py-3 sm:px-6">
            <CardTitle className="text-lg">{t('addPackage.statusTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <fieldset>
              <legend className="sr-only">{t('addPackage.statusTitle')}</legend>
              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text-primary">
                  <input
                    type="radio"
                    name={`status-${statusGroupId}`}
                    checked={isActive}
                    onChange={() => setIsActive(true)}
                    className="h-4 w-4 border-border text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                  />
                  {t('common.active')}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text-primary">
                  <input
                    type="radio"
                    name={`status-${statusGroupId}`}
                    checked={!isActive}
                    onChange={() => setIsActive(false)}
                    className="h-4 w-4 border-border text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                  />
                  {t('common.inactive')}
                </label>
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="order-2 w-full sm:order-1 sm:w-auto sm:min-w-[140px]"
            onClick={() => navigate(paths.company.subscriptionPackages)}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className={cn(
              'order-1 w-full bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] sm:order-2 sm:w-auto sm:min-w-[160px]',
            )}
            disabled={isSaving}
          >
            {isSaving ? t('common.saving') : t('addPackage.savePackage')}
          </Button>
        </div>
      </form>
    </div>
  )
}
