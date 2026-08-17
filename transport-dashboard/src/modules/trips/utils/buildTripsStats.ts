import {
  TripsIcons,
  type TripsStatCard,
  type TripsStatVariant,
} from '@/modules/trips/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import { isArchivedTrip } from '@/modules/trips/utils/tripStatus'

type Translate = (key: string, params?: Record<string, string | number>) => string

export type TripStatFilterId = 'all' | 'scheduled' | 'active' | 'archive'

export type TripsStatCardView = TripsStatCard & {
  filterId: TripStatFilterId
}

function pickCount(counts: Record<string, unknown> | null | undefined, ...keys: string[]): number | undefined {
  if (!counts) return undefined
  for (const key of keys) {
    const value = counts[key]
    if (value == null || value === '') continue
    const n = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export function buildTripsStats(
  trips: CompanyTrip[],
  t: Translate,
  counts?: Record<string, unknown> | null,
): TripsStatCardView[] {
  const upcomingLocal = trips.filter((trip) => !isArchivedTrip(trip.status))
  const archivedLocal = trips.filter((trip) => isArchivedTrip(trip.status))

  const upcoming = pickCount(counts, 'upcoming') ?? upcomingLocal.length
  const scheduled =
    pickCount(counts, 'scheduled') ??
    upcomingLocal.filter((trip) => trip.status === 'scheduled').length
  const active =
    pickCount(counts, 'active', 'in_progress') ??
    upcomingLocal.filter((trip) => trip.status === 'active').length
  const archivedCount =
    pickCount(counts, 'archive', 'archived') ??
    ((pickCount(counts, 'completed') != null || pickCount(counts, 'cancelled') != null)
      ? (pickCount(counts, 'completed') ?? 0) + (pickCount(counts, 'cancelled') ?? 0)
      : archivedLocal.length)

  const cards: Array<{
    filterId: TripStatFilterId
    titleKey: string
    noteKey: string
    value: number
    variant: TripsStatVariant
    Icon: TripsStatCard['Icon']
  }> = [
    {
      filterId: 'all',
      titleKey: 'trips.stats.total.title',
      noteKey: 'trips.stats.total.note',
      value: upcoming,
      variant: 'primary',
      Icon: TripsIcons.Total,
    },
    {
      filterId: 'scheduled',
      titleKey: 'trips.stats.scheduled.title',
      noteKey: 'trips.stats.scheduled.note',
      value: scheduled,
      variant: 'info',
      Icon: TripsIcons.Active,
    },
    {
      filterId: 'active',
      titleKey: 'trips.stats.active.title',
      noteKey: 'trips.stats.active.note',
      value: active,
      variant: 'success',
      Icon: TripsIcons.Running,
    },
    {
      filterId: 'archive',
      titleKey: 'trips.stats.archive.title',
      noteKey: 'trips.stats.archive.note',
      value: archivedCount,
      variant: 'danger',
      Icon: TripsIcons.Archive,
    },
  ]

  return cards.map((card) => ({
    id: card.filterId,
    filterId: card.filterId,
    title: t(card.titleKey),
    value: String(card.value),
    note: t(card.noteKey),
    trend: '',
    Icon: card.Icon,
    variant: card.variant,
  }))
}
