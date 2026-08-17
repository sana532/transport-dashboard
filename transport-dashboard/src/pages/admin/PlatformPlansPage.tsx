import { useState, type FormEvent } from 'react'
import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import type {
  CompanySubscriptionPlan,
  SubscriptionPlanInput,
  SubscriptionPlanType,
} from '@/modules/subscription-packages/types'
import { usePlatformSubscriptionPlans } from '@/modules/subscription-packages/hooks/usePlatformSubscriptionPlans'
import { planToInput } from '@/modules/subscription-packages/utils/mapCompanySubscriptionPlan'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { cn } from '@/shared/utils/cn'

const createBtnClass = cn(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold',
  'bg-[#2F3E1F] text-white shadow-sm hover:bg-[#243217]',
)

const iconBtnClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const textareaClass =
  'min-h-[72px] w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm'

type PlanFormState = {
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  price: string
  type: SubscriptionPlanType
  discountPercentage: string
  totalTrips: string
  validityDays: string
  maxTicketsPerTrip: string
  isActive: boolean
}

const emptyForm: PlanFormState = {
  nameEn: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAr: '',
  price: '',
  type: 'multi_trip',
  discountPercentage: '',
  totalTrips: '10',
  validityDays: '30',
  maxTicketsPerTrip: '1',
  isActive: true,
}

function planToForm(plan: CompanySubscriptionPlan): PlanFormState {
  const input = planToInput(plan)
  return {
    nameEn: input.name_en,
    nameAr: input.name_ar,
    descriptionEn: input.description_en,
    descriptionAr: input.description_ar,
    price: String(input.price),
    type: input.type,
    discountPercentage:
      input.discount_percentage != null ? String(input.discount_percentage) : '',
    totalTrips: input.total_trips != null ? String(input.total_trips) : '',
    validityDays: String(input.validity_days),
    maxTicketsPerTrip: String(input.conditions.max_tickets_per_trip),
    isActive: input.is_active,
  }
}

function formToInput(
  form: PlanFormState,
  t: (key: string) => string,
): SubscriptionPlanInput {
  const price = Number(form.price)
  const validityDays = Number(form.validityDays)
  const maxTickets = Number(form.maxTicketsPerTrip)
  if (!form.nameEn.trim() || !form.nameAr.trim()) {
    throw new Error(t('admin.platformPlans.errNames'))
  }
  if (!Number.isFinite(price) || price < 0) throw new Error(t('admin.platformPlans.errPrice'))
  if (!Number.isFinite(validityDays) || validityDays < 1) {
    throw new Error(t('admin.platformPlans.errValidity'))
  }

  const input: SubscriptionPlanInput = {
    name_en: form.nameEn.trim(),
    name_ar: form.nameAr.trim(),
    description_en: form.descriptionEn.trim(),
    description_ar: form.descriptionAr.trim(),
    price,
    type: form.type,
    discount_percentage: null,
    total_trips: null,
    validity_days: Math.floor(validityDays),
    conditions: {
      max_tickets_per_trip: Number.isFinite(maxTickets) && maxTickets > 0 ? Math.floor(maxTickets) : 1,
    },
    is_active: form.isActive,
  }

  if (form.type === 'multi_trip') {
    const trips = Number(form.totalTrips)
    if (!Number.isFinite(trips) || trips < 1) throw new Error(t('admin.platformPlans.errTrips'))
    input.total_trips = Math.floor(trips)
  } else {
    const discount = Number(form.discountPercentage)
    if (!Number.isFinite(discount) || discount <= 0) {
      throw new Error(t('admin.platformPlans.errDiscount'))
    }
    input.discount_percentage = discount
  }

  return input
}

