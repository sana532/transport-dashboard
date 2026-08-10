import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { restAreasService } from '@/modules/geography/services/restAreasService'
import { stationsService } from '@/modules/geography/services/stationsService'
import type { RestArea, Station } from '@/modules/geography/types'
import { routesService } from '@/modules/routes/services/routesService'
import type { CompanyRoute, RouteFormInput } from '@/modules/routes/types'

export type RoutesManagementState = {
  routes: CompanyRoute[]
  stations: Station[]
  restAreas: RestArea[]
}

export const routesManagementQueryKey = ['routes', 'management'] as const

export function useRoutesManagement() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: routesManagementQueryKey,
    queryFn: async (): Promise<RoutesManagementState> => {
      const [routes, stations, restAreas] = await Promise.all([
        routesService.listRoutes(),
        stationsService.listStations(),
        restAreasService.listRestAreas(),
      ])
      return { routes, stations, restAreas }
    },
  })

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: routesManagementQueryKey })
  }, [queryClient])

  const createRoute = useCallback(
    async (input: RouteFormInput) => {
      const created = await routesService.createRoute(input)
      await reload()
      return created
    },
    [reload],
  )

  const updateRoute = useCallback(
    async (id: number, input: RouteFormInput) => {
      const updated = await routesService.updateRoute(id, input)
      queryClient.setQueryData<RoutesManagementState>(routesManagementQueryKey, (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          routes: prev.routes.map((route) =>
            route.id === id ? { ...route, ...updated } : route,
          ),
        }
      })
      await reload()
      return updated
    },
    [queryClient, reload],
  )

  const deleteRoute = useCallback(
    async (id: number) => {
      await routesService.deleteRoute(id)
      await reload()
    },
    [reload],
  )

  return {
    routes: query.data?.routes ?? [],
    stations: query.data?.stations ?? [],
    restAreas: query.data?.restAreas ?? [],
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load routes'
      : null,
    reload,
    createRoute,
    updateRoute,
    deleteRoute,
  }
}
