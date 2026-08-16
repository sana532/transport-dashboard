import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { messages, type AppLocale } from '@/shared/i18n/messages'

export const STORAGE_LOCALE_KEY = 'transport_dashboard_locale'

export function readStoredLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(STORAGE_LOCALE_KEY)
    if (stored === 'ar' || stored === 'en') return stored
  } catch {
    // ignore storage read failures
  }
  return 'ar'
}

function readInitialLanguage(): AppLocale {
  return readStoredLocale()
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: messages.en },
      ar: { translation: messages.ar },
    },
    lng: readInitialLanguage(),
    fallbackLng: 'en',
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  })
}

export { i18n }

