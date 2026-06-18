import { TripsIcons, type TripsManagementData } from '@/modules/trips/types'

/** Legacy mock — pages use `companyTripsService` when wired. */
export const tripsManagementMockData: TripsManagementData = {
  stats: [
    {
      id: 'total',
      title: 'Total',
      value: '0',
      note: 'All time trips',
      trend: '',
      Icon: TripsIcons.Total,
      variant: 'primary',
    },
    {
      id: 'scheduled',
      title: 'Scheduled',
      value: '0',
      note: '',
      trend: '',
      Icon: TripsIcons.Active,
      variant: 'info',
    },
    {
      id: 'completed',
      title: 'Completed',
      value: '0',
      note: '',
      trend: '',
      Icon: TripsIcons.Completed,
      variant: 'success',
    },
    {
      id: 'cancelled',
      title: 'Cancelled',
      value: '0',
      note: '',
      trend: '',
      Icon: TripsIcons.Cancelled,
      variant: 'danger',
    },
  ],
  defaultFilters: {
    search: '',
    dateRange: '',
    route: '',
    status: 'all',
  },
  recentTrips: [],
  archivedTrips: [],
}
