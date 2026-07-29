import { useCallback, useEffect, useState } from 'react'
import type { ComplaintManagementRow } from '@/modules/complaints/types'
import { platformComplaintsService } from '@/modules/complaints/services/platformComplaintsService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function usePlatformComplaintDetail(complaintId: string | undefined) {
  const { locale } = useTranslation()
  const [row, setRow] = useState<ComplaintManagementRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!complaintId) {
      setError('Missing complaint reference')
      setIsLoading(false)
      return
    }
    const numericId = Number(complaintId)
    if (!Number.isFinite(numericId)) {
      setError('Invalid complaint id')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const next = await platformComplaintsService.getComplaint(numericId, locale)
      setRow(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaint')
      setRow(null)
    } finally {
      setIsLoading(false)
    }
  }, [complaintId, locale])

  useEffect(() => {
    void load()
  }, [load])

  return { row, isLoading, error, reload: load }
}
