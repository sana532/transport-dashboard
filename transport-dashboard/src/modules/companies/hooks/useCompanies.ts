import { useCallback, useEffect, useState } from 'react'
import { companiesService } from '@/modules/companies/services/companiesService'
import type { CreateCompanyInput, PlatformCompany } from '@/modules/companies/types'

export function useCompanies() {
  const [companies, setCompanies] = useState<PlatformCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(() => {
    setCompanies(companiesService.readRecentCompanies())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const createCompany = useCallback(
    async (input: CreateCompanyInput) => {
      const result = await companiesService.createCompany(input)
      setCompanies(companiesService.readRecentCompanies())
      return result
    },
    [],
  )

  return {
    companies,
    isLoading,
    reload,
    createCompany,
  }
}
