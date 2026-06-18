import type { ReactNode } from 'react'

type AuthNoticeProps = {
  children?: ReactNode
}

export function AuthNotice({ children }: AuthNoticeProps) {
  if (!children) return null
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
      {children}
    </p>
  )
}
