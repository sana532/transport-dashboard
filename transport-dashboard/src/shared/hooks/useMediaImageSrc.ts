import { useCallback, useEffect, useState } from 'react'

const blobCache = new Map<string, string>()

async function fetchWithAuth(url: string): Promise<string | null> {
  const token = localStorage.getItem('auth_token')
  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) return null
    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) return null
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

/**
 * Fast image display: uses the public URL directly in <img> (browser cache + parallel).
 * Only downloads via fetch+auth if the direct URL fails (private storage).
 */
export function useMediaImageSrc(url: string | undefined): {
  src: string | undefined
  failed: boolean
  onError: () => void
  retry: () => void
} {
  const [src, setSrc] = useState<string | undefined>(url)
  const [failed, setFailed] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [authTried, setAuthTried] = useState(false)

  useEffect(() => {
    setFailed(false)
    setAuthTried(false)
    if (!url) {
      setSrc(undefined)
      return
    }
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      setSrc(url)
      return
    }
    const cached = blobCache.get(url)
    setSrc(cached ?? url)
  }, [url, retryKey])

  const onError = useCallback(() => {
    if (!url) {
      setFailed(true)
      return
    }

    if (authTried) {
      setFailed(true)
      return
    }

    setAuthTried(true)

    const cached = blobCache.get(url)
    if (cached) {
      setSrc(cached)
      setFailed(false)
      return
    }

    void (async () => {
      const blobUrl = await fetchWithAuth(url)
      if (blobUrl) {
        blobCache.set(url, blobUrl)
        setSrc(blobUrl)
        setFailed(false)
        return
      }
      setFailed(true)
    })()
  }, [url, authTried])

  return {
    src,
    failed,
    onError,
    retry: () => setRetryKey((k) => k + 1),
  }
}
