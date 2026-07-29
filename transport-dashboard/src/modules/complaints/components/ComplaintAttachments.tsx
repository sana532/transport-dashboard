import { ExternalLink } from 'lucide-react'
import type { ComplaintAttachment } from '@/modules/complaints/types'
import { useMediaImageSrc } from '@/shared/hooks/useMediaImageSrc'
import { useTranslation } from '@/shared/i18n/useTranslation'

function AttachmentImage({ attachment }: { attachment: ComplaintAttachment }) {
  const { t } = useTranslation()
  const { src, failed, onError } = useMediaImageSrc(attachment.url)
  const isImage = attachment.mimeType.startsWith('image/')

  if (!isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-border/30 hover:text-text-primary"
      >
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{attachment.fileName}</span>
      </a>
    )
  }

  if (failed || !src) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted px-3 text-center text-xs text-text-muted hover:text-text-secondary"
      >
        {t('complaintDetails.viewAttachment')}
      </a>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-lg border border-border bg-surface-muted"
      title={attachment.fileName}
    >
      <img
        src={src}
        alt={attachment.fileName}
        onError={onError}
        className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
      />
      <p className="truncate px-2 py-1.5 text-xs text-text-muted">{attachment.fileName}</p>
    </a>
  )
}

type ComplaintAttachmentsProps = {
  attachments: ComplaintAttachment[]
}

export function ComplaintAttachments({ attachments }: ComplaintAttachmentsProps) {
  if (attachments.length === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {attachments.map((attachment) => (
        <AttachmentImage key={attachment.id} attachment={attachment} />
      ))}
    </div>
  )
}
