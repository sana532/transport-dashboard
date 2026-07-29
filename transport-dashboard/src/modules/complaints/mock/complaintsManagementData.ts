import {
  complaintTypeLabels,
  type ComplaintManagementRow,
  type ComplaintStatus,
  type ComplaintType,
} from '@/modules/complaints/types'

const types: ComplaintType[] = [
  'service_quality',
  'delay',
  'driver_behavior',
  'vehicle_condition',
  'booking_issue',
  'safety_concern',
]

const statuses: ComplaintStatus[] = ['open', 'in_progress', 'resolved']

const names = [
  'Sarah Johnson',
  'Michael Chen',
  'Emma Wilson',
  'James Rivera',
  'Olivia Park',
  'Daniel Brooks',
  'Ava Thompson',
  'Noah Martinez',
  'Mia Foster',
  'Ethan Lee',
  'Sophia Nguyen',
  'Lucas Wright',
  'Isabella Cruz',
  'Mason Patel',
  'Charlotte Kim',
  'Benjamin Scott',
  'Amelia Ross',
  'Henry Adams',
  'Harper Bell',
  'Jack Cooper',
  'Evelyn Reed',
  'Liam Turner',
  'Grace Morgan',
  'Alexander Hughes',
]

const dates = [
  'Dec 15, 2024',
  'Dec 14, 2024',
  'Dec 13, 2024',
  'Dec 12, 2024',
  'Dec 11, 2024',
  'Dec 10, 2024',
  'Dec 9, 2024',
  'Dec 8, 2024',
]

const detailTimes = [
  'March 14, 2024 at 2:30 PM',
  'March 13, 2024 at 10:45 AM',
  'March 12, 2024 at 9:15 AM',
  'March 11, 2024 at 4:20 PM',
  'March 10, 2024 at 8:00 AM',
  'March 9, 2024 at 1:10 PM',
  'March 8, 2024 at 6:40 PM',
  'March 7, 2024 at 11:25 AM',
]

const tripRoutes = [
  'Downtown to Airport',
  'Central Station to Uptown',
  'Harbor Terminal to Campus',
  'Mall District to Residential North',
]

const driverNames = [
  'Michael Rodriguez',
  'James Rivera',
  'Sarah Chen',
  'David Okonkwo',
  'Lisa Park',
]

function buildRow(index: number): ComplaintManagementRow {
  const num = index + 1
  const id = `cmp-${String(num).padStart(3, '0')}`
  const driver = driverNames[index % driverNames.length]!

  return {
    id,
    complaintCode: `CMP-2024-${String(num).padStart(4, '0')}`,
    passengerName: names[index % names.length]!,
    phone: index === 0 ? '+1 (555) 123-4567' : `+1 234 567 ${String(8900 + index).slice(-4)}`,
    type: types[index % types.length]!,
    categoryLabel: complaintTypeLabels[types[index % types.length]!],
    reportedAtLabel: dates[index % dates.length]!,
    status: statuses[index % statuses.length]!,
    subject: 'Passenger feedback',
    body: 'Details pending review.',
    passengerId: `PSG-2024-${String(150 + num).padStart(4, '0')}`,
    reportedAtDetailLabel: detailTimes[index % detailTimes.length]!,
    relatedTripCode: `TRP-2024-${String(1156 + index).padStart(4, '0')}`,
    relatedTripRoute: tripRoutes[index % tripRoutes.length]!,
    assignedDriverName: driver,
    description: `The passenger reported that the bus arrived ${20 + (index % 15)} minutes late at the pickup stop without adequate prior notice. They also stated that the driver was ${index % 2 === 0 ? 'dismissive' : 'rushed'} when asked about the delay, and that the vehicle interior could have been cleaner after the previous trip. They are requesting clearer communication on future delays and improved punctuality and service quality.`,
    adminNotes: `Contacted driver ${driver} regarding the incident. ${index % 3 === 0 ? 'Driver acknowledged traffic on the route. Offered the passenger a complimentary ride credit.' : 'Documentation forwarded to operations for standard review.'} ${index % 2 === 0 ? 'Follow-up scheduled with the passenger next week.' : 'No further action until passenger responds.'}`,
    attachments: [],
  }
}

export const complaintsManagementMockRows: ComplaintManagementRow[] = Array.from(
  { length: 24 },
  (_, i) => buildRow(i),
)
