import { useEffect, useState } from 'react'

export type HiddenCollection =
  | 'drivers'
  | 'vehicles'
  | 'routes'
  | 'promos'
  | 'packages'
  | 'templates'

type HiddenStore = Record<HiddenCollection, string[]>

const STORAGE_KEY = 'td.session.hidden-records.v1'

const listeners = new Set<() => void>()

function emptyStore(): HiddenStore {
  return {
    drivers: [],
    vehicles: [],
    routes: [],
    promos: [],
    packages: [],
    templates: [],
  }
}

function normalizeKey(value: string | number): string {
  return String(value).trim()
}

function readStore(): HiddenStore {
  const store = emptyStore()
  if (typeof sessionStorage === 'undefined') return store
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return store
    const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>
    for (const key of Object.keys(store) as HiddenCollection[]) {
      const value = parsed[key]
      if (!Array.isArray(value)) continue
      store[key] = value.map((item) => String(item)).filter(Boolean)
    }
  } catch {
    return store
  }
  return store
}

function writeStore(store: HiddenStore) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore quota / private-mode failures; in-memory listeners still update the UI.
  }
}

function notifyHiddenRecords() {
  listeners.forEach((listener) => listener())
}

export function phoneHideKey(phone?: string | null): string | null {
  if (!phone) return null
  const compact = phone.replace(/[\s-]/g, '')
  return compact ? `phone:${compact}` : null
}

export function hideRecords(
  collection: HiddenCollection,
  ids: Array<string | number | null | undefined>,
) {
  const keys = ids
    .filter((value): value is string | number => value != null && String(value).trim() !== '')
    .map(normalizeKey)
  if (keys.length === 0) return

  const store = readStore()
  const next = new Set(store[collection])
  for (const key of keys) next.add(key)
  store[collection] = [...next]
  writeStore(store)
  notifyHiddenRecords()
}

export function hasHiddenRecords(collection: HiddenCollection): boolean {
  return (readStore()[collection] ?? []).length > 0
}

export function filterHiddenRecords<T>(
  collection: HiddenCollection,
  items: T[],
  getIds: (item: T) => Array<string | number | null | undefined>,
): T[] {
  const hidden = new Set(readStore()[collection] ?? [])
  if (hidden.size === 0) return items
  return items.filter((item) => {
    const ids = getIds(item)
    return !ids.some((id) => id != null && String(id).trim() !== '' && hidden.has(normalizeKey(id)))
  })
}

export async function hideThenTry(
  collection: HiddenCollection,
  ids: Array<string | number | null | undefined>,
  request: () => Promise<void>,
): Promise<void> {
  hideRecords(collection, ids)
  try {
    await request()
  } catch {
    // Keep the row hidden for this browser session even if the API list is stale.
  }
}

export function subscribeHiddenRecords(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useHiddenRecordsRevision(): number {
  const [revision, setRevision] = useState(0)
  useEffect(() => subscribeHiddenRecords(() => setRevision((value) => value + 1)), [])
  return revision
}