export function PlatformPlansPage() {
  const { t, locale } = useTranslation()
  const { plans, isLoading, error, reload, createPlan, updatePlan, deletePlan } =
    usePlatformSubscriptionPlans()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<PlanFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isEditing = editingId !== null

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(plan: CompanySubscriptionPlan) {
    setEditingId(plan.id)
    setForm(planToForm(plan))
    setFormError(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setPending(true)
    try {
      const payload = formToInput(form, t)
      if (isEditing && editingId !== null) {
        await updatePlan(editingId, payload)
      } else {
        await createPlan(payload)
      }
      closeDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.platformPlans.errorSave'))
    } finally {
      setPending(false)
    }
  }

  async function handleDelete(plan: CompanySubscriptionPlan) {
    if (!window.confirm(t('admin.platformPlans.confirmDelete', { name: plan.nameEn }))) return
    setActionError(null)
    try {
      await deletePlan(plan.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.platformPlans.errorDelete'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t('admin.nav.offers')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
            {t('admin.sidebar.platformPlans')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            {t('admin.platformPlans.subtitle')}
          </p>
        </div>
        <button type="button" className={createBtnClass} onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin.platformPlans.add')}
        </button>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      <Modal open={dialogOpen} onClose={closeDialog} className="max-w-xl p-0">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-surface-muted px-6 py-4">
            <h2 className="section-title text-lg font-semibold text-[var(--title-h2)]">
              {isEditing ? t('admin.platformPlans.editTitle') : t('admin.platformPlans.addTitle')}
            </h2>
          </div>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('admin.platformPlans.nameEn')} value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} required />
              <Input label={t('admin.platformPlans.nameAr')} value={form.nameAr} onChange={(e) => setForm((p) => ({ ...p, nameAr: e.target.value }))} required dir="rtl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-text-secondary">{t('admin.platformPlans.descriptionEn')}</label>
                <textarea className={textareaClass} value={form.descriptionEn} onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-text-secondary">{t('admin.platformPlans.descriptionAr')}</label>
                <textarea className={textareaClass} value={form.descriptionAr} onChange={(e) => setForm((p) => ({ ...p, descriptionAr: e.target.value }))} dir="rtl" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('admin.platformPlans.price')} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required inputMode="decimal" />
              <Input label={t('admin.platformPlans.validityDays')} value={form.validityDays} onChange={(e) => setForm((p) => ({ ...p, validityDays: e.target.value }))} required inputMode="numeric" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-text-secondary">{t('admin.platformPlans.type')}</label>
              <select
                className={selectClass}
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value as SubscriptionPlanType }))
                }
              >
                <option value="multi_trip">{t('admin.platformPlans.type.multiTrip')}</option>
                <option value="discount_pass">{t('admin.platformPlans.type.discountPass')}</option>
              </select>
            </div>
            {form.type === 'multi_trip' ? (
              <Input
                label={t('admin.platformPlans.totalTrips')}
                value={form.totalTrips}
                onChange={(e) => setForm((p) => ({ ...p, totalTrips: e.target.value }))}
                required
                inputMode="numeric"
              />
            ) : (
              <Input
                label={t('admin.platformPlans.discountPercentage')}
                value={form.discountPercentage}
                onChange={(e) => setForm((p) => ({ ...p, discountPercentage: e.target.value }))}
                required
                inputMode="decimal"
              />
            )}
            <Input
              label={t('admin.platformPlans.maxTicketsPerTrip')}
              value={form.maxTicketsPerTrip}
              onChange={(e) => setForm((p) => ({ ...p, maxTicketsPerTrip: e.target.value }))}
              inputMode="numeric"
            />
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-[#2F3E1F]"
              />
              {t('common.active')}
            </label>
            {formError ? (
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-surface-muted px-6 py-4">
            <Button type="submit" disabled={pending} className="bg-[#2F3E1F] px-6 text-white hover:bg-[#243217] disabled:opacity-70">
              {pending ? t('common.saving') : isEditing ? t('common.saveChanges') : t('admin.platformPlans.create')}
            </Button>
            <Button type="button" variant="outline" onClick={closeDialog}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {error ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
            <Button type="button" onClick={() => void reload()} className="bg-[#2F3E1F] text-white hover:bg-[#243217]">
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
              <Package className="h-5 w-5" aria-hidden />
            </span>
            <CardTitle className="text-lg">{t('admin.platformPlans.listTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-text-muted">{t('common.loading')}</p>
            ) : plans.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-text-muted">{t('admin.platformPlans.empty')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="app-table w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-text-muted">
                      <th className="px-4 py-3 text-start font-semibold">{t('admin.platformPlans.colName')}</th>
                      <th className="px-3 py-3 text-start font-semibold">{t('admin.platformPlans.colType')}</th>
                      <th className="px-3 py-3 text-start font-semibold">{t('admin.platformPlans.colPrice')}</th>
                      <th className="px-3 py-3 text-start font-semibold">{t('admin.platformPlans.colValidity')}</th>
                      <th className="px-3 py-3 text-start font-semibold">{t('common.status')}</th>
                      <th className="px-3 py-3 text-end font-semibold">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} className="border-b border-surface-muted last:border-0">
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {locale === 'ar' ? plan.nameAr || plan.nameEn : plan.nameEn}
                        </td>
                        <td className="px-3 py-3 text-text-secondary">
                          {plan.type === 'discount_pass'
                            ? t('admin.platformPlans.type.discountPass')
                            : t('admin.platformPlans.type.multiTrip')}
                        </td>
                        <td className="px-3 py-3 text-text-secondary">{plan.price}</td>
                        <td className="px-3 py-3 text-text-secondary">
                          {t('admin.platformPlans.validityDaysValue', { days: String(plan.validityDays) })}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                              plan.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600',
                            )}
                          >
                            {plan.isActive ? t('common.active') : t('common.inactive')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className={iconBtnClass}
                              onClick={() => openEdit(plan)}
                              aria-label={t('common.edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className={cn(iconBtnClass, 'hover:border-red-200 hover:text-red-700')}
                              onClick={() => void handleDelete(plan)}
                              aria-label={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
