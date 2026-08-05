import { useTranslation } from '@/shared/i18n/useTranslation'

/** Translates API role slugs, falling back to the raw slug for unknown roles */
export function useUserRoleLabel() {
  const { t } = useTranslation()
  return (role: string) => {
    if (!role) return '—'
    const key = `admin.users.role.${role}`
    const translated = t(key)
    return translated === key ? role : translated
  }
}
