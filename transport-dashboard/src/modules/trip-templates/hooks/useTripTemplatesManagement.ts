import { useCallback, useEffect, useState } from 'react'
import type { CompanyTripTemplate, TripTemplateInput } from '@/modules/trip-templates/types'
import { tripTemplatesService } from '@/modules/trip-templates/services/tripTemplatesService'

export function useTripTemplatesManagement() {
  const [templates, setTemplates] = useState<CompanyTripTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await tripTemplatesService.listTemplates()
      setTemplates(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trip schedules')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createTemplate = useCallback(
    async (input: TripTemplateInput) => {
      const created = await tripTemplatesService.createTemplate(input)
      await load()
      return created
    },
    [load],
  )

  const updateTemplate = useCallback(
    async (id: number, input: TripTemplateInput) => {
      const updated = await tripTemplatesService.updateTemplate(id, input)
      await load()
      return updated
    },
    [load],
  )

  const deleteTemplate = useCallback(
    async (id: number) => {
      await tripTemplatesService.deleteTemplate(id)
      await load()
    },
    [load],
  )

  return {
    templates,
    isLoading,
    error,
    reload: load,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  }
}
