import { useState } from 'react'
import type { PackageSubscriber } from '@/modules/subscription-packages/types'

export function usePackageSubscribers() {
  const [subscribers, setSubscribers] = useState<PackageSubscriber[]>([])
  const [isLoading, setIsLoading] = useState(false)

  return { subscribers, isLoading, setSubscribers, setIsLoading }
}
