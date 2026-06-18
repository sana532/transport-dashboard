import { useState } from 'react'
import type { SubscriptionPackage } from '@/modules/subscription-packages/types'

export function useSubscriptionPackages() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  return { packages, isLoading, setPackages, setIsLoading }
}
