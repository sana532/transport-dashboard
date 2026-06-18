import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, User } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { CompanyStatus, CreateCompanyInput } from '@/modules/companies/types'
import { useCompanies } from '@/modules/companies/hooks/useCompanies'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const defaultForm: CreateCompanyInput = {
  company: {
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    status: 'active',
    logo: null,
    coverImage: null,
  },
  manager: {
    name: '',
    username: '',
    phoneNumber: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  },
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2
  title: string
  children: ReactNode
}) {
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <CardTitle className="text-base font-semibold text-text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">{children}</CardContent>
    </Card>
  )
}

export function CreateCompanyPage() {
  const navigate = useNavigate()
  const { token, role } = useAuth()
  const { createCompany } = useCompanies()
  const [form, setForm] = useState<CreateCompanyInput>(defaultForm)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!token || role !== 'admin') {
      navigate(paths.login, { replace: true })
    }
  }, [token, role, navigate])

  function updateCompany<K extends keyof CreateCompanyInput['company']>(
    key: K,
    value: CreateCompanyInput['company'][K],
  ) {
    setForm((prev) => ({
      ...prev,
      company: { ...prev.company, [key]: value },
    }))
  }

  function updateManager<K extends keyof CreateCompanyInput['manager']>(
    key: K,
    value: CreateCompanyInput['manager'][K],
  ) {
    setForm((prev) => ({
      ...prev,
      manager: { ...prev.manager, [key]: value },
    }))
  }

  function onFileChange(
    key: 'logo' | 'coverImage',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0] ?? null
    updateCompany(key, file)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)

    try {
      const result = await createCompany(form)
      setSuccess(`Company "${result.company.name}" was created successfully.`)
      setForm(defaultForm)
      window.setTimeout(() => {
        navigate(paths.admin.companies, { replace: true })
      }, 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create company'
      setError(message)
      if (message.toLowerCase().includes('sign in')) {
        window.setTimeout(() => navigate(paths.login, { replace: true }), 2000)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={paths.admin.companies}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to companies
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Create company
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Register a transport company and its manager account (platform API).
        </p>
      </div>

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

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <FormSection icon={Building2} title="Company information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Company name"
              name="company_name"
              value={form.company.name}
              onChange={(e) => updateCompany('name', e.target.value)}
              required
            />
            <Input
              label="Email"
              name="company_email"
              type="email"
              value={form.company.email}
              onChange={(e) => updateCompany('email', e.target.value)}
              required
            />
            <Input
              label="Phone"
              name="company_phone"
              value={form.company.phone}
              onChange={(e) => updateCompany('phone', e.target.value)}
              required
            />
            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="company_status" className="text-sm font-medium text-text-secondary">
                Status
              </label>
              <select
                id="company_status"
                name="company_status"
                className={selectClass}
                value={form.company.status}
                onChange={(e) => updateCompany('status', e.target.value as CompanyStatus)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <Input
              label="Address"
              name="company_address"
              value={form.company.address}
              onChange={(e) => updateCompany('address', e.target.value)}
              className="sm:col-span-2"
            />
            <div className="flex w-full flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="company_description" className="text-sm font-medium text-text-secondary">
                Description
              </label>
              <textarea
                id="company_description"
                name="company_description"
                rows={3}
                className={cn(selectClass, 'resize-y')}
                value={form.company.description}
                onChange={(e) => updateCompany('description', e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="company_logo" className="text-sm font-medium text-text-secondary">
                Logo
              </label>
              <input
                id="company_logo"
                name="company_logo"
                type="file"
                accept="image/*"
                className={selectClass}
                onChange={(e) => onFileChange('logo', e)}
              />
            </div>
            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="company_cover" className="text-sm font-medium text-text-secondary">
                Cover image
              </label>
              <input
                id="company_cover"
                name="company_cover"
                type="file"
                accept="image/*"
                className={selectClass}
                onChange={(e) => onFileChange('coverImage', e)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection icon={User} title="Company manager">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Manager name"
              name="manager_name"
              value={form.manager.name}
              onChange={(e) => updateManager('name', e.target.value)}
              required
            />
            <Input
              label="Username"
              name="manager_username"
              value={form.manager.username}
              onChange={(e) => updateManager('username', e.target.value)}
              required
            />
            <Input
              label="Phone number"
              name="manager_phone"
              value={form.manager.phoneNumber}
              onChange={(e) => updateManager('phoneNumber', e.target.value)}
              required
            />
            <Input
              label="Manager email"
              name="manager_email"
              type="email"
              value={form.manager.email}
              onChange={(e) => updateManager('email', e.target.value)}
              required
            />
            <Input
              label="Password"
              name="manager_password"
              type="password"
              autoComplete="new-password"
              value={form.manager.password}
              onChange={(e) => updateManager('password', e.target.value)}
              required
            />
            <Input
              label="Confirm password"
              name="manager_password_confirmation"
              type="password"
              autoComplete="new-password"
              value={form.manager.passwordConfirmation}
              onChange={(e) => updateManager('passwordConfirmation', e.target.value)}
              required
            />
          </div>
        </FormSection>

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(paths.admin.companies)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-brand-primary text-white hover:bg-brand-primary-dark"
          >
            {pending ? 'Creating…' : 'Create company'}
          </Button>
        </div>
      </form>
    </div>
  )
}
