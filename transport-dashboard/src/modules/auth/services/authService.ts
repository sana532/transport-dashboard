import type { AuthCredentials, UserRole } from '@/modules/auth/types'
import { api } from '@/services/api'

type LoginApiRole = {
  name: string
}

type LoginApiResponse = {
  access_token: string
  token_type: string
  expires_in: number
  user: {
    id: number
    company_id: number | null
    roles?: LoginApiRole[]
  }
}

function mapApiRolesToUserRole(roles: LoginApiRole[] | undefined): UserRole {
  const names = new Set((roles ?? []).map((r) => r.name))
  if (names.has('platform_admin')) return 'admin'
  return 'company'
}

export const authService = {
  async login(
    credentials: AuthCredentials,
  ): Promise<{ token: string; role: UserRole }> {
    const { email, password } = credentials
    const identifier = email.trim()
    if (!identifier || !password) {
      throw new Error('Identifier and password are required')
    }
    try {
      const { data } = await api.post<LoginApiResponse>('/auth/password/login', {
        identifier,
        password,
      })

      if (!data?.access_token) {
        throw new Error('Missing access token in login response')
      }

      const role = mapApiRolesToUserRole(data.user?.roles)
      return { token: data.access_token, role }
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message === 'string'
      ) {
        throw new Error(
          (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Sign in failed',
        )
      }
      throw new Error('Sign in failed')
    }
  },
}
