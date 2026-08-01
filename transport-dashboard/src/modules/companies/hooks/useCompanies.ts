import { useCallback, useEffect, useState } from 'react'
import { companiesService } from '@/modules/companies/services/companiesService'
import type {
  CompaniesListQuery,
  CreateCompanyInput,
  PlatformCompany,
} from '@/modules/companies/types'

export function useCompanies(query?: CompaniesListQuery) {
  const [companies, setCompanies] = useState<PlatformCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const search = query?.search?.trim() ?? ''
  const status = query?.status

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await companiesService.listCompanies({
        search: search || undefined,
        status: status || undefined,
      })
      setCompanies(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies')
      setCompanies([])
    } finally {
      setIsLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    void load()
  }, [load])

  const createCompany = useCallback(
    async (input: CreateCompanyInput) => {
      const result = await companiesService.createCompany(input)
      await load()
      return result
    },
    [load],
  )

  return {
    companies,
    isLoading,
    error,
    reload: load,
    createCompany,
  }
}
