import { useCallback, useEffect, useState } from 'react'
import { platformUsersService } from '@/modules/users/services/platformUsersService'
import type {
  PlatformUser,
  UpdatePlatformUserInput,
  UpdateUserReliabilityInput,
  UserReliability,
} from '@/modules/users/types'

export function usePlatformUserDetail(userId: string | undefined) {
  const [user, setUser] = useState<PlatformUser | null>(null)
  const [reliability, setReliability] = useState<UserReliability | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) {
      setError('Missing user reference')
      setUser(null)
      setReliability(null)
      setIsLoading(false)
      return
    }

    const numericId = Number(userId)
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setError('Invalid user id')
      setUser(null)
      setReliability(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const nextUser = await platformUsersService.getUser(numericId)
      setUser(nextUser)

      try {
        const nextReliability = await platformUsersService.getUserReliability(numericId)
        setReliability(nextReliability)
      } catch {
        setReliability({
          score: nextUser.score,
          admin_flagged: nextUser.admin_flagged,
          is_banned: nextUser.is_banned,
          banned_until: nextUser.banned_until,
          notes: null,
          raw: null,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
      setUser(null)
      setReliability(null)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const updateUser = useCallback(
    async (input: UpdatePlatformUserInput) => {
      if (!user) throw new Error('User not loaded')
      setIsSaving(true)
      try {
        const updated = await platformUsersService.updateUser(user.id, input)
        setUser(updated)
        return updated
      } finally {
        setIsSaving(false)
      }
    },
    [user],
  )

  const updateReliability = useCallback(
    async (input: UpdateUserReliabilityInput) => {
      if (!user) throw new Error('User not loaded')
      setIsSaving(true)
      try {
        const updated = await platformUsersService.updateUserReliability(user.id, input)
        setReliability(updated)
        setUser((prev) =>
          prev
            ? {
                ...prev,
                score: updated.score ?? prev.score,
                admin_flagged: updated.admin_flagged,
                is_banned: updated.is_banned,
              }
            : prev,
        )
        return updated
      } finally {
        setIsSaving(false)
      }
    },
    [user],
  )

  const resetReliability = useCallback(async () => {
    if (!user) throw new Error('User not loaded')
    setIsSaving(true)
    try {
      const updated = await platformUsersService.resetUserReliability(user.id)
      setReliability(updated)
      setUser((prev) =>
        prev
          ? {
              ...prev,
              score: updated.score ?? prev.score,
              admin_flagged: updated.admin_flagged,
              is_banned: updated.is_banned,
            }
          : prev,
      )
      return updated
    } finally {
      setIsSaving(false)
    }
  }, [user])

  return {
    user,
    reliability,
    isLoading,
    isSaving,
    error,
    reload: load,
    updateUser,
    updateReliability,
    resetReliability,
  }
}
