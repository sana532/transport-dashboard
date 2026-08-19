export function parseContentDispositionFileName(header: string | undefined): string | null {
  if (!header) return null

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].replace(/["']/g, '').trim())
    } catch {
      return utf8[1].replace(/["']/g, '').trim()
    }
  }

  const quoted = /filename="([^"]+)"/i.exec(header)
  if (quoted?.[1]) return quoted[1].trim()

  const plain = /filename=([^;]+)/i.exec(header)
  return plain?.[1]?.replace(/["']/g, '').trim() || null
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Open a signed file URL in a new tab. Do not fetch it — R2/S3 blocks CORS. */
export function triggerUrlDownload(url: string, fileName?: string): void {
  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener noreferrer'
  link.target = '_blank'
  const sameOrigin = url.startsWith(window.location.origin) || url.startsWith('blob:')
  if (fileName && sameOrigin) link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export async function readBlobErrorMessage(blob: Blob, fallback: string): Promise<string> {
  try {
    const text = await blob.text()
    if (!text.trim()) return fallback
    const parsed = JSON.parse(text) as { message?: string; error?: string }
    if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message.trim()
    if (typeof parsed.error === 'string' && parsed.error.trim()) return parsed.error.trim()
  } catch {
    /* not JSON */
  }
  return fallback
}
