import { createContext } from 'react'
import type { UserRole } from '@/modules/auth/types'

export type AuthContextValue = {
  token: string | null
  role: UserRole | null
  isAuthenticated: boolean
  login: (token: string, role: UserRole) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
