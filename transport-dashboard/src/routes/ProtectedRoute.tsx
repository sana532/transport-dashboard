import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '@/modules/auth/types'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { paths } from '@/routes/paths'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace state={{ from: location }} />
  }

  return <Outlet />
}

type RoleRouteProps = {
  allow: UserRole[]
}

export function RoleRoute({ allow }: RoleRouteProps) {
  const { role } = useAuth()
  const location = useLocation()

  if (!role || !allow.includes(role)) {
    const fallback =
      role === 'admin' ? paths.admin.root : paths.company.root
    return <Navigate to={fallback} replace state={{ from: location }} />
  }

  return <Outlet />
}
