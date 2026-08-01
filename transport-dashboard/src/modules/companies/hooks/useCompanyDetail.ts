import { useCallback, useEffect, useState } from 'react'
import { companiesService } from '@/modules/companies/services/companiesService'
import type { PlatformCompany, UpdateCompanyInput } from '@/modules/companies/types'

export function useCompanyDetail(companyId: string | undefined) {
  const [company, setCompany] = useState<PlatformCompany | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    if (!companyId) {
      setError('Missing company reference')
      setCompany(null)
      setIsLoading(false)
      return
    }

    const numericId = Number(companyId)
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setError('Invalid company id')
      setCompany(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const next = await companiesService.getCompany(numericId)
      setCompany(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company')
      setCompany(null)
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    void load()
  }, [load])

  const updateCompany = useCallback(
    async (input: UpdateCompanyInput) => {
      if (!company) throw new Error('Company not loaded')
      setIsSaving(true)
      try {
        const updated = await companiesService.updateCompany(company.id, input)
        setCompany(updated)
        return updated
      } finally {
        setIsSaving(false)
      }
    },
    [company],
  )

  return {
    company,
    isLoading,
    isSaving,
    error,
    reload: load,
    updateCompany,
  }
}
