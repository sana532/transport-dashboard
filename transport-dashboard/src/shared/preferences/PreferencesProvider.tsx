import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppLocale } from '@/shared/i18n/messages'
import { i18n } from '@/shared/i18n/config'

export type ThemePreference = 'light' | 'dark'

const STORAGE_THEME = 'transport_dashboard_theme'
const STORAGE_LOCALE = 'transport_dashboard_locale'

function readStoredTheme(): ThemePreference | null {
  try {
    const v = localStorage.getItem(STORAGE_THEME)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return null
}

function readStoredLocale(): AppLocale | null {
  try {
    const v = localStorage.getItem(STORAGE_LOCALE)
    if (v === 'ar' || v === 'en') return v
  } catch {
    /* ignore */
  }
  return null
}

function initialTheme(): ThemePreference {
  const stored = readStoredTheme()
  if (stored) return stored
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function initialLocale(): AppLocale {
  return readStoredLocale() ?? 'ar'
}

function applyDomTheme(mode: ThemePreference) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode === 'dark' ? 'dark' : 'light'
}

function applyDomLocale(locale: AppLocale) {
  document.documentElement.lang = locale === 'ar' ? 'ar' : 'en'
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

type PreferencesContextValue = {
  locale: AppLocale
  setLocale: (next: AppLocale) => void
  theme: ThemePreference
  setTheme: (next: ThemePreference) => void
  toggleTheme: () => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale)
  const [theme, setThemeState] = useState<ThemePreference>(initialTheme)

  useLayoutEffect(() => {
    applyDomTheme(theme)
    try {
      localStorage.setItem(STORAGE_THEME, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useLayoutEffect(() => {
    applyDomLocale(locale)
    try {
      localStorage.setItem(STORAGE_LOCALE, locale)
    } catch {
      /* ignore */
    }
  }, [locale])

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next)
    void i18n.changeLanguage(next)
  }, [])

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ locale, setLocale, theme, setTheme, toggleTheme }),
    [locale, setLocale, theme, setTheme, toggleTheme],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider')
  }
  return ctx
}
