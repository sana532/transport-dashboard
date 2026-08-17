import { useState } from 'react'
import { Bell } from 'lucide-react'
import {
  useNotificationsPage,
  type NotificationReadFilter,
} from '@/modules/notifications/hooks/useNotificationsPage'
import {
  notificationDestination,
  useNotificationAction,
} from '@/modules/notifications/hooks/useNotificationAction'
import { useNotifications } from '@/modules/notifications/components/NotificationsProvider'
import type { AppNotification } from '@/modules/notifications/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'

const PAGE_SIZE = 12

const filterOptions: NotificationReadFilter[] = ['all', 'unread', 'read']

function formatWhen(value: string | null, locale: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function NotificationsLoadingBody() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="h-20 animate-pulse rounded-xl bg-surface-muted" />
      ))}
    </div>
  )
}

function NotificationsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm text-red-700" role="alert">
          {message}
        </p>
        <Button
          onClick={onRetry}
          className="bg-brand-primary text-white hover:bg-brand-primary-dark"
        >
          {t('common.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function NotificationsPage() {
  const { t, locale } = useTranslation()
  const { refreshUnreadCount } = useNotifications()
  const { openNotification, audience } = useNotificationAction()
  const [filter, setFilter] = useState<NotificationReadFilter>('all')
  const [page, setPage] = useState(1)
  const { notifications, isLoading, error, reload, markAsRead, markAllAsRead } =
    useNotificationsPage(filter)

  const pageCount = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const sliceStart = (safePage - 1) * PAGE_SIZE
  const pageRows = notifications.slice(sliceStart, sliceStart + PAGE_SIZE)
  const unreadOnPage = notifications.filter((item) => !item.readAt).length

  const handleFilterChange = (next: NotificationReadFilter) => {
    setFilter(next)
    setPage(1)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
    await refreshUnreadCount()
  }

  const handleOpen = (item: AppNotification) => {
    void openNotification(item, { markRead: handleMarkAsRead })
  }

  const handleMarkAll = async () => {
    await markAllAsRead()
    await refreshUnreadCount()
  }

  if (error && notifications.length === 0 && !isLoading) {
    return (
      <NotificationsErrorState
        message={error ?? t('notifications.errorUnavailable')}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight text-[var(--title-h1)]">
            {t('notifications.pageTitle')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t(
              audience === 'admin'
                ? 'notifications.pageSubtitleAdmin'
                : 'notifications.pageSubtitle',
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-brand-primary/35 text-brand-primary hover:bg-brand-primary/10"
          onClick={() => void handleMarkAll()}
          disabled={unreadOnPage === 0 && filter !== 'unread'}
        >
          {t('notifications.markAll')}
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col gap-4 border-b border-surface-muted pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-5 w-5 text-brand-primary" aria-hidden />
            {t('notifications.listTitle')}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option}
                type="button"
                variant={filter === option ? 'primary' : 'outline'}
                className={cn(
                  'h-8 px-3 text-xs',
                  filter === option
                    ? 'bg-brand-primary text-white hover:bg-brand-primary-dark'
                    : undefined,
                )}
                onClick={() => handleFilterChange(option)}
              >
                {t(`notifications.filter.${option}`)}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading && notifications.length === 0 ? (
            <div className="p-6">
              <NotificationsLoadingBody />
            </div>
          ) : null}

          {!isLoading && notifications.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-text-muted">
              {t('notifications.empty')}
            </p>
          ) : null}

          {notifications.length > 0 ? (
            <ul className="divide-y divide-surface-muted">
              {pageRows.map((item) => {
                const isUnread = !item.readAt
                const isClickable = Boolean(notificationDestination(item, audience))
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full flex-col gap-1 px-6 py-4 text-start transition-colors hover:bg-surface-muted/60',
                        isUnread && 'bg-brand-primary/5',
                        isClickable && 'cursor-pointer',
                      )}
                      onClick={() => handleOpen(item)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold text-text-primary">
                          {item.title}
                        </span>
                        {isUnread ? (
                          <span className="shrink-0 rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            {t('notifications.unreadBadge')}
                          </span>
                        ) : null}
                      </div>
                      {item.body ? (
                        <span className="text-sm text-text-secondary">{item.body}</span>
                      ) : null}
                      {item.createdAt ? (
                        <span className="text-xs text-text-muted">
                          {formatWhen(item.createdAt, locale)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}

          {pageCount > 1 ? (
            <div className="flex items-center justify-between border-t border-surface-muted px-6 py-4">
              <p className="text-sm text-text-muted">
                {t('notifications.pagination', {
                  from: sliceStart + 1,
                  to: sliceStart + pageRows.length,
                  total: notifications.length,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
