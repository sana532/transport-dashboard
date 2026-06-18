type ApiValidationErrors = Record<string, string[]>

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return fallback
  }

  const response = (error as {
    response?: { status?: number; data?: { message?: string; errors?: ApiValidationErrors } }
  }).response

  if (response?.status === 401) {
    return 'Session expired. Sign out and sign in again.'
  }

  const data = response?.data
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }

  if (data?.errors) {
    for (const messages of Object.values(data.errors)) {
      if (Array.isArray(messages) && messages[0]) return messages[0]
    }
  }

  return fallback
}
