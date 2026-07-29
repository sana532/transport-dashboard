import { Users } from 'lucide-react'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'

export function UsersManagementPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t('admin.nav.access')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
          {t('admin.sidebar.users')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('admin.users.subtitle')}</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">{t('admin.users.waitingTitle')}</p>
        <p className="mt-1 text-amber-800/90">{t('admin.users.waitingBody')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
            <Users className="h-5 w-5" aria-hidden />
          </span>
          <CardTitle className="text-lg">{t('admin.users.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-text-muted">{t('admin.users.waitingBody')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
