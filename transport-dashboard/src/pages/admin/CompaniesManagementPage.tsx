import { Link } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'
import { useCompanies } from '@/modules/companies/hooks/useCompanies'
import type { PlatformCompany } from '@/modules/companies/types'
import { paths } from '@/routes/paths'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'

const createBtnClass = cn(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold',
  'bg-[#2F3E1F] text-white shadow-sm hover:bg-[#243217]',
)

function StatusBadge({ status }: { status: PlatformCompany['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        status === 'active'
          ? 'bg-green-100 text-green-800'
          : 'bg-slate-100 text-slate-600',
      )}
    >
      {status}
    </span>
  )
}

export function CompaniesManagementPage() {
  const { companies, isLoading } = useCompanies()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Companies
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Create transport companies and assign a company manager.
          </p>
        </div>
        <Link to={paths.admin.companyNew} className={createBtnClass}>
          <Plus className="h-4 w-4" aria-hidden />
          Create company
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
            <Building2 className="h-5 w-5" aria-hidden />
          </span>
          <CardTitle className="text-lg">Companies</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : companies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
              <p className="text-sm text-text-muted">No companies yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-start text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="pb-3 pe-4 font-medium">Name</th>
                    <th className="pb-3 pe-4 font-medium">Email</th>
                    <th className="pb-3 pe-4 font-medium">Phone</th>
                    <th className="pb-3 pe-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b border-surface-muted last:border-0">
                      <td className="py-3 pe-4 font-medium text-text-primary">
                        {company.name}
                      </td>
                      <td className="py-3 pe-4 text-text-secondary">{company.email}</td>
                      <td className="py-3 pe-4 text-text-secondary">{company.phone}</td>
                      <td className="py-3 pe-4">
                        <StatusBadge status={company.status} />
                      </td>
                      <td className="py-3">
                        <Link
                          to={paths.admin.companyDetails(String(company.id))}
                          className="font-medium text-[#2F3E1F] hover:underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
