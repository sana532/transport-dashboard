import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Admin dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Platform-wide overview for transport companies on your SaaS.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {['Companies', 'Active users', 'Trips (24h)'].map((title) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                —
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
