type ApiValidationErrors = Record<string, string[]>

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return fallback
  }

  const response = (error as {
    response?: { status?: number; data?: { message?: string; errors?: ApiValidationErrors } }
  }).response

  const data = response?.data

  if (response?.status === 401) {
    return 'Session expired. Sign out and sign in again.'
  }

  if (response?.status === 403) {
    return (
      (typeof data?.message === 'string' && data.message.trim()) ||
      'You are not allowed to update this driver. Sign in with the company account that owns this driver.'
    )
  }

  if (data?.errors) {
    const messages = Object.entries(data.errors).flatMap(([field, msgs]) =>
      Array.isArray(msgs) ? msgs.map((msg) => `${field}: ${msg}`) : [],
    )
    if (messages.length) return messages.join(' · ')
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }

  return fallback
}
