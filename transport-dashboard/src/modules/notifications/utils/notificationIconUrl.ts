/** Absolute icon URL — relative paths often fail on Windows OS toasts. */
export function notificationIconUrl(): string {
  if (typeof window === 'undefined') return '/notification-logo.png'
  return new URL('/notification-logo.png?v=3', window.location.origin).href
}
