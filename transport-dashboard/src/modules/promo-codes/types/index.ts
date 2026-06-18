export type PromoCodeType = 'percentage' | 'fixed' | string

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export type PromoCodeConditions = {
  minTicketPrice: number | null
  validDays: Weekday[]
}

export type CompanyPromoCode = {
  id: number
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  code: string
  type: PromoCodeType
  value: number
  maxDiscountAmount: number | null
  routeId: number | null
  routeName: string | null
  maxUses: number | null
  maxUsesPerUser: number | null
  conditions: PromoCodeConditions
  validFrom: string
  validTo: string
  isActive: boolean
  usesCount: number | null
}

export type PromoCodeInput = {
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  code: string
  type: string
  value: number
  max_discount_amount: number | null
  route_id: number | null
  max_uses: number | null
  max_uses_per_user: number | null
  conditions: {
    min_ticket_price?: number
    valid_days?: Weekday[]
  }
  valid_from: string
  valid_to: string
  is_active: boolean
}

export type PromoCodesStatVariant = 'primary' | 'success' | 'warning' | 'info'

export type PromoCodesStatCard = {
  id: string
  titleKey: string
  value: string
  variant: PromoCodesStatVariant
}

export type PromoCodesManagementData = {
  stats: PromoCodesStatCard[]
  promoCodes: CompanyPromoCode[]
}
