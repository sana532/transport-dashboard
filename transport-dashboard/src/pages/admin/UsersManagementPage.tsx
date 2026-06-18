import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'

export function UsersManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Users management
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Platform users, roles, and access for admin and company accounts.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Table placeholder — connect to your identity / user service.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
