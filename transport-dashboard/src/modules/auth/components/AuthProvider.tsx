import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '@/modules/auth/context/auth-context'
import type { UserRole } from '@/modules/auth/types'
import { AUTH_UNAUTHORIZED_EVENT } from '@/services/api'
import { disconnectEcho } from '@/shared/realtime/echo'

const TOKEN_KEY = 'auth_token'
const LEGACY_ECHO_TOKEN_KEY = 'token'
const ROLE_KEY = 'auth_role'

function readStoredRole(): UserRole | null {
  const r = localStorage.getItem(ROLE_KEY)
  if (r === 'admin' || r === 'company') return r
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const authToken = localStorage.getItem(TOKEN_KEY)
    if (authToken && !localStorage.getItem(LEGACY_ECHO_TOKEN_KEY)) {
      localStorage.setItem(LEGACY_ECHO_TOKEN_KEY, authToken)
    }
    return authToken
  })
  const [role, setRole] = useState<UserRole | null>(() => {
    const storedRole = readStoredRole()
    if (storedRole) return storedRole
    // If token exists without role, force fresh login.
    if (localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
    }
    return null
  })

  const login = useCallback((newToken: string, newRole: UserRole) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(LEGACY_ECHO_TOKEN_KEY, newToken)
    localStorage.setItem(ROLE_KEY, newRole)
    setToken(newToken)
    setRole(newRole)
  }, [])

  const logout = useCallback(() => {
    disconnectEcho()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(LEGACY_ECHO_TOKEN_KEY)
    localStorage.removeItem(ROLE_KEY)
    setToken(null)
    setRole(null)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => logout()
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token && role),
      login,
      logout,
    }),
    [token, role, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
