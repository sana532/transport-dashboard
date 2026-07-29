import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/modules/auth/components/AuthProvider'
import { NotificationsProvider } from '@/modules/notifications/components/NotificationsProvider'
import { PreferencesProvider } from '@/shared/preferences/PreferencesProvider'
import '@/shared/i18n/config'
import App from '@/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <App />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </PreferencesProvider>
  </StrictMode>,
)
