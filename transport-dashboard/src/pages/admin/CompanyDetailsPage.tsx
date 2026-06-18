import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'

export function CompanyDetailsPage() {
  const { companyId } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Company details
        </h1>
        <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-400">
          Company ID: {companyId ?? '—'}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aggregate trips for this company — wire to your API.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Seats sold vs capacity — placeholder for reporting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
