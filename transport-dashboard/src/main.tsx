import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/modules/auth/components/AuthProvider'
import { NotificationsProvider } from '@/modules/notifications/components/NotificationsProvider'
import { PreferencesProvider } from '@/shared/preferences/PreferencesProvider'
import { queryClient } from '@/shared/query/queryClient'
import { ToastProvider } from '@/shared/ui/Toast'
import { ConfirmDialogProvider } from '@/shared/ui/ConfirmDialog'
import '@/shared/i18n/config'
import App from '@/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <ConfirmDialogProvider>
                <NotificationsProvider>
                  <App />
                </NotificationsProvider>
              </ConfirmDialogProvider>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </PreferencesProvider>
    </QueryClientProvider>
  </StrictMode>,
)
