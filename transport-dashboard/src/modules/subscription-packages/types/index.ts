import {
  CheckCircle2,
  Package,
  Plus,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { ID } from '@/shared/types'

export type SubscriptionPackageId = ID

/** Minimal shape for API / legacy hooks */
export type SubscriptionPackage = {
  id: SubscriptionPackageId
  name: string
  priceMonthly: number
  maxTrips: number
  isActive: boolean
}

export type PackageSubscriber = {
  id: ID
  organizationName: string
  packageId: SubscriptionPackageId
  subscribedAt: string
}

/** Billing cycle shown on dashboard cards */
export type PlanBilling = 'monthly' | 'yearly'

/** Header color family per plan (distinct from each other) */
export type PlanTheme = 'sky' | 'emerald' | 'violet' | 'amber' | 'indigo' | 'slate'

export type PlanCardStatus = 'active' | 'inactive'

/** Rich plan row for packages management UI (mock until API matches) */
export type SubscriptionPlanCard = {
  id: string
  name: string
  billing: PlanBilling
  status: PlanCardStatus
  price: number
  priceDisplay: string
  theme: PlanTheme
  features: string[]
  activeSubscribers: number
  /** Thick green border + badge example in designs */
  isPopular?: boolean
  savingsNote?: string
}

export type PackagesStatVariant = 'info' | 'success' | 'accent'

export type SubscriptionPlanType = 'multi_trip' | 'discount_pass'

/** Normalized plan from GET /company/subscription-plans */
export type CompanySubscriptionPlan = {
  id: number
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  price: number
  type: SubscriptionPlanType
  discountPercentage: number | null
  totalTrips: number | null
  validityDays: number
  maxTicketsPerTrip: number | null
  isActive: boolean
  activeSubscribers: number
}

export type SubscriptionPlanInput = {
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  price: number
  type: SubscriptionPlanType
  discount_percentage: number | null
  total_trips: number | null
  validity_days: number
  conditions: { max_tickets_per_trip: number }
  is_active: boolean
}

export type PackagesStatCard = {
  titleKey: string
  value: string
  noteKey: string
  variant: PackagesStatVariant
  Icon: LucideIcon
}

export type PackagesManagementData = {
  stats: PackagesStatCard[]
  plans: SubscriptionPlanCard[]
}

export const PackagesIcons = {
  Total: Package,
  Active: CheckCircle2,
  Subscribers: Users,
} as const

export type PackageSubscriberRowStatus = 'active' | 'expired'

export type PackageSubscriberRow = {
  id: string
  name: string
  phone: string
  avatarUrl?: string
  subscriptionDate: string
  expirationDate: string
  status: PackageSubscriberRowStatus
  /** Raw ISO/date from API — used for stats, not shown in UI */
  subscribedAtRaw?: string
}

export type PackageSubscribersStatVariant = 'info' | 'success' | 'danger' | 'month'

export type PackageSubscribersStatCard = {
  title: string
  value: string
  note: string
  variant: PackageSubscribersStatVariant
  Icon: LucideIcon
}

export type PackageSubscribersManagementData = {
  packageId: string
  packageTitle: string
  stats: PackageSubscribersStatCard[]
  rows: PackageSubscriberRow[]
  totalResults: number
  page: number
  pageSize: number
}

export const PackageSubscribersStatIcons = {
  Total: Users,
  Active: CheckCircle2,
  Expired: XCircle,
  Month: Plus,
} as const
