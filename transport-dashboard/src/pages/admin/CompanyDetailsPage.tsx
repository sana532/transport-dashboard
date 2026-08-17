import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useCompanyDetail } from '@/modules/companies/hooks/useCompanyDetail'
import { CompanyRating } from '@/modules/companies/components/CompanyRating'
import type { CompanyStatus, UpdateCompanyInput } from '@/modules/companies/types'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { useMediaImageSrc } from '@/shared/hooks/useMediaImageSrc'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

function emptyForm(): UpdateCompanyInput {
  return {
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    status: 'active',
  }
}

function CompanyMedia({ url, alt }: { url: string | null | undefined; alt: string }) {
  const { src, failed, onError } = useMediaImageSrc(url ?? undefined)
  if (!url || failed || !src) return null
  return (
    <img
      src={src}
      alt={alt}
      onError={onError}
      className="h-20 w-20 rounded-lg border border-border object-cover"
    />
  )
}

export function CompanyDetailsPage() {
  const { companyId } = useParams()
  const { t } = useTranslation()
  const { company, isLoading, isSaving, error, reload, updateCompany } =
    useCompanyDetail(companyId)

  const [form, setForm] = useState<UpdateCompanyInput>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!company) return
    setForm({
      name: company.name === '—' ? '' : company.name,
      email: company.email === '—' ? '' : company.email,
      phone: company.phone === '—' ? '' : company.phone,
      address: company.address ?? '',
      description: company.description ?? '',
      status: company.status,
    })
  }, [company])

  function updateField<K extends keyof UpdateCompanyInput>(key: K, value: UpdateCompanyInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSuccess(null)

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError(t('admin.companies.formRequired'))
      return
    }

    try {
      await updateCompany(form)
      setSuccess(t('admin.companies.updateSuccess'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.companies.updateFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={paths.admin.companies}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2F3E1F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('admin.companies.backToList')}
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t('admin.nav.tenants')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
          {company?.name ?? t('admin.companies.detailsTitle')}
        </h1>
        {company ? (
          <div className="mt-2">
            <CompanyRating
              averageRating={company.averageRating}
              totalRatings={company.totalRatings}
            />
          </div>
        ) : null}
        <p className="mt-1 text-sm text-text-muted">{t('admin.companies.detailsSubtitle')}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">{t('admin.companies.loading')}</p>
      ) : error || !company ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-red-700" role="alert">
              {error ?? t('admin.companies.notFound')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void reload()}
                className="bg-[#2F3E1F] text-white hover:bg-[#243217]"
              >
                {t('common.retry')}
              </Button>
              <Link to={paths.admin.companies}>
                <Button type="button" variant="outline">
                  {t('admin.companies.backToList')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {(company.logo_url || company.cover_image_url) && (
            <div className="flex flex-wrap gap-4">
              <CompanyMedia url={company.logo_url} alt={`${company.name} logo`} />
              <CompanyMedia url={company.cover_image_url} alt={`${company.name} cover`} />
            </div>
          )}

          {formError ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {formError}
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

          <form className="space-y-5" onSubmit={onSubmit} noValidate>
            <Card className="border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
                  <Building2 className="h-5 w-5" aria-hidden />
                </span>
                <CardTitle className="text-base font-semibold text-text-primary">
                  {t('admin.companies.profileTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t('admin.companies.colName')}
                    name="company_name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                  />
                  <Input
                    label={t('admin.companies.colEmail')}
                    name="company_email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                  <Input
                    label={t('admin.companies.colPhone')}
                    name="company_phone"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    required
                  />
                  <div className="flex w-full flex-col gap-1.5">
                    <label htmlFor="company_status" className="text-sm font-medium text-text-secondary">
                      {t('common.status')}
                    </label>
                    <select
                      id="company_status"
                      name="company_status"
                      className={selectClass}
                      value={form.status}
                      onChange={(e) => updateField('status', e.target.value as CompanyStatus)}
                    >
                      <option value="active">{t('common.active')}</option>
                      <option value="inactive">{t('common.inactive')}</option>
                      <option value="suspended">{t('admin.companies.statusSuspended')}</option>
                    </select>
                  </div>
                  <Input
                    label={t('admin.companies.colAddress')}
                    name="company_address"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="sm:col-span-2"
                  />
                  <div className="flex w-full flex-col gap-1.5 sm:col-span-2">
                    <label
                      htmlFor="company_description"
                      className="text-sm font-medium text-text-secondary"
                    >
                      {t('admin.companies.colDescription')}
                    </label>
                    <textarea
                      id="company_description"
                      name="company_description"
                      rows={3}
                      className={cn(selectClass, 'resize-y')}
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <Link to={paths.admin.companies} className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  {t('common.cancel')}
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#2F3E1F] text-white hover:bg-[#243217] sm:w-auto"
              >
                {isSaving ? t('admin.companies.saving') : t('common.saveChanges')}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
