import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'

export function CompanyDetailsPage() {
  const { companyId } = useParams()
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={paths.admin.companies}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2F3E1F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to companies
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t('admin.nav.tenants')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
          Company details
        </h1>
        <p className="mt-1 font-mono text-sm text-text-muted">
          Company ID: {companyId ?? '—'}
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Limited view — coming soon</p>
        <p className="mt-1 text-amber-800/90">
          Company profile and status will appear here. Day-to-day trips and bookings stay in the
          company dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What belongs here</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text-muted">
          <p>Company profile (name, contact, logo, status).</p>
          <p>Assigned manager account.</p>
          <p>Activate / suspend tenant — not day-to-day trip management.</p>
        </CardContent>
      </Card>
    </div>
  )
}
