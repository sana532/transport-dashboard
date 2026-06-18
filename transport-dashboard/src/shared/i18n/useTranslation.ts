import { useMemo } from 'react'
import { useTranslation as useI18nextTranslation } from 'react-i18next'
import type { AppLocale } from '@/shared/i18n/messages'

export function useTranslation() {
  const { t, i18n } = useI18nextTranslation()

  const locale = useMemo<AppLocale>(
    () => (i18n.language === 'ar' ? 'ar' : 'en'),
    [i18n.language],
  )

  return { t, locale }
}
