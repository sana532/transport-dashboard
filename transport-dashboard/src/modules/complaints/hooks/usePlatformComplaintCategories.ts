import { useCallback, useEffect, useState } from 'react'
import type { ComplaintCategory } from '@/modules/complaints/types'
import {
  platformComplaintsService,
  type PlatformComplaintCategoryInput,
} from '@/modules/complaints/services/platformComplaintsService'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function usePlatformComplaintCategories() {
  const { locale } = useTranslation()
  const [categories, setCategories] = useState<ComplaintCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await platformComplaintsService.listCategories(locale)
      setCategories(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaint categories')
    } finally {
      setIsLoading(false)
    }
  }, [locale])

  useEffect(() => {
    void load()
  }, [load])

  const createCategory = useCallback(
    async (input: PlatformComplaintCategoryInput) => {
      const created = await platformComplaintsService.createCategory(input, locale)
      await load()
      return created
    },
    [load, locale],
  )

  const updateCategory = useCallback(
    async (id: number, input: PlatformComplaintCategoryInput) => {
      const updated = await platformComplaintsService.updateCategory(id, input, locale)
      await load()
      return updated
    },
    [load, locale],
  )

  const deleteCategory = useCallback(
    async (id: number) => {
      await platformComplaintsService.deleteCategory(id)
      await load()
    },
    [load],
  )

  return {
    categories,
    isLoading,
    error,
    reload: load,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
