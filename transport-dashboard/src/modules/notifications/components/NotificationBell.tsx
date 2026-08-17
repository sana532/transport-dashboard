import { Bell } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  notificationDestination,
  useNotificationAction,
} from '@/modules/notifications/hooks/useNotificationAction'
import { useNotifications } from '@/modules/notifications/components/NotificationsProvider'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/utils/cn'

type NotificationBellProps = {
  variant?: 'company' | 'neutral'
}

function formatWhen(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function NotificationBell({ variant = 'company' }: NotificationBellProps) {
  const { t } = useTranslation()
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    isOpen,
    setIsOpen,
    refresh,
    enablePushNotifications,
    markAllAsRead,
  } = useNotifications()
  const { openNotification, audience, listPath } = useNotificationAction()
  const panelRef = useRef<HTMLDivElement>(null)
  const isCompany = variant === 'company'

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isOpen, setIsOpen])

  const handleToggle = () => {
    const next = !isOpen
    setIsOpen(next)
    if (!next) return

    const runAfterPermission = () => {
      void enablePushNotifications()
      void refresh()
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission().then(runAfterPermission)
      return
    }

    runAfterPermission()
  }

  return (
    <div ref={panelRef} className="relative me-2">
      <Button
        type="button"
        variant="ghost"
        aria-label={t('notifications.bellAria')}
        aria-expanded={isOpen}
        onClick={handleToggle}
        className={cn(
          'relative',
          isCompany
            ? 'text-white hover:bg-white/10 focus-visible:ring-white/40'
            : undefined,
        )}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div
          className={cn(
            'absolute end-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-lg',
            isCompany
              ? 'border-white/15 bg-[#243217] text-white'
              : 'border-border bg-surface text-text-primary',
          )}
        >
          <div
            className={cn(
              'flex items-center justify-between border-b px-4 py-3',
              isCompany ? 'border-white/10' : 'border-border',
            )}
          >
            <p className="text-sm font-semibold">{t('notifications.title')}</p>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'h-8 px-2 text-xs',
                isCompany ? 'text-white/90 hover:bg-white/10' : undefined,
              )}
              onClick={() => void markAllAsRead()}
              disabled={unreadCount === 0}
            >
              {t('notifications.markAll')}
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm opacity-80">{t('notifications.loading')}</p>
            ) : null}

            {error ? (
              <p className="px-4 py-6 text-sm text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            {!isLoading && !error && notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm opacity-80">{t('notifications.empty')}</p>
            ) : null}

            {notifications.map((item) => {
              const isUnread = !item.readAt
              const isClickable = Boolean(notificationDestination(item, audience))
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    'flex w-full flex-col gap-1 border-b px-4 py-3 text-start transition-colors last:border-b-0',
                    isClickable && 'cursor-pointer',
                    isCompany
                      ? cn(
                          'border-white/10 hover:bg-white/5',
                          isUnread && 'bg-white/10',
                        )
                      : cn(
                          'border-border hover:bg-surface-muted',
                          isUnread && 'bg-surface-muted/70',
                        ),
                  )}
                  onClick={() => {
                    void openNotification(item, {
                      onBeforeNavigate: () => setIsOpen(false),
                    })
                  }}
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.body ? (
                    <span className="text-xs opacity-80">{item.body}</span>
                  ) : null}
                  {item.createdAt ? (
                    <span className="text-[11px] opacity-60">{formatWhen(item.createdAt)}</span>
                  ) : null}
                </button>
              )
            })}

            <div
              className={cn(
                'border-t px-4 py-2',
                isCompany ? 'border-white/10' : 'border-border',
              )}
            >
              <Link
                to={listPath}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'block rounded-lg px-2 py-2 text-center text-xs font-semibold transition-colors',
                  isCompany
                    ? 'text-white/90 hover:bg-white/10'
                    : 'text-brand-primary hover:bg-surface-muted',
                )}
              >
                {t('notifications.viewAll')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
