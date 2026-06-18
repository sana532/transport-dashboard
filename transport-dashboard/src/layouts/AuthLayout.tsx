import { Outlet } from 'react-router-dom'

/**
 * Auth routes (login) render full-viewport content from child pages.
 * Avoid extra chrome here so login can control layout (split column, etc.).
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-background">
      <Outlet />
    </div>
  )
}
