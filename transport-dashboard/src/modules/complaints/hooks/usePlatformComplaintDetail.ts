import { useCallback, useEffect, useState } from 'react'
import type { ComplaintManagementRow, ComplaintStatusUpdateInput } from '@/modules/complaints/types'
import { platformComplaintsService } from '@/modules/complaints/services/platformComplaintsService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function usePlatformComplaintDetail(complaintId: string | undefined) {
  const { locale } = useTranslation()
  const [row, setRow] = useState<ComplaintManagementRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  const updateStatus = useCallback(
    async (input: ComplaintStatusUpdateInput) => {
      if (!complaintId) throw new Error('Missing complaint reference')
      const numericId = Number(complaintId)
      if (!Number.isFinite(numericId)) throw new Error('Invalid complaint id')

      setIsSaving(true)
      try {
        const updated = await platformComplaintsService.updateComplaintStatus(
          numericId,
          input,
          locale,
        )
        setRow(updated)
        return updated
      } finally {
        setIsSaving(false)
      }
    },
    [complaintId, locale],
  )

  return { row, isLoading, isSaving, error, reload: load, updateStatus }
}
