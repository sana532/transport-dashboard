import { useCallback, useEffect, useState } from 'react'
import { restAreasService } from '@/modules/geography/services/restAreasService'
import { stationsService } from '@/modules/geography/services/stationsService'
import type { RestArea, Station } from '@/modules/geography/types'
import { routesService } from '@/modules/routes/services/routesService'
import type { CompanyRoute, RouteFormInput } from '@/modules/routes/types'

export function useRoutesManagement() {
  const [routes, setRoutes] = useState<CompanyRoute[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [restAreas, setRestAreas] = useState<RestArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [routeList, stationList, restAreaList] = await Promise.all([
        routesService.listRoutes(),
        stationsService.listStations(),
        restAreasService.listRestAreas(),
      ])
      setRoutes(routeList)
      setStations(stationList)
      setRestAreas(restAreaList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createRoute = useCallback(
    async (input: RouteFormInput) => {
      const created = await routesService.createRoute(input)
      await load()
      return created
    },
    [load],
  )

  const updateRoute = useCallback(
    async (id: number, input: RouteFormInput) => {
      const updated = await routesService.updateRoute(id, input)
      await load()
      return updated
    },
    [load],
  )

  const deleteRoute = useCallback(
    async (id: number) => {
      await routesService.deleteRoute(id)
      await load()
    },
    [load],
  )

  return {
    routes,
    stations,
    restAreas,
    isLoading,
    error,
    reload: load,
    createRoute,
    updateRoute,
    deleteRoute,
  }
}
