import { useCallback, useEffect, useState } from 'react'
import { platformUsersService } from '@/modules/users/services/platformUsersService'
import type { PlatformUser, PlatformUsersListQuery } from '@/modules/users/types'

export function usePlatformUsers(query?: PlatformUsersListQuery) {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const search = query?.search?.trim() ?? ''
  const role = query?.role ?? ''
  const status = query?.status ?? ''
  const companyId = query?.company_id
  const minScore = query?.min_score
  const maxScore = query?.max_score
  const adminFlagged = query?.admin_flagged
  const isBanned = query?.is_banned

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await platformUsersService.listUsers({
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        company_id: companyId,
        min_score: minScore,
        max_score: maxScore,
        admin_flagged: adminFlagged,
        is_banned: isBanned,
      })
      setUsers(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [search, role, status, companyId, minScore, maxScore, adminFlagged, isBanned])

  useEffect(() => {
    void load()
  }, [load])

  return { users, isLoading, error, reload: load }
}
