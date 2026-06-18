import { useCallback, useEffect, useState } from 'react'
import type { ComplaintManagementRow } from '@/modules/complaints/types'
import { complaintsManagementService } from '@/modules/complaints/services/complaintsManagementService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function useComplaintDetail(complaintId: string | undefined) {
  const { locale } = useTranslation()
  const [row, setRow] = useState<ComplaintManagementRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!complaintId) {
      setRow(null)
      setError('Missing complaint reference')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const next = await complaintsManagementService.getComplaintById(complaintId, locale)
      setRow(next)
      if (!next) setError('Complaint not found')
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
