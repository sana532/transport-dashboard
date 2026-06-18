import {
  DriversIcons,
  type Driver,
  type DriversManagementData,
  type DriversStatCard,
} from '@/modules/drivers/types'
import { driversService } from '@/modules/drivers/services/driversService'
import { mapCompanyDriverToDriver } from '@/modules/drivers/utils/mapCompanyDriver'

function buildStats(drivers: Driver[]): DriversStatCard[] {
  const total = drivers.length
  const available = drivers.filter((d) => d.status === 'Available').length
  const onTrip = drivers.filter((d) => d.status === 'On Trip').length
  const offDuty = drivers.filter((d) => d.status === 'Off Duty').length

  return [
    {
      title: 'Total Drivers',
      value: String(total),
      note: 'Registered accounts',
      trend: '',
      Icon: DriversIcons.Total,
      variant: 'primary',
    },
    {
      title: 'Available',
      value: String(available),
      note: 'Active profile',
      trend: '',
      Icon: DriversIcons.Available,
      variant: 'success',
    },
    {
      title: 'On Trip',
      value: String(onTrip),
      note: 'Currently driving',
      trend: '',
      Icon: DriversIcons.OnTrip,
      variant: 'info',
    },
    {
      title: 'Off Duty',
      value: String(offDuty),
      note: 'Inactive profile',
      trend: '',
      Icon: DriversIcons.OffDuty,
      variant: 'neutral',
    },
  ]
}

export const driversManagementService = {
  async getDriversManagementData(): Promise<DriversManagementData> {
    const rows = await driversService.listDrivers()
    const drivers = rows.map(mapCompanyDriverToDriver)

    return {
      stats: buildStats(drivers),
      drivers,
      defaultFilters: {
        search: '',
        status: 'All Status',
        experience: 'All Experience',
        licenseStatus: 'All License Status',
      },
    }
  },
}
