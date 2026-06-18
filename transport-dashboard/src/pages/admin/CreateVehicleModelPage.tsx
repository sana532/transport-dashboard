import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { VehicleModelForm } from '@/modules/vehicle-models/components/VehicleModelForm'
import { useVehicleModels } from '@/modules/vehicle-models/hooks/useVehicleModels'
import { paths } from '@/routes/paths'

export function CreateVehicleModelPage() {
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
          Back to vehicle models
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Add vehicle model
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Define a reusable bus layout for all companies on the platform.
        </p>
      </div>

      <VehicleModelForm
        mode="create"
        pending={pending}
        error={error}
        success={success}
        submitLabel="Create model"
        pendingLabel="Saving…"
        onCancel={() => navigate(paths.admin.vehicleModels)}
        onSubmit={async (input) => {
          setError(null)
          setSuccess(null)
          setPending(true)
          try {
            const created = await createModel(input)
            setSuccess(`Model "${created.name}" was created successfully.`)
            window.setTimeout(() => {
              navigate(paths.admin.vehicleModels, { replace: true })
            }, 1200)
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create vehicle model'
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
