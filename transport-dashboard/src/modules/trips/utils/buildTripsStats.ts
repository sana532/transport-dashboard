import {
  TripsIcons,
  type TripsStatCard,
} from '@/modules/trips/types'
import type { CompanyTrip } from '@/modules/trips/types/companyTrip'
import { isArchivedTrip } from '@/modules/trips/utils/tripStatus'

type Translate = (key: string, params?: Record<string, string | number>) => string

export function buildTripsStats(trips: CompanyTrip[], t: Translate): TripsStatCard[] {
  const upcoming = trips.filter((trip) => !isArchivedTrip(trip.status))
  const archived = trips.filter((trip) => isArchivedTrip(trip.status))

  const scheduled = upcoming.filter((trip) => trip.status === 'scheduled').length
  const active = upcoming.filter((trip) => trip.status === 'active').length
  const completed = archived.filter((trip) => trip.status === 'completed').length
  const cancelled = archived.filter((trip) => trip.status === 'cancelled').length

  return [
    {
      id: 'total',
      title: t('trips.stats.total.title'),
      value: String(upcoming.length),
      note: t('trips.stats.total.note'),
      trend: '',
      Icon: TripsIcons.Total,
      variant: 'primary',
    },
    {
      id: 'scheduled',
      title: t('trips.stats.scheduled.title'),
      value: String(scheduled),
      note: t('trips.stats.scheduled.note', { active }),
      trend: '',
      Icon: TripsIcons.Active,
      variant: 'info',
    },
    {
      id: 'completed',
      title: t('trips.stats.completed.title'),
      value: String(completed),
      note: t('trips.stats.completed.note'),
      trend: '',
      Icon: TripsIcons.Completed,
      variant: 'success',
    },
    {
      id: 'cancelled',
      title: t('trips.stats.cancelled.title'),
      value: String(cancelled),
      note: t('trips.stats.cancelled.note'),
      trend: '',
      Icon: TripsIcons.Cancelled,
      variant: 'danger',
    },
  ]
}
