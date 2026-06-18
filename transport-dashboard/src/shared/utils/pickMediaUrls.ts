import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl'

const URL_KEYS = [
  'original_url',
  'full_url',
  'url',
  'preview_url',
  'path',
  'file_path',
  'src',
  'href',
  'image',
  'image_url',
  'photo',
  'photo_url',
  'thumbnail',
  'thumbnail_url',
] as const

const LINK_KEYS = ['full', 'original', 'preview', 'download', 'self'] as const

function guessUrlsFromFileName(
  fileName: string,
  context?: { parentId?: number; mediaId?: number; collection?: string },
): string[] {
  const collection = context?.collection ?? 'photos'
  const guesses = [
    context?.mediaId != null ? `storage/${context.mediaId}/${fileName}` : null,
    context?.parentId != null ? `storage/vehicles/${context.parentId}/${fileName}` : null,
    context?.parentId != null ? `storage/${collection}/${context.parentId}/${fileName}` : null,
    `storage/${collection}/${fileName}`,
    `storage/${fileName}`,
    fileName,
  ]
  return guesses
    .map((g) => resolveMediaUrl(g))
    .filter((url): url is string => Boolean(url))
}

export function extractMediaUrl(
  value: unknown,
  context?: { parentId?: number; collection?: string },
): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return resolveMediaUrl(value)
  if (typeof value !== 'object') return undefined

  const record = value as Record<string, unknown>

  for (const key of URL_KEYS) {
    const raw = record[key]
    if (typeof raw === 'string') {
      const resolved = resolveMediaUrl(raw)
      if (resolved) return resolved
    }
  }

  const fileName = typeof record.file_name === 'string' ? record.file_name : null
  if (fileName) {
    const mediaId = typeof record.id === 'number' ? record.id : Number(record.id)
    const fromFile = guessUrlsFromFileName(fileName, {
      parentId: context?.parentId,
      mediaId: Number.isFinite(mediaId) ? mediaId : undefined,
      collection:
        typeof record.collection_name === 'string' ? record.collection_name : context?.collection,
    })
    if (fromFile[0]) return fromFile[0]
  }

  if (record.links && typeof record.links === 'object') {
    const links = record.links as Record<string, unknown>
    for (const key of LINK_KEYS) {
      if (typeof links[key] === 'string') {
        const resolved = resolveMediaUrl(links[key])
        if (resolved) return resolved
      }
    }
  }

  if (record.attributes && typeof record.attributes === 'object') {
    return extractMediaUrl(record.attributes, context)
  }

  return undefined
}

function walkMediaNode(
  node: unknown,
  urls: string[],
  seen: Set<string>,
  context?: { parentId?: number; collection?: string },
) {
  if (node == null) return

  if (typeof node === 'string') {
    const resolved = resolveMediaUrl(node)
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved)
      urls.push(resolved)
    }
    return
  }

  if (Array.isArray(node)) {
    for (const item of node) walkMediaNode(item, urls, seen, context)
    return
  }

  if (typeof node !== 'object') return

  const record = node as Record<string, unknown>

  const values = Object.values(record)
  const looksLikeDictionary =
    values.length > 0 &&
    values.every((v) => typeof v === 'object' || typeof v === 'string') &&
    !('id' in record && 'plate_number' in record)

  if (looksLikeDictionary && !Array.isArray(node)) {
    for (const item of values) walkMediaNode(item, urls, seen, context)
  }

  const direct = extractMediaUrl(record, context)
  if (direct && !seen.has(direct)) {
    seen.add(direct)
    urls.push(direct)
  }

  for (const key of ['data', 'photos', 'images', 'media', 'items', 'results'] as const) {
    if (key in record) walkMediaNode(record[key], urls, seen, context)
  }
}

/** Collects resolved image URLs from one or more API fields (arrays, objects, strings). */
export function pickMediaUrls(
  ...sources: unknown[]
): string[] {
  const last = sources[sources.length - 1]
  const context =
    last && typeof last === 'object' && !Array.isArray(last) && 'parentId' in (last as object)
      ? (last as { parentId?: number; collection?: string })
      : undefined

  const dataSources = context ? sources.slice(0, -1) : sources
  const urls: string[] = []
  const seen = new Set<string>()
  for (const source of dataSources) {
    walkMediaNode(source, urls, seen, context)
  }
  return urls
}

export function pickMediaUrlsForVehicle(
  record: Record<string, unknown>,
  vehicleId: number,
): string[] {
  return pickMediaUrls(
    record.photos,
    record.photo,
    record.media,
    record.images,
    record.vehicle_model,
    { parentId: vehicleId, collection: 'photos' },
  )
}

export function firstMediaUrl(...sources: unknown[]): string | undefined {
  return pickMediaUrls(...sources)[0]
}
