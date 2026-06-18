export type RouteTemplate = {
  id: string
  fromCity: string
  toCity: string
  defaultPrice: number
  restStops: string[]
}

export const routeTemplatesMockData: RouteTemplate[] = [
  {
    id: 'route-damascus-aleppo',
    fromCity: 'Damascus',
    toCity: 'Aleppo',
    defaultPrice: 120000,
    restStops: ['Homs', 'Hama'],
  },
  {
    id: 'route-damascus-homs',
    fromCity: 'Damascus',
    toCity: 'Homs',
    defaultPrice: 60000,
    restStops: ['Qalamoun Stop'],
  },
  {
    id: 'route-homs-aleppo',
    fromCity: 'Homs',
    toCity: 'Aleppo',
    defaultPrice: 80000,
    restStops: ['Hama'],
  },
]

