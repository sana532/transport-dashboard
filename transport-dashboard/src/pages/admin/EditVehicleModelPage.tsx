import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { VehicleModelForm } from '@/modules/vehicle-models/components/VehicleModelForm'
import type { VehicleModelFormInitial } from '@/modules/vehicle-models/components/VehicleModelForm'
import { useVehicleModels } from '@/modules/vehicle-models/hooks/useVehicleModels'
import { vehicleModelsService } from '@/modules/vehicle-models/services/vehicleModelsService'
import { layoutConfigToJson } from '@/modules/vehicle-models/utils/layoutConfigJson'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent } from '@/shared/ui/Card'

export function EditVehicleModelPage() {
  const navigate = useNavigate()
  const { modelId } = useParams()
  const { token, role } = useAuth()
  const { updateModel } = useVehicleModels()

  const numericId = Number(modelId)
  const validId = Number.isFinite(numericId) && numericId > 0

  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initial, setInitial] = useState<VehicleModelFormInitial | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!token || role !== 'admin') {
      navigate(paths.login, { replace: true })
    }
  }, [token, role, navigate])

  useEffect(() => {
    if (!validId) {
      setIsLoading(false)
      setLoadError('Invalid vehicle model id')
      return
    }

    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    void vehicleModelsService
      .getVehicleModel(numericId)
      .then((model) => {
        if (cancelled) return
        setInitial({
          nameEn: model.nameEn,
          nameAr: model.nameAr,
          descriptionEn: model.descriptionEn ?? '',
          descriptionAr: model.descriptionAr ?? '',
          layoutConfigJson: layoutConfigToJson(model.layout_config),
          isActive: model.is_active,
          existingImageUrls: model.image_urls,
        })
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load vehicle model')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [numericId, validId])

  const formInitial = useMemo(() => initial ?? undefined, [initial])

  if (!validId) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-red-700" role="alert">
            Invalid vehicle model id.
          </p>
          <Button type="button" variant="outline" onClick={() => navigate(paths.admin.vehicleModels)}>
            Back to list
          </Button>
        </CardContent>
      </Card>
    )
  }

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
          Edit vehicle model
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Update catalog details and seat layout for this model.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading model…</p>
      ) : loadError ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-red-700" role="alert">
              {loadError}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(paths.admin.vehicleModels)}
            >
              Back to list
            </Button>
          </CardContent>
        </Card>
      ) : formInitial ? (
        <VehicleModelForm
          key={numericId}
          mode="edit"
          initial={formInitial}
          pending={pending}
          error={error}
          success={success}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          onCancel={() => navigate(paths.admin.vehicleModels)}
          onSubmit={async (input) => {
            setError(null)
            setSuccess(null)
            setPending(true)
            try {
              const updated = await updateModel(numericId, input)
              setSuccess(`Model "${updated.name}" was updated successfully.`)
              window.setTimeout(() => {
                navigate(paths.admin.vehicleModels, { replace: true })
              }, 1200)
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to update vehicle model'
              setError(message)
              if (message.toLowerCase().includes('sign in')) {
                window.setTimeout(() => navigate(paths.login, { replace: true }), 2000)
              }
            } finally {
              setPending(false)
            }
          }}
        />
      ) : null}
    </div>
  )
}
