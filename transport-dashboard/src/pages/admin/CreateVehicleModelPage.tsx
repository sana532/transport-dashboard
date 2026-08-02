import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { VehicleModelForm } from '@/modules/vehicle-models/components/VehicleModelForm'
import { useVehicleModels } from '@/modules/vehicle-models/hooks/useVehicleModels'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function CreateVehicleModelPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token, role } = useAuth()
  const { createModel } = useVehicleModels()

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!token || role !== 'admin') {
      navigate(paths.login, { replace: true })
    }
  }, [token, role, navigate])

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={paths.admin.vehicleModels}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('admin.vehicleModels.backToList')}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
          {t('admin.vehicleModels.createTitle')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('admin.vehicleModels.createSubtitle')}</p>
      </div>

      <VehicleModelForm
        mode="create"
        pending={pending}
        error={error}
        success={success}
        submitLabel={t('admin.vehicleModels.form.create')}
        pendingLabel={t('admin.vehicleModels.form.saving')}
        onCancel={() => navigate(paths.admin.vehicleModels)}
        onSubmit={async (input) => {
          setError(null)
          setSuccess(null)
          setPending(true)
          try {
            const created = await createModel(input)
            setSuccess(
              t('admin.vehicleModels.form.createdSuccess', { name: created.name }),
            )
            window.setTimeout(() => {
              navigate(paths.admin.vehicleModels, { replace: true })
            }, 1200)
          } catch (err) {
            const message =
              err instanceof Error ? err.message : t('admin.vehicleModels.invalidId')
            setError(message)
            if (message.toLowerCase().includes('sign in')) {
              window.setTimeout(() => navigate(paths.login, { replace: true }), 2000)
            }
          } finally {
            setPending(false)
          }
        }}
      />
    </div>
  )
}
