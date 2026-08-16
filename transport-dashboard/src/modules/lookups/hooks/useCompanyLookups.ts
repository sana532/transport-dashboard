import { useCallback, useEffect, useState } from 'react'
import { companyLookupsService } from '@/modules/lookups/services/companyLookupsService'
import type { CompanyLookups, CompanyLookupsQuery } from '@/modules/lookups/types'

export function useCompanyLookups(query: CompanyLookupsQuery) {
  const [data, setData] = useState<CompanyLookups>(companyLookupsService.empty())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const queryKey = [
    query.routes ? 'routes' : '',
    query.drivers ? 'drivers' : '',
    query.vehicles ? 'vehicles' : '',
    query.cities ? 'cities' : '',
    query.stations ? 'stations' : '',
  ].join('|')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const next = await companyLookupsService.getLookups(query)
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lookups')
      setData(companyLookupsService.empty())
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by queryKey string
  }, [queryKey])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
