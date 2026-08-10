import {
  DriversIcons,
  type Driver,
  type DriversManagementData,
  type DriversStatCard,
} from '@/modules/drivers/types'
import { driversService } from '@/modules/drivers/services/driversService'
import { mapCompanyDriverToDriver } from '@/modules/drivers/utils/mapCompanyDriver'

type Translate = (key: string, params?: Record<string, string | number>) => string

function buildStats(drivers: Driver[], t: Translate): DriversStatCard[] {
  const total = drivers.length
  const available = drivers.filter((d) => d.status === 'Available').length
  const onTrip = drivers.filter((d) => d.status === 'On Trip').length
  const offDuty = drivers.filter((d) => d.status === 'Off Duty').length

  return [
    {
      title: t('drivers.stats.total'),
      value: String(total),
      note: t('drivers.stats.totalNote'),
      trend: '',
      Icon: DriversIcons.Total,
      variant: 'primary',
    },
    {
      title: t('drivers.stats.available'),
      value: String(available),
      note: t('drivers.stats.availableNote'),
      trend: '',
      Icon: DriversIcons.Available,
      variant: 'success',
    },
    {
      title: t('drivers.stats.onTrip'),
      value: String(onTrip),
      note: t('drivers.stats.onTripNote'),
      trend: '',
      Icon: DriversIcons.OnTrip,
      variant: 'info',
    },
    {
      title: t('drivers.stats.offDuty'),
      value: String(offDuty),
      note: t('drivers.stats.offDutyNote'),
      trend: '',
      Icon: DriversIcons.OffDuty,
      variant: 'neutral',
    },
  ]
}

export const driversManagementService = {
  async getDriversManagementData(t: Translate): Promise<DriversManagementData> {
    const rows = await driversService.listDrivers()
    const drivers = rows.map(mapCompanyDriverToDriver)

    return {
      stats: buildStats(drivers, t),
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
