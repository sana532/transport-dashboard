import { useCallback, useEffect, useState } from 'react'
import { platformUsersService } from '@/modules/users/services/platformUsersService'
import type { PlatformUser, PlatformUsersListQuery } from '@/modules/users/types'

export function usePlatformUsers(query?: PlatformUsersListQuery) {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 0,
    total: 0,
    from: 0,
    to: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const page = query?.page ?? 1
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
      const result = await platformUsersService.listUsers({
        page,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        company_id: companyId,
        min_score: minScore,
        max_score: maxScore,
        admin_flagged: adminFlagged,
        is_banned: isBanned,
      })
      setUsers(result.users)
      setPagination({
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        perPage: result.perPage,
        total: result.total,
        from: result.from,
        to: result.to,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
      setUsers([])
      setPagination((previous) => ({ ...previous, from: 0, to: 0 }))
    } finally {
      setIsLoading(false)
    }
  }, [page, search, role, status, companyId, minScore, maxScore, adminFlagged, isBanned])

  useEffect(() => {
    void load()
  }, [load])

  return { users, pagination, isLoading, error, reload: load }
}
