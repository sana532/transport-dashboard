const SHOWN_KEY = 'notifications_shown_ids'
const SHOWN_TTL_MS = 90_000

type ShownMap = Record<string, number>

function readShown(): ShownMap {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ShownMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeShown(map: ShownMap) {
  try {
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify(map))
  } catch {
    // ignore quota / private mode
  }
}

/** Returns true once per id within TTL — used to stop toast/OS spam. */
export function claimNotificationAlert(id: string | null | undefined): boolean {
  const key = (id ?? '').trim()
  if (!key) return true

  const now = Date.now()
  const map = readShown()
  for (const [entryId, at] of Object.entries(map)) {
    if (now - at > SHOWN_TTL_MS) delete map[entryId]
  }

  if (map[key] != null && now - map[key] < SHOWN_TTL_MS) {
    writeShown(map)
    return false
  }

  map[key] = now
  writeShown(map)
  return true
}
