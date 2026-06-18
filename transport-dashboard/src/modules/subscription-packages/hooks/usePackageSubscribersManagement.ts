import { useCallback, useEffect, useState } from 'react'
import type { PackageSubscribersManagementData } from '@/modules/subscription-packages/types'
import { packageSubscribersManagementService } from '@/modules/subscription-packages/services/packageSubscribersManagementService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function usePackageSubscribersManagement(packageId: string | undefined) {
  const { locale, t } = useTranslation()
  const [data, setData] = useState<PackageSubscribersManagementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!packageId) {
      setData(null)
      setIsLoading(false)
      setError('Missing package')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const next = await packageSubscribersManagementService.getPackageSubscribersData(
        packageId,
        locale,
        t,
      )
      setData(next)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load package subscribers',
      )
    } finally {
      setIsLoading(false)
    }
  }, [packageId, locale, t])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
