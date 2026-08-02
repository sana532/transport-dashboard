import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  companyProfileService,
  type CompanyProfile,
  type UpdateCompanyProfileInput,
} from '@/modules/companies/services/companyProfileService'

type CompanyProfileContextValue = {
  profile: CompanyProfile | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  reload: () => Promise<void>
  updateProfile: (input: UpdateCompanyProfileInput) => Promise<CompanyProfile>
}

const CompanyProfileContext = createContext<CompanyProfileContextValue | null>(null)

export function CompanyProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const next = await companyProfileService.getProfile()
      setProfile(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company profile')
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const updateProfile = useCallback(async (input: UpdateCompanyProfileInput) => {
    setIsSaving(true)
    try {
      const updated = await companyProfileService.updateProfile(input)
      setProfile(updated)
      return updated
    } finally {
      setIsSaving(false)
    }
  }, [])

  const value = useMemo(
    () => ({ profile, isLoading, isSaving, error, reload, updateProfile }),
    [profile, isLoading, isSaving, error, reload, updateProfile],
  )

  return (
    <CompanyProfileContext.Provider value={value}>{children}</CompanyProfileContext.Provider>
  )
}

export function useCompanyProfile(): CompanyProfileContextValue {
  const ctx = useContext(CompanyProfileContext)
  if (!ctx) {
    throw new Error('useCompanyProfile must be used within CompanyProfileProvider')
  }
  return ctx
}
