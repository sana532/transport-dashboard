import { useCallback, useEffect, useState } from 'react'
import type { ComplaintManagementRow, ComplaintStatusUpdateInput } from '@/modules/complaints/types'
import { complaintsManagementService } from '@/modules/complaints/services/complaintsManagementService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function useComplaintDetail(complaintId: string | undefined) {
  const { locale } = useTranslation()
  const [row, setRow] = useState<ComplaintManagementRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  const updateStatus = useCallback(
    async (input: ComplaintStatusUpdateInput) => {
      if (!complaintId) throw new Error('Missing complaint reference')
      setIsSaving(true)
      setError(null)
      try {
        const updated = await complaintsManagementService.updateComplaintStatus(
          complaintId,
          input,
          locale,
        )
        setRow(updated)
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update complaint status'
        setError(message)
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [complaintId, locale],
  )

  return { row, isLoading, isSaving, error, reload: load, updateStatus }
}
