import { useCallback, useEffect, useState } from 'react'
import { restAreasService } from '@/modules/geography/services/restAreasService'
import type { RestArea } from '@/modules/geography/types'

export function useRestAreas() {
  const [restAreas, setRestAreas] = useState<RestArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await restAreasService.listRestAreas()
      setRestAreas(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rest areas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { restAreas, isLoading, error, reload: load }
}
